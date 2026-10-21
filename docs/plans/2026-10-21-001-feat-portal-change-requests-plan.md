---
title: "Portal Change Requests"
type: feat
status: active
date: 2026-10-21
origin: docs/brainstorms/2026-10-21-portal-change-requests-requirements.md
---

## Summary

Add a shared, ADMIN-only change-request channel to the mmc-next portal: a persistent note-submission widget tagged to whatever page an ADMIN is viewing, a shared Open/Done review list, and a best-effort email notification to Nathan on each submission.

## Problem Frame

Mike currently has no structured way to flag a page he wants changed while he's looking at it — anything he notices has to be relayed out-of-band and tracked manually. A lightweight, page-aware note-capture mechanism, feeding a single list Nathan can work through, closes that gap without adding process overhead for a two-person ADMIN workflow.

---

## Key Technical Decisions

- **Status as an enum, not a boolean.** `ChangeRequestStatus { OPEN DONE }` mirrors this repo's existing convention for small fixed-state fields (`WorkOrderStatus`, `ExtraType`, `ReceiptType`) rather than a plain `Boolean`, which this repo reserves for simple on/off flags (`active`).
- **Email failure never blocks the write.** `prisma.changeRequest.create()` is the sole determinant of the API's success response; `sendMail()` runs afterward in its own try/catch, logging failures rather than raising them. This deliberately diverges from the only existing precedent (`contact`/`quote` routes, where a mail failure blocks the whole request) because here the saved note matters independently of whether the notification fires (see origin: `docs/brainstorms/2026-10-21-portal-change-requests-requirements.md`).
- **Strict ADMIN-only enforcement, not ADMIN+MANAGER.** Every server-side check (both API routes, the review-list page, the nav entry) gates on `role === "ADMIN"` exactly. This diverges from the existing `adminOnly` nav-item convention in `PortalShell.tsx`, which currently permits both ADMIN and MANAGER — a deliberate narrower scope per the origin doc's access requirement, not an oversight.
- **Status toggle rolls back on failure.** Unlike the existing toggle pattern this repo already has (`MaterialSettings.tsx`, which fails silently with no rollback), a failed status-update here reverts the optimistic UI and surfaces an inline error — a silently-wrong Open/Done state misrepresents real work status for a shared two-person queue in a way a silently-wrong materials flag does not.
- **Widget stays open after a successful submit, field cleared.** Confirmed with Nathan — supports logging several notes back-to-back while walking a page without reopening the widget each time.
- **Notification goes to a new, dedicated recipient.** `CHANGE_REQUEST_NOTIFY_EMAIL=nathan@pcshards.com`, confirmed with Nathan, rather than reusing the `office@mikescleancut.com` address the contact/quote forms send to — keeps change-request notifications out of the client's general inbox.
- **Note capped at 2000 characters**, enforced client-side (soft, for UX) and server-side (hard, 422) — bounds email HTML size and list-row rendering without a length requirement ever being discussed as a product need.
- **Captured "page" is the raw pathname, no humanization.** `usePathname()`'s raw value (including dynamic-route IDs) is stored and displayed as-is. Avoids inventing a route-label registry that isn't part of this scope.
- **R7 resolved as sort order, not a separate filter control.** The origin doc left this as "Open items first, or a status filter." This plan commits to Open-first sort order (Done entries grouped below), with no separate filter toggle — avoids an interactive control with its own active/inactive states for a two-person list that's never going to be long.
- **The review list reads the database directly, not through a list API.** `GET /api/change-requests` is dropped — U5's server component queries Prisma directly, mirroring `time/log/page.tsx`. Keeping a standalone list endpoint with no real consumer (U4 only needs to POST) would have been dead code carrying its own test burden.
- **A failed/undeliverable notification is visible, not just logged.** `ChangeRequest` carries a `notifiedAt` timestamp set on a successful `sendMail()`; if it's null, the review list shows a small "notification failed" indicator. This turns a transient Graph API/mail failure from permanently silent into something either ADMIN will see next time they open the list — without building a retry queue, which isn't warranted at this scale.
- **Concurrent status edits are accepted as last-write-wins, not conflict-detected.** Two ADMINs toggling the same entry within seconds of each other is low-probability and low-harm at this scale (worst case: a toggle gets overwritten, immediately visible and re-toggleable) — no optimistic-concurrency field is added for this.

---

## Requirements

**Submission**

- R1. Any ADMIN-role user sees a persistent control, available on every `/portal/*` page, to submit a change-request note.
- R2. Submitting a note automatically captures the free-text note, the current page/route, the submitting user, and a timestamp — no extra fields required from the user.
- R3. On submission, Nathan receives an email notification (via the existing Graph API mail integration) containing the note text, page, submitter, and timestamp.

**Review & tracking**

- R4. A review list is available within the portal, visible to any ADMIN, showing all submitted change requests.
- R5. Each entry in the list shows its note, page, submitter, timestamp, and status (Open or Done).
- R6. Any ADMIN can change an entry's status between Open and Done.
- R7. The list makes Open items easy to find (Open items surfaced first, or a status filter).

**Access**

- R8. Only ADMIN-role users can see the submit control and the review list; MANAGER, FOREMAN, and CREW have no access to this feature.
- R9. The feature does not appear on the public marketing site — portal only.

---

## Output Structure

```
src/
  app/
    api/
      change-requests/
        route.ts              # POST create (no GET — U5 reads via Prisma directly)
        [id]/
          route.ts            # PATCH status
    portal/
      change-requests/
        page.tsx              # review list (server component, ADMIN-gated)
  components/
    portal/
      ChangeRequestWidget.tsx          # submit widget (client)
      change-requests/
        ChangeRequestStatusToggle.tsx  # status toggle (client)
  lib/
    schemas.ts                # + changeRequestCreateSchema, changeRequestStatusSchema (edit)
    constants.ts               # + STATUS_COLORS entries for OPEN/DONE (edit)
prisma/
  schema.prisma                # + ChangeRequest model, ChangeRequestStatus enum, Employee.changeRequests relation (edit)
  migrations/
    <timestamp>_add_change_requests/migration.sql
```

---

## Implementation Units

### U1. Data model: `ChangeRequest` and `ChangeRequestStatus`

- **Goal:** Add the Prisma model and enum backing change-request storage.
- **Requirements:** R2, R3, R5
- **Dependencies:** none
- **Files:** `prisma/schema.prisma` (two edits: the new model/enum, and the reciprocal relation array on `Employee`); new migration under `prisma/migrations/`
- **Approach:** Mirror `PunchRecord`'s shape — `id` (cuid), `employeeId` FK to `Employee` (the submitter), `note String`, `page String` (raw pathname), `status ChangeRequestStatus @default(OPEN)`, `notifiedAt DateTime?` (set when the notification email succeeds; null means either not-yet-attempted or failed — see U3), `createdAt DateTime @default(now())`. Add `enum ChangeRequestStatus { OPEN DONE }`. Add the reciprocal `changeRequests ChangeRequest[]` array field on the `Employee` model, matching every other one-to-many relation into `Employee` (e.g. `punchRecords PunchRecord[]`) — `prisma generate` fails fast and explicitly if this is omitted, but it's a real second edit, not a detail of the first. Follow existing `@map`/`@@map` snake_case column/table conventions.
- **Patterns to follow:** `PunchRecord` model in `prisma/schema.prisma` (single-owner relation, free-text note field, `createdAt`-only); `ExtraType` for enum style; the existing reciprocal-array convention on `Employee` for any new one-to-many relation into it.
- **Test scenarios:** Test expectation: none -- schema-only unit; behavior is exercised through U2's API test scenarios.
- **Verification:** `npx prisma migrate dev --name add_change_requests` runs clean locally; `npx prisma generate` succeeds; the new table and enum are visible via Prisma Studio or an ad-hoc query.

### U2. API routes: create and update status

- **Goal:** Expose `POST /api/change-requests` and `PATCH /api/change-requests/[id]`, strictly ADMIN-gated. (No list `GET` — see Key Technical Decisions; U5 reads the table directly.)
- **Requirements:** R1, R2, R6, R8
- **Dependencies:** U1
- **Files:** `src/app/api/change-requests/route.ts`; `src/app/api/change-requests/[id]/route.ts`; `src/lib/schemas.ts` (add `changeRequestCreateSchema` — `note` trimmed, min 1 / max 2000 chars; `page` trimmed, min 1 / max 300 chars — and `changeRequestStatusSchema` — `status` via `z.nativeEnum`)
- **Approach:** Every handler calls `requireAuth(["ADMIN"])` — not `["ADMIN", "MANAGER"]` (see Key Technical Decisions). `POST` validates the body, creates the row with `employeeId = session.user.id`, returns 201 with the created record (this is also where U3's email send happens — see that unit). `PATCH` validates `status`, updates by `id`, returns 404 if the id doesn't exist.
- **Patterns to follow:** `src/app/api/punch/route.ts` (POST shape), `src/app/api/punch/[id]/route.ts` (PATCH with async `params`), the create/update schema split in `src/lib/schemas.ts`.
- **Test scenarios:**
  - Happy path: ADMIN POSTs a valid note + page → 201, row persisted with `status: OPEN`.
  - Happy path: ADMIN PATCHes an existing row from Open to Done → 200, row updated.
  - Edge: empty or whitespace-only note → 422, no row created.
  - Edge: note exceeding 2000 characters, or page exceeding 300 characters → 422, no row created.
  - Edge: note containing `<script>`/HTML special characters → stored verbatim (escaping happens at render time in U3/U5, not at storage).
  - Error path: PATCH against a non-existent id → 404.
  - Access: a MANAGER, FOREMAN, or CREW session hitting POST or PATCH → 403, no row created or modified. Covers R8.
  - Access: an unauthenticated request → 401.
- **Verification:** Exercise each route with both an ADMIN session and a non-ADMIN session and confirm status codes and payloads match the scenarios above.

### U3. Email notification on submit

- **Goal:** Send a best-effort notification email to Nathan whenever a change request is created, without blocking or failing the create response.
- **Requirements:** R3
- **Dependencies:** U2
- **Files:** `src/app/api/change-requests/route.ts` (the `POST` handler from U2); `.env.local` and the matching Vercel Preview/Production/Development env vars (add `CHANGE_REQUEST_NOTIFY_EMAIL=nathan@pcshards.com`)
- **Approach:** After `prisma.changeRequest.create()` succeeds, call the existing `sendMail()` helper (`src/lib/mail.ts`) inside its own try/catch; do not alter the HTTP response either way (Key Technical Decisions). On success, update the row's `notifiedAt` to the current time. On failure, log only the error and the change-request `id` — not the note or page text, so free-text submitter content isn't duplicated into logs with different retention/access controls than the database — and leave `notifiedAt` null (U5 surfaces this as a small "notification failed" indicator, per Key Technical Decisions). Build the HTML body with the same `esc()`-style escaping the contact/quote routes use, so the free-text note and page value can't inject HTML into the email. Recipient is `process.env.CHANGE_REQUEST_NOTIFY_EMAIL`.
- **Patterns to follow:** `src/app/api/contact/route.ts` and `src/app/api/quote/route.ts` for the `sendMail()` call shape and the `esc()` helper — deliberately diverging on failure handling per the Key Technical Decision above.
- **Test scenarios:**
  - Happy path: a successful create triggers `sendMail()` with note, page, submitter, and timestamp in the body, and sets `notifiedAt`.
  - Error path: `sendMail()` throwing (simulated Graph API failure) still returns 201 from the create endpoint with the row persisted and `notifiedAt` left null. Covers the R2-vs-R3 isolation decision.
  - Edge: a note containing HTML special characters renders escaped in the email body, not as live HTML.
- **Verification:** Trigger a real submission in a preview/dev environment and confirm the email arrives at `CHANGE_REQUEST_NOTIFY_EMAIL` and `notifiedAt` is set; separately simulate a mail failure (e.g., a temporarily invalid env var) and confirm the change request still saves with `notifiedAt` null.

### U4. Submit widget (client, mounted portal-wide)

- **Goal:** A persistent ADMIN-only control, visible on every `/portal/*` page, to submit a change-request note.
- **Requirements:** R1, R2
- **Dependencies:** U2
- **Files:** `src/components/portal/ChangeRequestWidget.tsx` (new, `"use client"`); `src/components/portal/PortalShell.tsx` (edit — mount the widget, gated on `user.role === "ADMIN"`)
- **Approach:** Capture the current route via `usePathname()` (same hook `PortalShell` already uses for nav active-state) at submit time. Render as a small fixed-position trigger (bottom-right corner) that expands into a textarea + submit button; positioned and z-indexed so it never collides with the existing full-width bottom form bars on mobile (`SiteVisitForm.tsx`, `CrewWorkLogForm.tsx`, `WorkOrderForm.tsx`, all `fixed bottom-0 ... z-40`) or the mobile sidebar overlay (`z-50`) — sit above the form bars but below the sidebar overlay, offset so an open form bar never obscures it. The trigger carries `aria-label="Submit change request"` and `aria-expanded`; opening it auto-focuses the textarea; Escape collapses it and returns focus to the trigger. Disable submit when the note is empty/whitespace or over 2000 characters (client-side mirror of U2's server validation). Show a loading spinner while submitting. On success: an `aria-live="polite"` inline confirmation shown for ~3 seconds or until the next submission starts (whichever first), textarea cleared, widget stays open (Key Technical Decisions). On failure: inline error, preserve the typed note. No confirmation prompt on dismiss-without-submitting — this is scratch input, not a persisted form.
- **Patterns to follow:** `MaterialSettings.tsx`'s client fetch + disabled-button + loading-spinner pattern; `BulkCostingView.tsx`'s inline dismissible result banner for success/error feedback (this repo has no toast library). Note that neither existing pattern is a floating overlay trigger, so the placement/a11y details above are this unit's own, not inherited.
- **Test scenarios:**
  - Happy path: ADMIN opens the widget on an arbitrary portal page, types a note, submits → success feedback shown, textarea cleared, widget stays open.
  - Happy path: the widget captures the actual current pathname on both a static route and a dynamic route (e.g. a job detail page) and sends it with the submission.
  - Happy path: on a page with an active bottom form bar (e.g. a landscape crew log form), the widget remains visible and usable, not obscured.
  - Edge: submit is disabled when the note is empty or whitespace-only.
  - Edge: a note at/near the 2000-character cap is blocked from submitting with appropriate feedback.
  - Edge: pressing Escape while the widget is expanded collapses it and returns focus to the trigger.
  - Error path: the API call fails (e.g. network error) → inline error shown, typed note preserved, not cleared.
  - Access: the widget does not render at all in a non-ADMIN `PortalShell` (role-gated render), paired with U2's server-side enforcement so this is UX only, not the security boundary.
- **Verification:** Manually exercise the widget across a few portal pages (static + dynamic route) as an ADMIN account and confirm the captured page and note show correctly in the review list (U5) afterward.

### U5. Review list page, status toggle, and nav entry

- **Goal:** An ADMIN-only page listing all change requests with note/page/submitter/timestamp/status, an Open/Done toggle per row, reachable from the portal nav.
- **Requirements:** R4, R5, R6, R7, R9
- **Dependencies:** U1, U2
- **Files:** `src/app/portal/change-requests/page.tsx` (new, server component); `src/components/portal/change-requests/ChangeRequestStatusToggle.tsx` (new, client component); `src/components/portal/PortalShell.tsx` (edit — add a strictly ADMIN-only nav entry, separate from the existing `adminOnly` flag semantics); `src/lib/constants.ts` (edit — add `OPEN`/`DONE` entries to `STATUS_COLORS`)
- **Approach:** The server component independently calls `auth()` and redirects any non-ADMIN session — mirrors `landscape/settings/page.tsx`'s pattern rather than relying on nav-hiding alone. Queries `ChangeRequest` rows directly via Prisma (with the submitting employee's name) — mirrors `time/log/page.tsx`'s direct-query pattern; there is no list API to call (see Key Technical Decisions). Serializes `createdAt` to an ISO string before passing to the client component (existing serialization convention). Sorts Open items first, Done grouped below — no separate filter control (R7, resolved per Key Technical Decisions). Each row shows a status badge (`StatusBadge`, after adding `OPEN`/`DONE` entries to `STATUS_COLORS` — the existing map has none, so without this edit both statuses silently render with the same fallback color) and the toggle control; the toggle does an optimistic update + `PATCH`, disabling itself for the duration of the in-flight request, and — diverging from `MaterialSettings`' silent-fail pattern — reverts the optimistic state and shows an inline error if the `PATCH` fails. A row whose `notifiedAt` is null shows a small "notification failed" indicator (see U3). Two distinct empty states: "No change requests yet" (zero total) and a separate "nothing open" message when every entry is Done. Both the note and the page value render as plain React text (never `dangerouslySetInnerHTML`), so HTML special characters display literally rather than executing. The new nav entry checks `user.role === "ADMIN"` directly rather than the existing `adminOnly` flag (which currently also allows MANAGER).
- **Patterns to follow:** `src/app/portal/time/log/page.tsx` (server-fetch + card-list rendering); `src/components/portal/StatusBadge.tsx`; `src/components/portal/landscape-form/MaterialSettings.tsx` (toggle shape, improved per the rollback Key Technical Decision).
- **Test scenarios:**
  - Happy path: an ADMIN loads the review list and sees all submitted requests with note/page/submitter/timestamp/status, Open entries sorted first.
  - Happy path: an ADMIN toggles a request from Open to Done → status updates in place and persists on reload; the toggle is disabled while the request is in flight.
  - Happy path: Open and Done entries render with visibly distinct status-badge colors.
  - Happy path: a request whose email notification failed (`notifiedAt` null) shows the "notification failed" indicator; one that succeeded does not.
  - Edge: zero change requests → "No change requests yet" shown.
  - Edge: every entry is Done → a distinct "nothing open" message shown instead of an empty Open section.
  - Error path: the `PATCH` fails (simulated 500/network error) → the optimistic toggle rolls back and an inline error is shown.
  - Access: a MANAGER, FOREMAN, or CREW session hitting `/portal/change-requests` directly → redirected, not shown an empty-looking 200 page. Covers R9.
  - Access: the "Change Requests" nav entry appears only for ADMIN, not MANAGER — contrast with the existing `adminOnly` nav items, which do show for MANAGER.
- **Verification:** As an ADMIN, submit a couple of requests via U4's widget from different pages, confirm they appear correctly here, toggle one to Done, and confirm a MANAGER-role test session cannot reach the page directly.

---

## Scope Boundaries

- Marketing/public site is out of scope — portal only (R9).
- Non-ADMIN submitters (MANAGER, FOREMAN, CREW) are out of scope — deferred if this proves useful beyond Mike/Nathan.
- No per-user "my submissions only" view — the shared list stands in for it; revisit if a third ADMIN is ever added.
- No threaded replies/chat — one-way note capture only.
- No In Progress/Won't Fix states beyond Open/Done.

---

## Risks & Dependencies

- `CHANGE_REQUEST_NOTIFY_EMAIL` must be added to both the self-hosted `.env.local` (used by the production PM2 process) and Vercel's Preview/Production/Development env vars (used by this branch's test deployment) — per the existing `CRON_SECRET` precedent for adding a new env var across environments. If missed, the feature still works end-to-end (the create always succeeds per the Key Technical Decision), but every notification shows as failed (`notifiedAt` null) until the var is set — visible in U5's list, not silent.
- Depends on `MAIL_FROM` (`support@pcshards.com`) already being a valid sender in the PCShards Azure AD tenant — no new Azure AD configuration needed; reuses the existing working setup.
- The new migration is additive only (one new table, one new enum) — low collision risk against the production database's partially-baselined migration history, but still run `npx prisma migrate status` before deploying, per the existing deploy procedure.
- The ADMIN-only enforcement in this plan is only as strong as session freshness: role is baked into the JWT at login with a 24-hour `maxAge` and this codebase has no session-revalidation-against-DB mechanism today. A demoted or deactivated ADMIN's existing session still passes every check in this plan until it expires or they re-authenticate. This is a pre-existing, cross-cutting property of the auth stack, not something this plan introduces or can fix within its own scope — noted here so the ADMIN-only guarantee isn't assumed stronger than it is.
- Post-ship follow-up (not part of this plan's units): promote the Prisma-migrate non-interactive gotcha, the `MAIL_FROM`/Azure-AD-tenant gotcha, and this feature's nav-gating precedent into formal `docs/solutions/` entries via `/ce-compound` — currently only in session memory.
