---
title: "Snapshot volatile UI context (e.g. pathname) in widgets that outlive client-side navigation"
date: 2026-10-22
category: design-patterns
module: portal/change-requests
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - "A component is mounted persistently across client-side route changes (e.g. in a shared layout) rather than unmounting per-page"
  - "The component reads a navigation-derived hook (usePathname, useSearchParams, useParams) and uses that value inside an async handler that can fire after the user has navigated away"
tags: [react, nextjs, use-pathname, stale-closure, persistent-widget, use-ref]
---

# Snapshot volatile UI context (e.g. pathname) in widgets that outlive client-side navigation

## Context

`ChangeRequestWidget` (`src/components/portal/ChangeRequestWidget.tsx`) is a floating widget mounted once in the portal layout, so it stays mounted across every client-side navigation under `/portal/*`. It originally read `usePathname()` directly inside its async submit handler. Because the widget has no auto-close-on-navigation behavior, a user could open it on page A, navigate client-side to page B while it stayed open, then submit — and the note would be tagged with page B's path, not page A's, even though it was composed while looking at page A. Two independent review personas (a testing-focused reviewer and an adversarial reviewer, in the same multi-agent review pass) both flagged this exact gap before it shipped.

## Guidance

Snapshot the volatile value into a `useRef` at the moment the relevant UI state transitions (here: widget opens), and read from the ref — not the live hook — inside the handler that fires later:

```tsx
const pathname = usePathname();
const [open, setOpen] = useState(false);

// Pathname at the moment the widget opened, not the live value — the widget
// stays mounted across client-side navigation, so reading usePathname() at
// submit time would tag the note with wherever the user navigated to next,
// not the page they were looking at when they started composing it.
const capturedPathRef = useRef(pathname);

useEffect(() => {
  if (open) {
    capturedPathRef.current = pathname;
    textareaRef.current?.focus();
  }
  // Only re-capture when the widget transitions open; `pathname` itself must
  // not be a dependency here, or navigating while open would re-capture it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open]);

async function handleSubmit() {
  await fetch("/api/change-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: trimmed, page: capturedPathRef.current }),
  });
}
```

The `eslint-disable-next-line react-hooks/exhaustive-deps` is deliberate and must carry an inline comment explaining why — omitting `pathname` from the dependency array is the whole point of the fix; adding it back (to satisfy the lint rule) silently reintroduces the bug by re-capturing on every navigation while the widget is still open.

## Why This Matters

Any `usePathname()`/`useSearchParams()`/route-param read inside a component that persists across navigation is a live value, not a snapshot. If an async handler on that component reads the hook directly at call time rather than at the moment the user's intent was formed, the value silently drifts to wherever the user happens to be when the async operation resolves — producing wrong data (here: a change request filed against the wrong page) with no error and no obvious reproduction unless a tester specifically navigates mid-interaction.

## When to Apply

- Any persistently-mounted component (global widgets, toasts-with-actions, floating panels, command palettes) that captures user intent over a span of time and later uses a navigation-derived hook value in a submit/async callback.
- When adding an `eslint-disable` for `exhaustive-deps`, require an inline comment stating which dependency was deliberately excluded and why — the comment is what stops a future contributor (or a lint autofix) from "fixing" it back into a bug.
- During review of persistent widgets/layouts: explicitly check whether any `use*()` navigation hook value is read inside a handler that can fire after an arbitrary delay, rather than only checked at render time.

## Examples

Before (bug — reads live pathname at submit time):

```tsx
const pathname = usePathname();
async function handleSubmit() {
  await fetch("/api/change-requests", {
    body: JSON.stringify({ note: trimmed, page: pathname }), // wrong page if user navigated while widget stayed open
  });
}
```

After: see Guidance above — snapshot captured on open, read from ref at submit time.

## Related

- `src/components/portal/ChangeRequestWidget.tsx`
- Flagged independently by the testing-reviewer and adversarial-reviewer personas during `/ce-code-review` on PR #5 (`feat/portal-change-requests`), mmc-next
