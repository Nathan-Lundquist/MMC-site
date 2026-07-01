---
title: "feat: Snow removal form system"
status: active
origin: docs/brainstorms/2026-07-01-snow-form-system-requirements.md
date: 2026-07-01
type: feat
depth: standard
---

# feat: Snow Removal Form System

## Summary

Build a mobile-first form system for MCC snow removal operations. Field crew log site visits from their phones (site, services, materials, crew). Managers create storm events by date range that auto-associate matching logs. Costs auto-calculate from configured rates.

---

## Problem Frame

MCC has 2,600+ imported snow site service records but no way to create new ones through the portal. Field crew currently have no digital logging tool. Managers need storm-level cost roll-ups but can only view pre-imported data. The portal needs forms for both entry and management.

---

## Requirements

- R1. Crew can log a site visit in under 60 seconds on mobile
- R2. Site selection from a fixed, managed list (no free-text site names)
- R3. Service counts (plow, salt lot, shovel, salt walk) captured per visit
- R4. Material quantities (bulk salt, ice melter, calcium chloride) captured per visit
- R5. Crew members recorded per visit (multi-select from employee list)
- R6. Site services exist independently until a manager groups them into a storm
- R7. Manager creates storm by date range; matching ungrouped logs auto-associate
- R8. Costs auto-calculated from material quantities × configured rates
- R9. Managers can configure material rates and manage the fixed site list

(see origin: docs/brainstorms/2026-07-01-snow-form-system-requirements.md)

---

## Key Technical Decisions

**KTD-1. Standalone site service logs (no storm required)**
Site services are created with `stormId = null`. The `stormId` FK is already nullable in the schema. When a manager creates a storm with a date range, all unlinked services within that window get their `stormId` set. This decouples crew logging from manager workflow.

**KTD-2. New SnowSite model for the fixed site list**
Rather than storing site names as free text (current schema), add a `SnowSite` model with `id`, `name`, and `active` fields. The site service form picks from active sites. Existing imported `siteName` values can seed the initial list. The `SnowSiteService.siteName` field stays as-is (denormalized string) for simplicity and backwards compatibility with imported data — the form writes the selected site's name to this field.

**KTD-3. New SnowRate model for rate configuration**
A single-row config table with columns for each rate (bulk salt $/yd, ice melter $/bag, calcium chloride $/bag, employee $/hr, fuel $/hr, indirect overhead multiplier). Seeded with zeroes; manager fills in real values via settings page.

**KTD-4. Reuse form-ui.tsx primitives**
The existing `MobileInput`, `MobileSelect`, `NowBtn`, `Field`, and `SectionHeader` components in `src/components/portal/work-order-form/form-ui.tsx` are generic enough to reuse. Import directly rather than duplicating.

**KTD-5. Cost calculation in the API, not the client**
Costs are computed server-side in the POST/PUT handler by reading current rates from `SnowRate`. This ensures consistency and prevents stale client-side rates.

**KTD-6. Crew members stored as comma-separated names**
The existing `workerName` field is a plain string (not a relation). For multi-crew logging, store as comma-separated names (e.g., "Jordan, Chase, Steve"). A future migration could normalize this to a join table, but the current schema doesn't support it and the overhead isn't justified yet.

---

## Scope Boundaries

### In Scope
- Schema migration (SnowSite, SnowRate models)
- Site visit log form (mobile-first, crew-facing)
- Storm creation with auto-association
- Snow settings page (sites + rates)
- Cost auto-calculation on save
- Sidebar nav updates for new pages
- Seeding initial site list from existing data

### Deferred to Follow-Up Work
- Editing existing site services
- Storm editing (change date range, re-associate)
- Photo upload per site visit
- Push notifications when storm is created
- Bulk import/export of site service data
- Normalizing workerName to employee relations

### Non-Goals
- GPS tracking
- Customer-facing reports
- Weather API integration

---

## Implementation Units

### U1. Schema migration — SnowSite and SnowRate models

**Goal:** Add the two new Prisma models and run migration on both local and Neon DBs.

**Requirements:** R2, R8, R9

**Dependencies:** None

**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/20260701100000_add_snow_site_and_rate/migration.sql`

**Approach:**
- `SnowSite`: id (cuid), name (String, unique), active (Boolean, default true), createdAt
- `SnowRate`: id (cuid), bulkSaltPerYard (Decimal 10,2 default 0), iceMelterPerBag (Decimal 10,2 default 0), calciumPerBag (Decimal 10,2 default 0), employeePerHour (Decimal 10,2 default 0), fuelPerHour (Decimal 10,2 default 0), indirectMultiplier (Decimal 5,4 default 0), updatedAt
- Create migration SQL manually (non-interactive environment — `prisma migrate dev` fails, use `prisma migrate deploy`)
- Apply to both local DB and Neon production
- Run `prisma generate` after

**Patterns to follow:** Existing migration pattern in `prisma/migrations/`

**Test scenarios:**
- Models generate valid Prisma client types
- SnowSite can be created and queried
- SnowRate can be created and queried
- Unique constraint on SnowSite.name prevents duplicates

**Verification:** `prisma generate` succeeds, migration applies to both DBs

---

### U2. Seed initial site list from imported data

**Goal:** Populate SnowSite from distinct `siteName` values in existing SnowSiteService records.

**Requirements:** R2

**Dependencies:** U1

**Files:**
- `prisma/seed-snow-sites.ts`

**Approach:**
- Query `SELECT DISTINCT site_name FROM snow_site_services ORDER BY site_name`
- Upsert each as a SnowSite record
- Run against both local and Neon DBs

**Patterns to follow:** Existing `prisma/seed.ts` and `prisma/set-usernames.ts` one-off script pattern

**Test scenarios:**
- Script creates SnowSite records for each distinct site name
- Running twice does not create duplicates

**Verification:** SnowSite count matches distinct site names in existing data

---

### U3. Snow settings API — sites and rates

**Goal:** API endpoints for managing the fixed site list and rate configuration.

**Requirements:** R2, R9

**Dependencies:** U1

**Files:**
- `src/app/api/snow/sites/route.ts` — GET (list active), POST (create)
- `src/app/api/snow/sites/[id]/route.ts` — PUT (edit name, toggle active)
- `src/app/api/snow/rates/route.ts` — GET (current rates), PUT (update rates)
- `src/lib/schemas.ts` — add `snowSiteSchema`, `snowRateSchema`

**Approach:**
- Sites: GET returns active sites sorted by name. POST creates new site (ADMIN/MANAGER). PUT updates name or active status.
- Rates: GET returns the single SnowRate row (create with defaults if none exists). PUT updates all rate fields at once.
- All write endpoints restricted to ADMIN/MANAGER via `requireAuth(["ADMIN", "MANAGER"])`.
- Zod validation for all inputs.

**Patterns to follow:** `src/app/api/jobs/route.ts` for auth + validation pattern

**Test scenarios:**
- GET /api/snow/sites returns only active sites
- POST /api/snow/sites creates a new site, returns 201
- POST /api/snow/sites with duplicate name returns 409
- PUT /api/snow/sites/[id] can toggle active to false
- GET /api/snow/rates returns current rates (auto-creates if none exist)
- PUT /api/snow/rates updates all rate fields
- Non-admin users get 403 on all write endpoints

**Verification:** API endpoints respond correctly via manual testing

---

### U4. Site service log API

**Goal:** API endpoint for crew to submit site visit logs.

**Requirements:** R1, R3, R4, R5, R6, R8

**Dependencies:** U1, U3

**Files:**
- `src/app/api/snow/services/route.ts` — POST (create), GET (list unlinked)
- `src/lib/schemas.ts` — add `snowSiteServiceSchema`
- `src/lib/snow-cost.ts` — cost calculation helper

**Approach:**
- POST accepts: siteId (looked up to get name), startTime, endTime, servicesPerformed, plowCount, saltLotCount, shovelCount, saltWalkCount, bulkSaltYards, iceMelterBags, calciumChlorideBags, crewMembers (string array), additionalWorkRequested, additionalWorkDesc, siteNotes.
- Server resolves site name from siteId, builds workerName from crewMembers array (comma-joined), computes costs from SnowRate, and creates the SnowSiteService with `stormId = null`.
- Cost calculation function `computeSiteServiceCosts(quantities, rates, durationHours, crewSize)` returns all cost fields.
- GET with `?unlinked=true` returns services where `stormId IS NULL`, for the storm creation flow.
- Any authenticated user can POST (crew in the field).

**Patterns to follow:** `src/app/api/jobs/route.ts` for transaction pattern, `src/lib/api-auth.ts` for auth

**Test scenarios:**
- POST creates a site service with stormId = null
- Costs are correctly calculated from rates × quantities
- Employee cost = duration hours × crew size × employee rate
- Material costs = quantity × per-unit rate
- Total direct = sum of all cost components
- Invalid siteId returns 400
- Missing required fields (siteName, times) return 400
- GET ?unlinked=true returns only services with no storm

**Verification:** Created records have correct computed costs matching rate × quantity

---

### U5. Site visit log form (mobile-first crew form)

**Goal:** The primary mobile form for field crew to log site visits.

**Requirements:** R1, R2, R3, R4, R5, R6

**Dependencies:** U3, U4

**Files:**
- `src/app/portal/snow/log/page.tsx` — server component wrapper (loads sites + employees)
- `src/components/portal/snow-form/SiteVisitForm.tsx` — "use client" orchestrator
- `src/components/portal/snow-form/index.ts` — barrel export

**Approach:**
- Server component fetches active SnowSites and active Employees, passes to client form.
- Form state managed via useState in orchestrator (no form library — matches WO form pattern).
- Layout: single scrollable column, cards for each section, fixed bottom save bar.
- **Site section:** MobileSelect dropdown with active sites.
- **Services section:** Four rows, each with a checkbox + stepper/count input (plow, salt lot, shovel, salt walk). Checkbox enables the count input.
- **Materials section:** Three numeric inputs with labels (bulk salt yards, ice melter bags, calcium chloride bags). Use MobileInput with `type="number"` and `inputMode="decimal"`.
- **Crew section:** Multi-select using checkboxes for each active employee. Show as a grid of toggleable chips or a checkbox list.
- **Times:** Start time defaults to form mount time. End time defaults to current time. Both editable via datetime-local input. NowBtn to reset to current time.
- **Notes:** Optional textarea for services performed text and site notes.
- **Additional work:** Checkbox toggle + conditional textarea.
- **Submit:** POST to `/api/snow/services`. On success, show "Logged!" with a "Log Another" button that resets the form (keeping crew selection sticky for chaining).
- Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t p-3 sm:relative sm:bg-transparent`.

**Patterns to follow:** `src/components/portal/work-order-form/WorkOrderForm.tsx` for orchestrator pattern, `form-ui.tsx` for mobile primitives

**Test scenarios:**
- Form loads with site dropdown populated
- Selecting a site is required before submit
- At least one crew member must be selected
- Start time defaults to page load time
- Submit sends correct payload to API
- On success, "Log Another" resets form but keeps crew selection
- On error, error message displays inline
- Form is usable on 375px wide viewport (mobile)

**Verification:** End-to-end: log a site visit on mobile viewport, verify record created in DB with correct costs

---

### U6. Storm creation with auto-association

**Goal:** Manager flow to create a storm and auto-link site service logs within the date range.

**Requirements:** R7, R8

**Dependencies:** U4

**Files:**
- `src/app/portal/snow/new/page.tsx` — storm creation page
- `src/components/portal/snow-form/StormForm.tsx` — "use client" form
- `src/app/api/snow/route.ts` — update existing POST to auto-associate and add Zod validation

**Approach:**
- Form: description, eventStart (datetime-local), eventEnd (datetime-local).
- On submit, POST to `/api/snow`. API creates the storm, then queries `SnowSiteService WHERE stormId IS NULL AND startTime >= eventStart AND startTime <= eventEnd` and sets their `stormId`. Finally, sums all associated service costs and updates the storm's aggregate cost fields.
- After create, show count of matched services and redirect to storm detail page.
- Add "New Storm" button to the storm list page header (ADMIN/MANAGER only).

**Patterns to follow:** `src/app/portal/snow/page.tsx` for list page pattern, `WorkOrderForm.tsx` for form pattern

**Test scenarios:**
- Creating a storm with a date range auto-links matching unlinked services
- Services already linked to another storm are not stolen
- Storm cost totals equal sum of linked service costs
- Empty date range (no matching services) still creates the storm with zero costs
- Form validates description and both dates required
- Non-admin/manager users cannot access the create page

**Verification:** Create a storm after logging test services; verify auto-association and cost totals on detail page

---

### U7. Snow settings page — sites and rates

**Goal:** Manager-facing settings page for configuring the fixed site list and material rates.

**Requirements:** R9

**Dependencies:** U3

**Files:**
- `src/app/portal/snow/settings/page.tsx` — server component wrapper
- `src/components/portal/snow-form/SnowSettings.tsx` — "use client" settings UI

**Approach:**
- Two sections: Site List and Material Rates.
- **Site list:** Table of sites with name and active toggle. Inline edit for name. "Add Site" button at top. Uses fetch to `/api/snow/sites`.
- **Rates:** Simple form with labeled inputs for each rate field. Save button updates all rates at once via PUT `/api/snow/rates`.
- Page restricted to ADMIN/MANAGER role (check session in server component, redirect if unauthorized).

**Patterns to follow:** Existing portal page patterns, `form-ui.tsx` MobileInput for inputs

**Test scenarios:**
- Site list shows all sites (including inactive, marked visually)
- Adding a new site appears in the list immediately
- Toggling active status updates the site
- Rate form loads current values
- Saving rates persists and reloads correct values
- Non-admin users are redirected

**Verification:** Add a site, toggle it off, verify it disappears from the log form's dropdown. Update a rate, log a service, verify cost uses new rate.

---

### U8. Sidebar navigation updates

**Goal:** Add new Snow Removal nav items for the log form and settings page.

**Requirements:** R1, R9

**Dependencies:** U5, U7

**Files:**
- `src/components/portal/PortalShell.tsx`

**Approach:**
- Add "Log Visit" link to the Snow Removal section (visible to all roles, icon: ClipboardPlus or PenLine).
- Add "Snow Settings" link (ADMIN/MANAGER only — add a per-item `adminOnly` flag or create a separate admin sub-section).
- Keep existing "Storms" link.

**Patterns to follow:** Existing `NAV_SECTIONS` structure in `PortalShell.tsx`

**Test scenarios:**
- All authenticated users see "Storms" and "Log Visit" in the Snow Removal section
- Only ADMIN/MANAGER see "Snow Settings"
- Links navigate to correct pages
- Active state highlights correctly

**Verification:** Visual inspection of sidebar at different roles

---

## Open Questions

- **Q1.** What are Mike's actual material rates? (needed to seed SnowRate — defaulting to 0 until configured)
- **Q2.** Should the storm creation flow show a preview of matched services before confirming? (deferred — can add after MVP)

---

## Risks & Dependencies

- **Non-interactive Prisma migrate:** Must create migration SQL manually and use `prisma migrate deploy` (not `migrate dev`). Documented gotcha.
- **Dual-DB deployment:** Migration must be applied to both local PostgreSQL and Neon production. Follow the baseline pattern established earlier (mark existing migrations as applied if needed).
- **Mobile viewport testing:** The form must be tested on actual mobile widths (375px). The existing `h-11` touch targets and fixed bottom bar patterns handle this, but new form sections need verification.

---

## Sources & Research

- Origin: `docs/brainstorms/2026-07-01-snow-form-system-requirements.md`
- Work order form pattern: `src/components/portal/work-order-form/WorkOrderForm.tsx`
- Form UI primitives: `src/components/portal/work-order-form/form-ui.tsx`
- Auth pattern: `src/lib/api-auth.ts`
- Zod schemas: `src/lib/schemas.ts`
- Current snow API: `src/app/api/snow/route.ts`
- Current snow pages: `src/app/portal/snow/page.tsx`, `src/app/portal/snow/[id]/page.tsx`
