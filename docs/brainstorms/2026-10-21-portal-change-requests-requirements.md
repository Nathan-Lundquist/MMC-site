---
date: 2026-10-21
topic: portal-change-requests
---

## Summary

Add a lightweight change-request channel to the mmc-next portal: ADMIN users can flag a note tied to whatever page they're viewing, building a shared, trackable list of pending site changes for Nathan to work through.

## Key Decisions

- **Shared list, not per-user queues.** Both ADMIN accounts (Mike, Nathan) see the same list of change requests, since this doubles as Mike's own status check and Nathan's review queue, and only two ADMINs exist today. If a third ADMIN is added later, revisit — see Scope Boundaries.
- **Two-state status (Open/Done).** No "In Progress" or "Won't Fix" state — matches a lightweight, fire-and-forget flow where Nathan works through items at his own pace.
- **Email notification on submit.** Reuses the existing Graph API mail integration so Nathan learns about new requests without polling the portal.
- **ADMIN-only, portal-only scope.** The submit control and review list are gated to the ADMIN role and only appear within `/portal/*` — not on the public marketing site.

## Actors

- A1. Mike (ADMIN) — submits change-request notes while browsing the portal; can view status of his own and others' submissions in the shared list.
- A2. Nathan (ADMIN) — submits/receives change-request notes; works through the list, marking items Done once implemented; receives an email per submission.

## Requirements

**Submission**

- R1. Any ADMIN-role user sees a persistent control, available on every `/portal/*` page, to submit a change-request note.
- R2. Submitting a note automatically captures the free-text note, the current page/route, the submitting user, and a timestamp — no extra fields required from the user.
- R3. On submission, Nathan receives an email notification (via the existing Graph API mail integration) containing the note text, page, submitter, and timestamp.

**Review & tracking**

- R4. A review list is available within the portal, visible to any ADMIN, showing all submitted change requests.
- R5. Each entry in the list shows its note, page, submitter, timestamp, and status (Open or Done).
- R6. Any ADMIN can change an entry's status between Open and Done.
- R7. The list makes Open items easy to find (e.g., Open items surfaced first, or a status filter) — exact UI left to planning.

**Access**

- R8. Only ADMIN-role users can see the submit control and the review list; MANAGER, FOREMAN, and CREW have no access to this feature.
- R9. The feature does not appear on the public marketing site — portal only.

## Key Flows

- F1. Submit a change request
  - **Trigger:** An ADMIN user is on any portal page and wants to flag something to change.
  - **Actors:** A1, A2
  - **Steps:** Open the submit control -> type a note -> submit -> system captures page/user/timestamp automatically -> entry saved as Open -> email sent to Nathan.
  - **Outcome:** A new Open entry appears in the shared review list.
  - **Covers:** R1, R2, R3

- F2. Review and resolve
  - **Trigger:** Nathan (or Mike) opens the review list.
  - **Actors:** A1, A2
  - **Steps:** View all entries -> optionally filter to Open -> after making the change, mark the entry Done.
  - **Outcome:** Entry status updates to Done; Mike sees the updated status next time he checks the list.
  - **Covers:** R4, R5, R6, R7

## Scope Boundaries

- Marketing/public site is out of scope — portal only.
- Non-ADMIN submitters (MANAGER, FOREMAN, CREW) are out of scope — deferred if this proves useful beyond Mike/Nathan.
- No per-user "my submissions only" view — the shared list stands in for it today. If a third ADMIN joins, revisit whether a filtered view is needed, since all ADMINs currently see and can resolve every entry.
- No threaded replies/chat — one-way note capture only, not a conversation.
- No In Progress / Won't Fix states beyond Open/Done — revisit if the two-state model proves insufficient.

## Dependencies / Assumptions

- Assumes the existing Graph API mail helper (`src/lib/mail.ts`) can be reused for the notification email without new Azure AD configuration.
- Assumes Mike and Nathan remain the only ADMIN-role users for the foreseeable future; if a third ADMIN is added, revisit the shared-list decision.
