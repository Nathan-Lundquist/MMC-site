# Snow Removal Form System — Requirements

**Date:** 2026-07-01
**Status:** Approved
**Scope:** Standard

## Outcome

Field crew can log snow site visits from their phones during storms. Managers can group those logs into storm events after the fact by selecting a date/time range. Costs auto-calculate from material quantities and configured rates.

## Users & Roles

- **Crew (CREW, FOREMAN):** Log site visits from mobile in the field. No cost entry.
- **Managers (ADMIN, MANAGER):** Create storm events, configure material rates and site list, view roll-up costs.

## Core Features

### 1. Log Site Visit (crew form — mobile-first)

The primary form field crew uses at each stop. Must be fast, thumb-friendly, minimal typing.

**Fields:**
- **Site** — Pick from fixed site list (single-select). Required.
- **Services performed** — Checkboxes with count inputs for each:
  - Plow (count)
  - Salt Lot (count)
  - Shovel (count)
  - Salt Walk (count)
- **Materials used** — Numeric inputs:
  - Bulk salt (yards)
  - Ice melter (bags)
  - Calcium chloride (bags)
- **Crew members** — Multi-select from employee list. Required (at least one).
- **Start time** — Defaults to "now" on form open. Editable.
- **End time** — Defaults to "now" on submit. Editable.
- **Services performed (text)** — Free-text notes on what was done.
- **Additional work** — Toggle + description field if extra work was requested.
- **Site notes** — Optional free-text.

**Behavior:**
- Any authenticated employee can submit.
- Worker name auto-populated from logged-in user.
- Site service records are standalone (not tied to a storm until a manager groups them).
- After submit, quick "Log Another" action to chain entries during a route.

### 2. Create Storm (manager flow)

Managers create storm events after the fact by defining a date/time window.

**Fields:**
- **Description** — Storm name/description. Required.
- **Event start** — Date + time picker. Required.
- **Event end** — Date + time picker. Required.

**Behavior:**
- On create, system queries all site service logs where `startTime` falls within the event window.
- Matched logs are associated with the storm (`stormId` set).
- Storm-level cost totals auto-calculated by summing site service costs.
- Manager can review matched logs and manually add/remove if needed.

### 3. Snow Settings (manager config)

**Material rates** — Editable rate table:
- Bulk salt: $/yard
- Ice melter: $/bag
- Calcium chloride: $/bag
- Fuel: $/hour (or flat per-site)

**Site list** — CRUD for the fixed site list:
- Add site (name)
- Edit site name
- Deactivate site (soft delete)

**Employee cost rate** — $/hour rate for labor cost calculation.

### 4. Cost Auto-Calculation

When a site service is saved (or rates are updated), costs are computed:
- `bulkSaltCost` = bulkSaltYards × bulk salt rate
- `iceMelterCost` = iceMelterBags × ice melter rate
- `calciumCost` = calciumChlorideBags × calcium chloride rate
- `employeeCost` = duration hours × crew size × employee hourly rate
- `fuelCost` = computed from configured fuel rate
- `totalDirect` = sum of material costs + employee cost + fuel
- `totalIndirect` = configurable overhead multiplier or flat amount
- Storm-level totals = sum of all associated site service costs

## Non-Goals

- Real-time GPS tracking of crew locations
- Customer-facing storm reports
- Integration with weather APIs
- Photo upload per site visit (can add later)

## Dependencies

- Fixed site list needs initial population (from existing imported data or manual entry)
- Material rates need initial configuration values from Mike
- Schema changes: new `SnowSite` model for the fixed site list, new `SnowRate` model for rate config, update `SnowSiteService` to support unassigned storm (nullable `stormId` — already nullable in schema)

## Success Criteria

- Crew member can log a site visit in under 60 seconds on mobile
- Manager can create a storm and have all matching logs auto-associated
- Cost totals on storm detail page match sum of auto-calculated site costs
