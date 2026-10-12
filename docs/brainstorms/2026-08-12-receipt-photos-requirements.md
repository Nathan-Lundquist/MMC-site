# Receipt Photos — Requirements

**Date:** 2026-08-12
**Status:** Ready for planning
**Scope tier:** Standard

---

## Problem

Employees purchase materials, fuel, and pay dump fees in the field. There is currently no way to attach proof-of-purchase to a job. Receipts are handled informally (text photos to Mike, keep paper copies, or get lost). The business needs a lightweight, mobile-first way to capture receipt images tied to a specific work order so managers can review and reconcile expenses.

---

## Primary Actor

Any logged-in employee (all roles: CREW, FOREMAN, MANAGER, ADMIN) in the field on a mobile phone.

---

## Core Outcome

An employee can photograph a receipt and attach it to a work order in under 30 seconds. The receipt — with expense type and dollar amount — is immediately visible on the job detail page to anyone with portal access.

---

## Functional Requirements

### Upload flow

- On the job detail page, a **Receipts** section shows existing receipts and an **Add Receipt** button.
- Tapping **Add Receipt** opens a modal/sheet with:
  - A photo input (uses device camera on mobile; `accept="image/*" capture="environment"`)
  - An expense type selector: **Materials**, **Fuel**, **Dump Fee**, **Other**
  - A dollar amount field (numeric, required)
- On submit, the image is uploaded to Vercel Blob and a receipt record is saved to the database.
- The new receipt appears immediately in the receipts section without a full page reload.

### Receipts section (job detail page)

- Displays all receipts attached to the work order.
- Each receipt card shows:
  - Thumbnail of the receipt photo (tappable to view full size)
  - Expense type badge
  - Dollar amount
  - Uploaded by (employee name)
  - Upload date/time
- Sorted newest first.
- Total receipts amount is summed and displayed at the top of the section.

### Permissions

- All authenticated employees can upload receipts to any active work order.
- All authenticated employees can view receipts on any work order.
- Delete: ADMIN and MANAGER only (soft consideration — can defer if adds complexity).

### Image handling

- Accept: JPEG, PNG, HEIC (common phone formats).
- Max file size: 10 MB per image.
- Images stored in Vercel Blob (already installed as `@vercel/blob`).
- Store the public Blob URL in the database.

---

## Data Model (new)

A new `Receipt` model is needed — separate from the existing `Photo` model (which is BEFORE/AFTER only and has no financial metadata).

Fields needed:
- Link to `WorkOrder`
- Blob URL (image)
- Expense type (enum: MATERIALS, FUEL, DUMP_FEE, OTHER)
- Amount (decimal)
- Uploaded by (link to `Employee`)
- Created at timestamp

---

## Scope Boundaries

### In scope
- Receipt capture (camera + gallery) on the job detail page
- Expense type + amount metadata
- Vercel Blob storage
- Receipts section with thumbnails and totals
- Mobile-optimized UI

### Deferred for later (feature 6)
- End-of-day receipt review email to manager/admin
- Daily summary of all receipts across jobs
- Export to CSV or accounting integration

### Out of scope
- OCR / AI parsing of receipt amounts
- Approval or rejection workflow
- Receipts on the marketing site or any non-portal page
- Receipts tied to specific `OutsourcedMaterial` line items (just job-level for now)

---

## Success Criteria

1. An employee on a phone can attach a receipt photo to a job in one tap sequence — no desktop required.
2. The receipt appears on the job detail page immediately after upload.
3. Managers can see all receipts for a job with a running total.
4. Images are stored durably (Vercel Blob) and not on the local filesystem.

---

## Dependencies / Assumptions

- `@vercel/blob` is already installed (`package.json`). `BLOB_READ_WRITE_TOKEN` env var must be set.
- Job detail page exists at `src/app/portal/jobs/[id]/` — receipts section is added there.
- The existing `Photo` model is not extended; a new `Receipt` model is cleaner given the financial metadata.
- No approval flow means no notification emails in this sprint.
