---
date: 2026-10-14
topic: portal-sidebar-reorg
---

# Portal sidebar reorg: season-aligned sections + consolidation

## Summary

Reorganize the mmc-next portal's sidebar around how the business actually operates seasonally — **Spring and Summer**, **Clean Ups**, and **Winter** — in place of the current domain-based sections, while consolidating several near-duplicate destinations (Active Jobs into Log Work, Job Costing + Bulk Costing into one Costing entry, Fleet into Admin). Clean Ups becomes a new dedicated section with its own list and log-work pages, built on the existing `WorkOrder` data and filtered by the existing `jobCategory` field — no new tables.

---

## Problem Frame

The sidebar has grown to 22 links across 6 sections for an ADMIN (fewer for other roles, but still long), organized around feature domains (Landscaping, Snow Removal, Time, Fleet, Admin) rather than how the business thinks about its own calendar. Two of those domain sections also contain genuine near-duplicates: "Active Jobs" exists only to pick a job before handing off to "Log Work," and "Job Costing" / "Bulk Costing" are two different interaction modes on largely the same data. Separately, every job-creation path in the app today sets a free-text job description (`jobType`) but never the actual category enum (`jobCategory`) used for filtering and reporting — a pre-existing gap that would silently break any season-based filtering built on top of it.

---

## Key Decisions

- **Consolidate rather than collapse.** Chose merging near-duplicate destinations over adding collapsible/accordion sections. A real reduction in destination count, not just visual hiding, and no new UI interaction pattern to build.
- **Season-aligned grouping over domain-based grouping.** Sections now mirror how the business operates its calendar (Spring/Summer general work, Clean Ups, Winter) rather than abstract feature domains, per direct instruction on how the business actually runs.
- **Clean Ups reuses `WorkOrder`, filtered by category — not a parallel data model.** Rejected mirroring Snow Removal's fully separate `SnowStorm` / `SnowSiteService` tables. A cleanup job is a regular landscaping job that just needs its own view; filtering the existing table by `jobCategory` is far cheaper and keeps Jobs/Costing/Breakdown's underlying model uniform.
- **Clean Ups pulls jobs out of the general views, not a parallel shortcut.** Once a job's category is Fall or Spring Clean Up, it disappears from the general Jobs/Breakdown/Costing views entirely. Keeps Spring and Summer focused; the cost is that Clean Ups has no financial rollup of its own yet (see Scope Boundaries).
- **Clean Ups combines Spring and Fall cleanup jobs into one section**, not two separate seasonal sub-areas.
- **`jobCategory` data integrity is fixed as part of this work, not deferred.** Without fixing the creation forms, every new job would land with a null category and silently vanish from both season sections. Treated as a blocking requirement.
- **Historical categorization is trusted as-is.** All 2698 existing work orders already carry a populated `jobCategory` from the original Zoho import; no backfill or re-derivation from raw Zoho exports is needed (see Sources / Research).

---

## Requirements

**Job categorization integrity**

- R1. Every job-creation path (Log Work's quick-create, the Board's quick-create, and the full Jobs/new form) sets a real `jobCategory` value on the created work order, not only the free-text `jobType` description.
- R2. The Active Jobs quick-create form's "Job Type" field — which today conflates category selection with free-text description, writing a category-like string into `jobType` while leaving `jobCategory` null — is split into a proper category selector (sets `jobCategory`) and a separate free-text description field (sets `jobType`), matching the pattern already used correctly elsewhere.

**Sidebar structure**

- R3. The sidebar's "Landscaping" and "Snow Removal" sections are replaced with three season-aligned sections: Spring and Summer (general landscaping work), Clean Ups (spring + fall cleanup jobs combined), and Winter (renamed from Snow Removal, same underlying pages).
- R4. Clean Ups is a new section with its own dedicated list and log-work pages, scoped to work orders whose `jobCategory` is Fall Clean Up or Spring Clean Up, built on the existing `WorkOrder` model.
- R5. Spring and Summer's Jobs list, Log Work, Breakdown, and Costing views exclude work orders whose `jobCategory` is Fall Clean Up or Spring Clean Up — those jobs live only under Clean Ups.
- R6. Historical work orders (2698 total: 1342 Landscape, 819 Other, 328 Fall Clean Up, 143 Spring Clean Up, 66 Subcontractor) require no migration or re-categorization to appear correctly once this ships.

**Consolidation**

- R7. "Active Jobs" and "Log Work" merge into a single "Log Work" nav entry; Active Jobs' job-picker role is absorbed into Log Work's existing job selector.
- R8. "Job Costing" and "Bulk Costing" merge into a single "Costing" nav entry that accommodates both the read-only summary and the bulk-editor interaction modes.
- R9. The one-item "Fleet" section folds into "Admin" (its Maintenance link moves there).

**Unaffected**

- R10. Board and Reports are unchanged — both already cut across every job category and are out of scope for this reorg.
- R11. Role-based visibility (who sees which sections, per the existing `adminOnly` gating) stays exactly as it is today — only destinations and grouping change, not who can see what.

---

## Actors

- A1. ADMIN — sees every section; experiences the full consolidation plus the new required category selector on every creation form.
- A2. MANAGER — same nav visibility as ADMIN under existing gating; same category-selector change.
- A3. FOREMAN — sees the non-admin sections (now season-based); creates and moves jobs; must now pick a job category on creation.
- A4. CREW — view-only on the Board, but still creates jobs via Log Work and the main Jobs list; must now pick a job category on creation too.

---

## Key Flows

- F1. Create a job (updated).
  - **Trigger:** Any role opens quick-create via Log Work, the Board, or the full Jobs/new form.
  - **Steps:** Pick customer; pick a job category (new, required); enter a free-text job description (unchanged, separate field); submit.
  - **Outcome:** The job is created with both `jobType` (description) and `jobCategory` (bucket) set, so it correctly surfaces under Spring and Summer or Clean Ups.
  - **Covers:** R1, R2
- F2. Find an active job to work on.
  - **Trigger:** A user wants to log work against, or check the status of, an active job.
  - **Steps:** Pick the section matching the job's season — Spring and Summer's Log Work, or Clean Ups' own list — rather than searching one combined list.
  - **Outcome:** Smaller, season-scoped lists instead of one long mixed list.
  - **Covers:** R3, R4, R5

---

## Acceptance Examples

- AE1. Given a work order with `jobCategory` = Fall Clean Up, when viewing Spring and Summer's Jobs list, then it does not appear; when viewing Clean Ups' list, then it does. **Covers R3, R4, R5.**
- AE2. Given a FOREMAN creates a new job via Log Work's quick-create, when they submit without selecting a category, then the form blocks submission — matching how customer and description are already required today. **Covers R1, R2.**
- AE3. Given an ADMIN opens the sidebar, when looking for "Maintenance" (previously under its own Fleet heading), then it now appears under Admin. **Covers R9.**
- AE4. Given the 328 historical Fall-Clean-Up-categorized work orders, when this ships, then they immediately appear under Clean Ups with no migration script required. **Covers R6.**

---

## Scope Boundaries

**Deferred for later**

- Dedicated Clean Ups financial reporting (its own Costing / Breakdown views) — Clean Ups ships with list + log-work only.
- Collapsible / accordion sidebar sections.

**Outside this round**

- Any change to Board or Reports.
- Any change to role-gating logic (who sees what).
- A live Zoho Creator API integration — resolved instead via a one-time CSV export plus a direct query against the live database.

---

## Dependencies / Assumptions

- Depends on the existing `jobCategory` enum field and its real historical values being trustworthy — verified directly against production (2698 total work orders, distribution in R6).
- Assumes Subcontractor-categorized work orders belong under Spring and Summer (general landscaping) rather than their own bucket. Not explicitly discussed; reasonable low-risk default, flagged below.
- Assumes the broader `JOB_CATEGORIES` list in `src/lib/constants.ts` (19 values, only 5 of which have ever actually been used in stored data) represents future dropdown options rather than current reality.

---

## Outstanding Questions

**Deferred to Planning**

- Should Subcontractor-categorized work orders land under Spring and Summer, or get their own treatment? Default assumption above; confirm during planning if it matters to the business.
- Exact UI mechanism for merging Job Costing + Bulk Costing into one entry (a tab? a button-through from summary to editor?) — the two pages use different interaction patterns (read-only summary vs. a heavy paginated bulk editor) and the merge needs to accommodate both.

---

## Sources / Research

- Live production query (2026-10-14) against `WorkOrder.jobCategory`: 1342 `LANDSCAPE`, 819 `OTHER`, 328 `FALL_CLEANUP`, 143 `SPRING_CLEANUP`, 66 `SUBCONTRACTOR`; 2698 total work orders.
- Uploaded Zoho Creator export (721 rows, 497 distinct free-text `Type of Job` values) confirmed real-world job-type vocabulary includes explicit "Fall clean up" / "Spring clean up" entries, consistent with the `jobCategory` bucketing already in the database — used to sanity-check the category split, not as the source of truth for it.
- `src/components/portal/landscape-form/ActiveWorkOrders.tsx` — the quick-create form with the category-as-`jobType` bug (R2).
- `src/app/api/landscape/work-orders/route.ts`, `src/app/api/board/jobs/route.ts`, `src/lib/schemas.ts` — the three job-creation code paths, none of which currently set `jobCategory` (R1).
- `src/app/portal/reports/page.tsx` — existing precedent for season tabs (Spring/Summer/Fall), defined by calendar month rather than category. Informed but did not define this brainstorm's category-based split — confirmed as a distinct definition during dialogue.
- `src/components/portal/PortalShell.tsx` — current `NAV_SECTIONS` structure (6 sections, 22 items for ADMIN) being restructured.
- `src/app/portal/costing/page.tsx` (summary) and `src/app/portal/costing/bulk/page.tsx` (bulk editor) — the two pages behind R8's merge.
