---
title: "Defer post-response side effects with next/server after(), and don't trust a single Turbopack-dev test failure"
date: 2026-10-22
category: architecture-patterns
module: api/change-requests
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - "An API route handler has non-critical work (notifications, logging, bookkeeping) that shouldn't block or add failure risk to the main response"
  - "A request only fails during interactive/browser-driven dev-mode testing (Playwright against next dev / Turbopack), not via a clean direct API call"
tags: [nextjs, after-api, deferred-work, turbopack, dev-mode, playwright, testing-triage]
---

# Defer post-response side effects with next/server after(), and don't trust a single Turbopack-dev test failure

## Context

This repo's first use of Next.js 16's `after()` (from `next/server`) appeared in `POST /api/change-requests` (`src/app/api/change-requests/route.ts`). The handler creates a `ChangeRequest` row and needs to notify an admin by email, but the send is best-effort and must not add latency or failure risk to the create response.

Separately, during manual Playwright verification of a sibling route in the same feature (the PATCH status-toggle handler, `src/app/api/change-requests/[id]/route.ts`), a request intermittently threw `SyntaxError: Unexpected end of JSON input` at `await req.json()`, with a `200` logged in the dev server's access log for that same call and the database showing the write never actually landed — raising the question of whether the route handler itself was broken.

## Guidance

**Defer non-critical, best-effort work past the response with `after()`.** Create/update the primary record, call `after(async () => { ... })` with the side effect, then return the response — the client gets its 201/200 without waiting on the side effect, and a side-effect failure can never corrupt or block the primary write:

```ts
const changeRequest = await prisma.changeRequest.create({ ... });

after(async () => {
  const notifyEmail = process.env.CHANGE_REQUEST_NOTIFY_EMAIL;
  if (!notifyEmail) {
    console.error("CHANGE_REQUEST_NOTIFY_EMAIL is not set — skipping notification", {
      changeRequestId: changeRequest.id,
    });
    return;
  }

  try {
    await sendMail({ to: notifyEmail, subject: ..., html });
  } catch (err) {
    console.error("Failed to send change-request notification email", {
      changeRequestId: changeRequest.id,
      error: err instanceof Error ? err.message : err,
    });
    return; // stop here — don't let a send failure masquerade as a notifiedAt failure
  }

  // Separate try/catch: a failure here means the email *did* send, so it
  // must not be logged/surfaced as a send failure — only the bookkeeping missed.
  try {
    await prisma.changeRequest.update({
      where: { id: changeRequest.id },
      data: { notifiedAt: new Date() },
    });
  } catch (err) {
    console.error("Change-request email sent but notifiedAt update failed", {
      changeRequestId: changeRequest.id,
      error: err instanceof Error ? err.message : err,
    });
  }
});

return NextResponse.json(changeRequest, { status: 201 });
```

Keep the two post-send steps (send email, record `notifiedAt`) in **separate** try/catch blocks. Collapsing them into one would misreport "DB update failed" as "email failed to send" — a different, wrong alert for whoever reads the logs.

**Testing-noise triage rule: a single interactive-test failure is not proof the handler is broken.** When a request fails only when driven through Playwright against `next dev` (Turbopack) — and a clean, deterministic, single direct `fetch()` call with an authenticated session cookie and the identical payload succeeds, with the DB correctly reflecting the write afterward — treat the dev-mode failure as test-tooling noise to verify-and-move-past, not as a confirmed bug. In this case, candidates for the cause were never pinned down (Playwright's click-actionability auto-retry firing a second click/fetch before a `disabled` button state visually updates; a Turbopack dev-mode request-body-stream quirk) — but the real deploy build (`next build --webpack`) compiled cleanly and a single deterministic request worked every time, so the anomaly didn't warrant further chase. Still log/note it for future pattern-matching rather than silently ignoring it.

## Why This Matters

`after()` is new to this repo; without a clear first example, future routes risk doing the side effect inline (adding latency/failure coupling to the main response) or getting the try/catch structure wrong (conflating two independent failure modes into one misleading log line). Separately, interactive browser automation against a dev server introduces its own timing nondeterminism — chasing it as if it were an application bug wastes debugging time that a single deterministic direct-request check can resolve in minutes.

## When to Apply

- Any API route with work that's useful but not required for the response to be correct (notifications, analytics pings, audit-log writes, cache warms).
- Any route handler with two or more dependent post-write side effects — isolate each in its own try/catch so logs point at the actual failure.
- Any time a Playwright/browser-driven test fails against `next dev` but the feature is otherwise unverified — before concluding the route is broken, reproduce with one deterministic direct request (same payload, real session cookie) and check the database state afterward.

## Examples

Before (no deferral — side effect inline and blocking):

```ts
const changeRequest = await prisma.changeRequest.create({ ... });
await sendMail({ to: notifyEmail, subject, html }); // blocks the response, can fail the whole request
return NextResponse.json(changeRequest, { status: 201 });
```

After: see Guidance above — deferred via `after()`, response returns immediately, failures isolated.

## Related

- `src/app/api/change-requests/route.ts`
- `src/app/api/change-requests/[id]/route.ts` (the PATCH route where the dev-mode-only anomaly was observed)
- Shipped in PR #5 (`feat/portal-change-requests`), mmc-next
