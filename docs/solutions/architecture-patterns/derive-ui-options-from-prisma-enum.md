---
title: "Derive UI option lists and validators from the Prisma enum, not hand-typed copies"
date: 2026-10-15
category: docs/solutions/architecture-patterns
module: job-categories-shared-constants
problem_type: architecture_pattern
component: database
severity: medium
applies_when:
  - "Any UI option list, dropdown, or filter whose values correspond to a Prisma (or other ORM) enum"
  - "Any zod/validation schema whose valid values are an enum already defined in the schema layer"
  - "The same set of enum-like values is needed in more than one place (forms, filters, validators, labels, business logic)"
tags: [prisma, enum, zod, single-source-of-truth, job-categories]
---

# Derive UI option lists and validators from the Prisma enum, not hand-typed copies

## Context

A feature needed job-category option lists in several places: a form dropdown, a filter dropdown (with an "All Categories" option prepended), a zod validator for API input, and a constant used for filtering cleanup records. The category values already existed as a Prisma enum (`JobCategory`). The naive approach — hand-typing the list of category strings separately in each of these four places — creates four independent sources of truth that can silently drift from the Prisma schema (and from each other) any time the enum changes.

## Guidance

Derive all option lists and validators for an enum-backed field from the Prisma-generated enum itself, at runtime, rather than hand-typing values anywhere else in the codebase. Build one canonical list first, then derive every other list/schema/constant from it or validate against it directly:

```ts
import { JobCategory } from "@prisma/client";

export function formatCategory(cat: string) {
  return cat.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
}

export const JOB_CATEGORIES = Object.values(JobCategory).map((value) => ({
  value,
  label: formatCategory(value),
}));
```

From this single canonical list, the rest become mechanical derivations rather than independent hand-typed lists:

- `JOB_CATEGORY_FILTER_OPTIONS` — `JOB_CATEGORIES` with an "All Categories" option prepended.
- `jobCategorySchema` — a zod validator built with `z.nativeEnum(JobCategory, { message: "..." })`, validating directly against the Prisma enum rather than a separately maintained string union.
- `CLEAN_UP_CATEGORY_VALUES` — a constant used for filtering, again validated against the same enum's value set.

## Why This Matters

With a single canonical enum-derived list, there is exactly one place to update when the enum changes (add/remove/rename a `JobCategory` value in the Prisma schema), and every consumer — form, filter, validator, cleanup logic — picks up the change automatically on next build. The hand-typed alternative requires remembering to update N call sites in lockstep; missing one produces a subtle bug where, for example, the filter dropdown is missing a newly added category, or the zod validator rejects a value the Prisma schema now allows — bugs that surface at runtime rather than at compile/schema time, and that are easy to miss in review since each site looks locally correct.

## When to Apply

- Any UI option list, dropdown, or filter whose values correspond to a Prisma (or other ORM) enum.
- Any zod/validation schema whose valid values are an enum already defined elsewhere in the schema layer — prefer `z.nativeEnum(EnumType, ...)` over a hand-typed `z.enum([...])` string literal list.
- Any time the same set of enum-like values is needed in more than one place in the codebase (forms, filters, validators, display labels, constants for business logic).

## Examples

Before (hand-typed, drift-prone):

```ts
const JOB_CATEGORIES = [
  { value: "LAWN_CARE", label: "Lawn Care" },
  { value: "TREE_REMOVAL", label: "Tree Removal" },
  // ...manually kept in sync with schema.prisma JobCategory enum
];
const jobCategorySchema = z.enum(["LAWN_CARE", "TREE_REMOVAL" /* ... */]);
```

After: see Guidance above for `JOB_CATEGORIES` itself. The derived constants that build on it:

```ts
export const JOB_CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "All Categories" },
  ...JOB_CATEGORIES,
];
export const jobCategorySchema = z.nativeEnum(JobCategory, {
  message: "Job category is required",
});
```

## Related

- `src/lib/job-categories.ts` and `src/lib/schemas.ts` in mmc-next — the concrete implementation this pattern is drawn from.
- None yet in docs/solutions/ — first entry in this category for this repo.
