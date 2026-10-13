---
date: 2026-10-12
topic: active-jobs-kanban
---

# Active Jobs Kanban Board

## Summary

Replace Mike's current Microsoft Planner board with an in-app Kanban view of active jobs on the mmc-next portal. Jobs are created and scheduled directly on the board instead of in a separate system, then flow into the existing job detail page where foremen fill in operational specifics.

## Problem Frame

Mike currently schedules and tracks active work using Microsoft Planner, completely separate from mmc-next. Once a job is scheduled in Planner, someone has to separately create the matching work order record in mmc-next before a foreman can go in and add the job's operational details (crew hours, materials, etc.). Keeping two systems in sync is the actual pain point — not the look of the existing jobs list.

## Key Decisions

- **Kanban operates directly on real work orders, not a separate scheduling layer.** Columns map to the existing `WorkOrder.status` field (`DRAFT`, `IN_PROGRESS`, `COMPLETED`). Moving a card changes the real status everywhere it's read — job list, job detail, costing. No new entity, no second system to keep in sync, no schema changes.
- **Column set is a starting default, not confirmed against Mike's actual Planner board.** Mike's exact column names weren't available during this brainstorm. Three columns (To Schedule / In Progress / Done) were chosen as the closest reasonable mapping to the existing status lifecycle, explicitly to be revisited with Mike (see Outstanding Questions).
- **Desktop gets drag-and-drop; touch gets a tap control.** The primary daily audience includes foremen and crew on phones, where drag gestures are unreliable. Every card gets a visible "advance" action that works identically to a drag, so mobile isn't a second-class experience.
- **Card creation is a lightweight quick-add, not the full job form.** The board's "+ New Job" collects just enough to schedule and identify a job (customer, job type, foreman, date). Full detail entry stays on the existing job edit page — this preserves the "foreman adds the info" step Mike already relies on.
- **Jobs leave the board once invoiced.** `INVOICED`, `PAID`, and `CANCELLED` work orders drop off the board entirely; they're "active" no longer and are already handled by the existing jobs list/costing flow.

## Actors

- A1. **Mike / Admin** — schedules jobs, creates new jobs directly from the board, assigns a foreman, moves cards as work progresses.
- A2. **Foreman** — uses the board to see what's active/coming up, advances a job's status, then goes to the job detail page to record crew hours, materials, and other specifics.
- A3. **Crew** — uses the board for visibility into active work. View-only: crew does not move or advance cards (see R11).

## Requirements

**Board & Columns**
- R1. The board shows three columns mapped to `WorkOrder.status`: "To Schedule" (`DRAFT`), "In Progress" (`IN_PROGRESS`), "Done" (`COMPLETED`).
- R2. Work orders with status `INVOICED`, `PAID`, or `CANCELLED` do not appear on the board — they remain visible only in the existing jobs list.
- R3. Each column shows a count of the jobs it contains.

**Job Creation**
- R4. A "+ New Job" control opens a quick-create form (customer, job type, foreman, scheduled date) and creates a new work order with status `DRAFT`, placed in "To Schedule".
- R5. The quick-create form only asks for enough to schedule and identify the job — it does not require every field the full job form supports. Remaining detail is filled in later via the existing job edit page.

**Card Display & Navigation**
- R6. Each card shows at minimum: work order number, customer name, job type, assigned foreman, and scheduled date.
- R7. Tapping or clicking a card (outside its advance control) navigates to the existing job detail page — the board does not duplicate that view.

**Status Changes**
- R8. On desktop, dragging a card to a different column updates the work order's status to match.
- R9. On touch devices, each card has a tap control that advances it to the next column (and a way to move it back, for corrections) without requiring a drag gesture.
- R10. Status changes made from the board use the same `status` field read everywhere else in the app — no parallel or duplicate status concept is introduced.
- R11. `CREW`-role users can view the board but cannot move or advance cards; only `FOREMAN`, `MANAGER`, and `ADMIN` can change a job's status from the board.

## Key Flows

- F1. **Creating a job from the board**
  - **Trigger:** Mike (or another admin/foreman) clicks "+ New Job".
  - **Steps:** Quick-create form opens → customer, job type, foreman, and date are entered → on submit, a new `DRAFT` work order is created and appears as a card in "To Schedule".
  - **Covered by:** R4, R5, R6

- F2. **Advancing a job's status on desktop**
  - **Trigger:** A user drags a card from one column to another.
  - **Steps:** Drop triggers a status update on the underlying work order → the card renders in its new column.
  - **Covered by:** R8, R10

- F3. **Advancing a job's status on mobile**
  - **Trigger:** A user taps the advance control on a card.
  - **Steps:** The work order's status updates exactly as it would from a drag → the card moves column.
  - **Covered by:** R9, R10

- F4. **Jumping into job detail**
  - **Trigger:** A user taps/clicks a card body (not its advance control).
  - **Steps:** Navigates to the existing job detail page for that work order.
  - **Covered by:** R7

## Acceptance Examples

- AE1. **Covers R2.** Given a work order with status `INVOICED`. When the board loads. Then that work order does not appear in any column.
- AE2. **Covers R9, R10.** Given a work order in "In Progress". When a user on a touch device taps the advance control on its card (rather than dragging). Then the work order's status becomes `COMPLETED` and the card moves to "Done".
- AE3. **Covers R4, R5.** Given the quick-create form is submitted with only its required fields. When the new work order is created. Then it appears immediately in "To Schedule" without the full job form having been completed.

## Scope Boundaries

**Deferred for later**
- Importing or migrating existing cards from Microsoft Planner — out of scope for v1. Mike starts fresh on the new board; Planner is simply retired going forward.
- Manual reordering of cards within a column (priority ordering) — not requested.
- Assigning crew members (beyond a single foreman) from the board — crew assignment stays in the existing job edit flow.
- A calendar/date-range scheduling view as an alternative to status columns — not requested; status-based columns is the agreed shape.

## Dependencies / Assumptions

- Assumes the existing `WorkOrder.status` enum (`DRAFT`, `IN_PROGRESS`, `COMPLETED`, `INVOICED`, `PAID`, `CANCELLED`) is sufficient to represent the board's columns — no schema changes anticipated.
- Assumes the quick-create form's minimum fields (customer, job type) are enough to satisfy `WorkOrder`'s required columns — to be verified against `prisma/schema.prisma` and the existing `src/app/portal/jobs/new` form during planning.

## Outstanding Questions

**Deferred to planning**
- OQ1. Exact column labels — "To Schedule" / "In Progress" / "Done" are a reasonable default, explicitly chosen without Mike's actual Planner column names on hand. Confirm with Mike before or shortly after launch, since he's the board's primary daily user.
- OQ2. Exact fields on the quick-create form beyond customer/job type/foreman/date (e.g., job category, address) — determine by checking which `WorkOrder` fields are actually required vs. optional.
