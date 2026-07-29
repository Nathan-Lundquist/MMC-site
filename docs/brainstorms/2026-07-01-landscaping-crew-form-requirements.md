# Landscaping Crew Form — Requirements

**Date:** 2026-07-01
**Status:** Complete

---

## Problem

Crew leads currently have no quick way to log work from the field. The existing WorkOrderForm is manager-oriented — detailed, multi-section, desktop-friendly. Crew in the field need a fast, mobile-first form to capture what they did on a job: when they worked, who was on the crew, what materials they used, and any notes.

---

## Actors

- **A1. Crew Lead / Foreman** — primary user; logs work from a phone at the job site
- **A2. Manager / Admin** — views logged entries via the existing WorkOrder detail; manages the materials settings list

---

## Key Decisions

1. **Crew logs attach to existing work orders** — not standalone entries. Crew selects an open WO from a dropdown. This keeps all job data unified under the WorkOrder entity.
2. **Simplified field set** — start/end time, crew members, materials (from fixed list), work type, and notes. No detailed hour breakdowns (job/setup/travel/unload/delivery) — that stays in the manager WorkOrderForm.
3. **Fixed materials list from settings** — admin/manager maintains a list of common materials in a settings page. Crew picks from this list and enters quantity. This avoids free-text material names diverging.
4. **All open WOs shown** — the dropdown shows all DRAFT and IN_PROGRESS work orders, displaying customer name + WO number + job type for identification.
5. **Follow snow form pattern** — same architecture as SiteVisitForm.tsx: server component page loads data, client form component with useState orchestrator, form-ui.tsx primitives (MobileInput, MobileSelect, Field, NowBtn), fixed bottom save bar.

---

## Requirements

- **R1.** Mobile-first "Log Work" form accessible from the portal sidebar for all roles
- **R2.** Form fields: work order selector, start time, end time, crew member multi-select, work type, materials (from settings list with quantities), notes
- **R3.** Start/end time uses datetime-local inputs with "Now" quick-fill buttons
- **R4.** Crew member selector shows active employees as tappable chips; auto-selects the logged-in user
- **R5.** Materials section lets crew pick from the admin-managed fixed list and enter quantity per material
- **R6.** Work type dropdown sourced from the existing JobCategory enum
- **R7.** On save, creates a CrewWorkLog record linked to the selected WorkOrder, plus associated material entries
- **R8.** Success state shows confirmation with option to "Log Another" (resets form but keeps crew selection sticky)
- **R9.** Settings page (admin/manager only) for managing the fixed materials list — add, deactivate, reorder
- **R10.** Existing detailed WorkOrderForm remains unchanged for managers

---

## Scope Boundaries

### In scope
- New "Log Work" form page + client component
- New CrewWorkLog model (links to WorkOrder)
- New LandscapeMaterial settings model (fixed list)
- API routes for crew log CRUD and material settings
- Sidebar nav entry for "Log Work"
- Materials settings page under portal settings

### Deferred for later
- Reporting or summaries of crew logs
- Rolling up crew logs into WO cost totals automatically
- Photo attachment on crew logs
- Editing or deleting submitted crew logs

### Outside this scope
- Changes to the existing WorkOrderForm
- Snow form system changes
- Any invoicing or payment features

---

## Success Criteria

1. A crew lead can open the form on a phone, pick a WO, log time/crew/materials in under 60 seconds, and submit
2. Submitted logs appear linked to their work order in the database
3. Admin can manage the materials list from a settings page
4. The existing WorkOrderForm and manager workflows are unaffected
