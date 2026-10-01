---
title: "feat: Add receipt photo capture to job detail page"
date: 2026-08-12
status: active
origin: docs/brainstorms/2026-08-12-receipt-photos-requirements.md
depth: standard
---

# feat: Add receipt photo capture to job detail page

**Origin:** `docs/brainstorms/2026-08-12-receipt-photos-requirements.md`
**Date:** 2026-08-12
**Depth:** Standard

---

## Summary

Add a mobile-first receipts section to each job detail page. Any employee can photograph a receipt, pick an expense category (Materials / Fuel / Dump Fee / Other), enter the amount, and submit — the image uploads to Vercel Blob and a record is persisted in the database. The receipts section shows all attached receipts with thumbnails, a running total, and delete controls for admins and managers.

---

## Problem Frame

Employees purchase materials, fuel, and pay dump fees in the field. Currently, receipts are texted to Mike, kept on paper, or lost. There is no structured proof-of-purchase attached to a work order. This makes reconciliation manual and error-prone.

The desired outcome: an employee in the field can attach a receipt photo to a job in under 30 seconds on a phone.

---

## Requirements

From origin document:

- Any authenticated employee (all roles) can upload receipts to any work order.
- Any authenticated employee can view receipts on any work order.
- Only ADMIN and MANAGER can delete receipts.
- Upload flow: photo input (camera on mobile) + expense type selector + dollar amount.
- Receipts displayed on job detail page: thumbnail, type badge, amount, uploader, date.
- Running total of receipt amounts shown at top of section.
- Sorted newest first.
- Images stored in Vercel Blob; public URL persisted in database.
- Accepted image types: JPEG, PNG, HEIC. Max size: 10 MB.
- New `Receipt` model — separate from the existing `Photo` model.

**Success criteria (from origin):**
1. Phone-only upload flow: camera tap → fill form → submit.
2. Receipt appears on job detail page immediately after upload.
3. Managers can see all receipts for a job with a running total.
4. Images stored durably in Vercel Blob, not on the filesystem.

---

## Key Technical Decisions

**KTD-1 — Separate Receipt model, not extending Photo**
The existing `Photo` model has `BEFORE`/`AFTER` types and no financial fields. Extending it with optional amount/type/uploader fields would make the model ambiguous and query-heavy. A clean `Receipt` model with its own `ReceiptType` enum gives better type safety and clearer semantics. (see origin)

**KTD-2 — Vercel Blob for image storage**
`@vercel/blob` is already installed. It handles large binary files, global CDN delivery, and public URL generation without requiring an S3 bucket setup. The `BLOB_READ_WRITE_TOKEN` env var must be set before upload works. (see origin)

**KTD-3 — ReceiptsSection as client component embedded in server page**
The job detail page (`src/app/portal/jobs/[id]/page.tsx`) is a server component. Adding optimistic UI and the upload form requires a client component. The pattern used elsewhere (e.g., `PunchCard` embedded in `src/app/portal/time/page.tsx`) is to fetch data server-side and pass it as props to a client component. Follow this pattern: server page fetches receipts, passes them as serialized props to `ReceiptsSection`.

**KTD-4 — Multipart upload via a dedicated API route**
Image upload requires `multipart/form-data`. The existing `/api/upload` route handles spreadsheets and should not be repurposed. A new route at `src/app/api/jobs/[id]/receipts/route.ts` (POST) handles the image and metadata. A separate route at `src/app/api/receipts/[id]/route.ts` (DELETE) handles deletion by receipt ID.

**KTD-5 — Delete included**
The requirements flagged delete as a soft consideration. It is included: a single DELETE endpoint with a role guard (ADMIN/MANAGER) and a trash icon button visible only to those roles. Complexity is minimal.

---

## High-Level Technical Design

### Upload data flow

```
Employee phone
  │
  ├─ taps "Add Receipt"
  │    → client sheet opens
  │
  ├─ fills: photo file + type + amount
  │    → POST /api/jobs/[id]/receipts
  │         multipart/form-data
  │
  │    API route:
  │      1. requireAuth() — any role
  │      2. validate: file ≤10MB, image type, amount numeric
  │      3. put(file, { access: 'public' }) → Vercel Blob → blobUrl
  │      4. prisma.receipt.create({ workOrderId, url, type, amount, uploadedById })
  │      5. return serialized receipt record
  │
  └─ ReceiptsSection adds receipt to local state (optimistic / confirmed)
       → receipt card appears immediately
```

### Delete flow

```
ADMIN/MANAGER taps trash icon on a receipt card
  │
  ├─ DELETE /api/receipts/[id]
  │    1. requireAuth(['ADMIN','MANAGER'])
  │    2. fetch receipt to get blobUrl
  │    3. del(blobUrl) — Vercel Blob deletion
  │    4. prisma.receipt.delete({ id })
  │    5. return 204
  │
  └─ ReceiptsSection removes card from local state
```

### Prisma schema additions

```
enum ReceiptType { MATERIALS  FUEL  DUMP_FEE  OTHER }

model Receipt {
  id           String      @id @default(cuid())
  workOrderId  String      @map("wo_id")
  workOrder    WorkOrder   @relation(...)
  uploadedById String      @map("uploaded_by_id")
  uploadedBy   Employee    @relation(...)
  url          String                         // Vercel Blob public URL
  type         ReceiptType
  amount       Decimal     @db.Decimal(10,2)
  createdAt    DateTime    @default(now())    @map("created_at")
}
// WorkOrder gains: receipts Receipt[]
// Employee gains:  receipts Receipt[]
```

---

## Implementation Units

### U1. Prisma: Receipt model + migration

**Goal:** Add `ReceiptType` enum and `Receipt` model to the schema; generate and apply migration.

**Requirements:** KTD-1, "New Receipt model" from origin.

**Dependencies:** None.

**Files:**
- `prisma/schema.prisma` — add `ReceiptType` enum, `Receipt` model, back-relations on `WorkOrder` and `Employee`
- `prisma/migrations/` — new migration generated by `prisma migrate dev`

**Approach:**
- Add `ReceiptType` enum with values `MATERIALS`, `FUEL`, `DUMP_FEE`, `OTHER`.
- Add `Receipt` model: `id` (cuid), `workOrderId`, `uploadedById`, `url` (String), `type` (ReceiptType), `amount` (Decimal 10,2), `createdAt` (default now). Map table to `receipts`.
- Add `receipts Receipt[]` relation to `WorkOrder` (cascade delete).
- Add `receipts Receipt[]` relation to `Employee`.
- Run `npx prisma migrate dev --name add-receipts` to generate and apply.
- Run `npx prisma generate` to regenerate the client.

**Patterns to follow:** `PunchRecord` / `PunchExtra` model pattern in `prisma/schema.prisma` — same ID, timestamp, and mapping conventions.

**Test scenarios:**
- Schema compiles without error after adding the model.
- Migration applies cleanly on a fresh DB.
- `prisma.receipt.create()` in Prisma Studio can create a receipt linked to a work order and employee.
- Cascade delete: deleting a work order removes its receipts.
- `amount` stored and retrieved as a Decimal (not float-rounded).

**Verification:** `npx prisma migrate status` shows no pending migrations; `npx prisma studio` shows the `receipts` table with correct columns.

---

### U2. API: Upload and delete receipt endpoints

**Goal:** Two API routes — POST to upload a receipt image + metadata, DELETE to remove a receipt.

**Requirements:** All upload/delete requirements from origin. KTD-2, KTD-4, KTD-5.

**Dependencies:** U1 (Receipt model must exist).

**Files:**
- `src/app/api/jobs/[id]/receipts/route.ts` — POST handler
- `src/app/api/receipts/[id]/route.ts` — DELETE handler

**Approach — POST `/api/jobs/[id]/receipts`:**
- Authenticate with `requireAuth()` (any role).
- Parse `multipart/form-data`: extract `file` (File), `type` (string), `amount` (string).
- Validate: file exists, file size ≤10 MB, MIME type is `image/jpeg | image/png | image/heic`, type is a valid `ReceiptType` value, amount is a parseable positive number.
- Confirm the `workOrderId` (from path param `[id]`) exists in the DB — return 404 if not.
- Upload file to Vercel Blob: `put(filename, file, { access: 'public', contentType: file.type })` from `@vercel/blob`. Use the Blob's returned `url`.
- `prisma.receipt.create(...)` with `workOrderId`, `uploadedById: session.user.id`, `url`, `type`, `amount`.
- Return the created receipt record (serialized: amount as number, dates as ISO strings).

**Approach — DELETE `/api/receipts/[id]`:**
- Authenticate with `requireAuth(['ADMIN', 'MANAGER'])`.
- Fetch receipt by `id`; return 404 if not found.
- Call `del(receipt.url)` from `@vercel/blob` to remove the image from storage.
- `prisma.receipt.delete({ where: { id } })`.
- Return 204.

**Patterns to follow:**
- `requireAuth` usage from `src/app/api/punch/route.ts`.
- Multipart parsing pattern: `req.formData()` as used in `src/app/api/upload/route.ts`.
- Error response shape: `NextResponse.json({ error: '...' }, { status: N })`.

**Test scenarios:**
- POST with valid image + type + amount returns 201 with receipt record.
- POST with file > 10 MB returns 400.
- POST with invalid MIME type (e.g., PDF) returns 400.
- POST with non-numeric amount returns 400.
- POST with invalid type string returns 400.
- POST with non-existent `workOrderId` returns 404.
- POST by unauthenticated user returns 401.
- DELETE by ADMIN returns 204 and record is gone from DB.
- DELETE by MANAGER returns 204 and record is gone from DB.
- DELETE by CREW or FOREMAN returns 403.
- DELETE with non-existent receipt ID returns 404.
- Vercel Blob `del()` is called before DB delete (so orphaned blobs don't accumulate on DB failure).

**Verification:** Manual test via curl or Postman with a sample JPEG. Receipt record appears in DB. Blob URL is publicly accessible. Delete removes both the DB row and the Blob object.

---

### U3. ReceiptsSection client component

**Goal:** A self-contained client component that displays the receipts list and hosts the Add Receipt sheet and delete controls.

**Requirements:** All UI/UX requirements from origin — thumbnails, type badge, amount, uploader, date, running total, newest-first sort, mobile camera input, immediate post-upload appearance, role-gated delete button.

**Dependencies:** U2 (endpoints must exist to wire up).

**Files:**
- `src/components/portal/ReceiptsSection.tsx` — new client component

**Approach:**
- Props: `workOrderId: string`, `initialReceipts: ReceiptItem[]`, `userRole: string`.
- `ReceiptItem` type: `{ id, url, type, amount, uploadedBy: string, createdAt: string }`.
- Local state: `receipts` (initialized from `initialReceipts`).
- **Receipts list:** Map over receipts sorted by `createdAt` descending. Each card: `<img>` thumbnail (tappable → opens full-size in new tab), type badge (color-coded per category), `$X.XX` amount, uploader name, relative date. Running total displayed as `Total: $X.XX` above the list.
- **Add Receipt button:** Opens a shadcn `Sheet` (slides up from bottom — natural mobile UX). Sheet contains:
  - `<input type="file" accept="image/*,image/heic" capture="environment">` — triggers camera on mobile.
  - Expense type `<Select>` (shadcn).
  - Amount `<Input type="number" min="0" step="0.01">`.
  - Submit button.
- **Submit handler:** POST to `/api/jobs/${workOrderId}/receipts` via `fetch` with `FormData`. On success, prepend the returned receipt to local `receipts` state. Show loading state during upload.
- **Delete:** Show trash `<Button variant="ghost" size="icon">` on each card only when `userRole === 'ADMIN' || userRole === 'MANAGER'`. On click, confirm with a simple `window.confirm` (no modal needed for a trash action), then DELETE `/api/receipts/${id}`. On success, remove receipt from local state.
- Show a skeleton/loading state during upload; show a toast or inline error on failure.

**Patterns to follow:**
- `PunchCard` in `src/app/portal/time/PunchCard.tsx` — client component receiving serialized server data as props, local state for optimistic updates, `fetch` calls to API routes.
- shadcn `Sheet` component for the slide-up form (same library already used throughout).
- Card and badge styling from existing job detail page sections.

**Test scenarios:**
- Renders empty state ("No receipts yet") when `initialReceipts` is empty.
- Renders correct count and total when receipts are present.
- Clicking Add Receipt opens the sheet.
- File input has `accept="image/*,image/heic"` and `capture="environment"` attributes.
- Submit with no file selected shows validation error / disabled submit.
- Submit with no amount shows validation error.
- Successful submit closes sheet and prepends new card to list.
- Total updates after new receipt is added.
- Trash button visible for ADMIN/MANAGER, hidden for CREW/FOREMAN.
- Successful delete removes card and updates total.
- Upload error shows inline error message.

**Verification:** Load the job detail page on a mobile device (or Chrome dev tools mobile emulation). Tap Add Receipt — camera opens. Fill form, submit. Receipt card appears with thumbnail. Admin can delete; crew cannot see the button.

---

### U4. Job detail page: fetch receipts + embed ReceiptsSection

**Goal:** Wire the server-side data fetch on the job detail page to include receipts, and embed `ReceiptsSection` at the bottom.

**Requirements:** "Receipt appears on job detail page immediately after upload" (success criterion). "Receipts section" from origin.

**Dependencies:** U1 (model), U3 (component).

**Files:**
- `src/app/portal/jobs/[id]/page.tsx` — add `receipts` include to Prisma query, import and render `ReceiptsSection`

**Approach:**
- Add `receipts: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }` to the existing `prisma.workOrder.findUnique` include.
- Fetch session with `auth()` to get `session.user.role` for the role-gated delete button.
- Serialize the receipts array to plain objects (convert `Decimal` amount to `Number`, `DateTime` to ISO string).
- Import and render `<ReceiptsSection workOrderId={wo.id} initialReceipts={serializedReceipts} userRole={session.user.role} />` at the bottom of the page, after all existing sections.

**Patterns to follow:**
- Same serialization pattern already used on `src/app/portal/time/page.tsx` (Prisma types → plain objects before passing to client components).
- `auth()` import from `src/lib/auth` already used in other portal server components.

**Test scenarios:**
- Job detail page loads without error when receipts relation is added to query.
- Page shows "No receipts yet" state when a job has no receipts.
- Existing receipts (added via API) appear on page load.
- `ReceiptsSection` receives correct `userRole` — admin sees delete buttons, crew does not.

**Verification:** `npm run dev` — navigate to `/portal/jobs/[any-id]`. Receipts section renders at the bottom. Add a receipt via the UI and confirm it persists on page refresh.

---

## Scope Boundaries

### In scope
- `Receipt` Prisma model + migration
- POST upload endpoint (Vercel Blob + DB)
- DELETE endpoint (ADMIN/MANAGER only)
- `ReceiptsSection` client component with camera-friendly upload sheet
- Job detail page integration
- Running total display

### Deferred to Follow-Up Work
- End-of-day receipt review email to manager/admin (feature 6)
- Daily summary of receipts across all jobs
- Export to CSV or accounting software

### Out of scope
- OCR / AI parsing of receipt amounts
- Approval or rejection workflow
- Receipt linking to specific `OutsourcedMaterial` line items
- Receipts on any non-portal page

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| `BLOB_READ_WRITE_TOKEN` not set in dev env | Document in `.env.example`; the upload route will throw a clear error if missing |
| HEIC image support varies by browser/OS | `accept="image/*,image/heic"` covers it on iOS; on Android HEIC is uncommon; Vercel Blob accepts any binary |
| Blob deletion fails silently if URL is wrong | Delete endpoint fetches the receipt from DB first to get the canonical URL; returns 404 early if not found |
| Large file upload timeout | `export const maxDuration = 60` on the upload route (matches existing upload route pattern) |

---

## Open Questions

- **BLOB_READ_WRITE_TOKEN in production:** Must be added to Vercel environment variables before deploying. Confirm with Nathan before first production deploy.
- **Image resizing:** Currently no resizing — the full-resolution phone image uploads to Blob. For a large crew over time this may grow storage costs. Deferred as a future optimization.
