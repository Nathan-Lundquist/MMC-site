---
title: "Use a tab query param to select which component renders when merging architecturally incompatible pages"
date: 2026-10-15
category: docs/solutions/architecture-patterns
module: job-costing-bulk-costing-merged-page
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - "Merging two pages/views with genuinely incompatible data-fetching architectures (e.g. Server Component + raw queries vs. client-only useState/useEffect state)"
  - "The actual user-facing requirement is switch between views, not share live state between them"
  - "One of the views is expensive to fetch and the merged page should avoid running that fetch when the other view is selected"
tags: [nextjs, server-components, client-components, url-state, merge-pattern]
---

# Use a tab query param to select which component renders when merging architecturally incompatible pages

## Context

Two existing pages needed to be merged into one: a "Summary" costing view implemented as an async Server Component running several raw-SQL summary queries, and a "Bulk" costing view implemented as a fully client-side component managing its own filter/UI state via `useState`. These two had architecturally incompatible data-fetching models — one fetches server-side per request, the other manages everything client-side in local state — and there was no existing shared state layer between them.

## Guidance

When merging two pages with incompatible data-fetching architectures, prefer a URL query parameter (e.g. `?tab=`) that selects *which entire component renders*, with the server page branching and early-returning before doing any of the expensive work the non-selected view doesn't need:

```tsx
// costing/page.tsx (Server Component)
export default async function CostingPage({ searchParams }) {
  const params = await searchParams;
  if (params.tab === "bulk") {
    return <BulkCostingView />; // early return BEFORE running the 7 summary queries
  }
  // ...run raw-SQL summary queries, render Summary view
}
```

This keeps each view's internal architecture untouched — the Server Component summary view keeps doing its raw-SQL fetch, the client-side bulk view keeps its own `useState` management — and the early return means switching to the bulk tab doesn't pay the cost of the summary view's queries at all.

The alternative that was considered and explicitly rejected: forcing both components to share URL-backed filter state so one unified data layer could serve both views. This would have required a significant rewrite of the client-side view's internal state management to make it URL-param-driven instead of local-state-driven, for no functional benefit beyond architectural tidiness — a large risk/cost increase to solve a problem (shared state) the two views didn't actually need to share.

## Why This Matters

Retrofitting shared state between architecturally incompatible components is a common refactor trap: it looks like the "more correct" unified solution, but the actual requirement was just "let the user switch between these two views," not "let these two views share live filter state." Picking the tab-switches-which-component-renders approach avoided a large, risky rewrite of working client-side state logic, kept each view's data-fetching strategy simple and unchanged, and avoided paying for both views' data fetches on every page load. This tradeoff was independently validated as sound by three separate reviewers across two different phases — a feasibility doc-reviewer during planning, and both an efficiency-focused and an altitude-focused simplify-code-reviewer during the post-implementation quality pass — all three confirming this was the right call rather than a shortcut.

## When to Apply

- Merging two pages/views that have genuinely incompatible data-fetching architectures (e.g. Server Component + raw queries vs. client-only `useState`/`useEffect` state).
- When the actual user-facing requirement is "switch between views," not "views need to share live state" — check which one it really is before reaching for shared state.
- When one of the views is expensive to fetch (e.g. multiple summary queries) and the merged page should avoid running that fetch when the other view is selected — use an early return keyed off the tab param, not a conditional render after both fetches have already run.
- As a general pattern: prefer a URL param that gates *which component tree renders* over introducing a new shared state layer, whenever the components' internal state models don't already overlap.

## Examples

Before (two separate pages, no merge):

```
/costing/summary  -> async Server Component, raw-SQL summary queries
/costing/bulk     -> client Component, useState-driven bulk editing
```

After (merged via tab query param, early return preserves each view's architecture):

```tsx
export default async function CostingPage({ searchParams }) {
  const params = await searchParams;
  if (params.tab === "bulk") {
    return <BulkCostingView />;
  }
  const summaryData = await runSummaryQueries(); // only runs for the default/summary tab
  return <SummaryView data={summaryData} />;
}
```

Rejected alternative (not implemented): rewriting `BulkCostingView`'s `useState` filters to read/write the same URL params the summary view would use, to create one shared state model across both — rejected as a disproportionate rewrite for a requirement that was only "let users switch tabs."

## Related

- `src/app/portal/costing/page.tsx`, `src/app/portal/costing/BulkCostingView.tsx`, `src/app/portal/costing/CostingTabs.tsx` in mmc-next — the concrete implementation this pattern is drawn from.
- None yet in docs/solutions/ — first entry in this category for this repo.
