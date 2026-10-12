import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { fileTypeFromBuffer } from "file-type";
import { Prisma, ReceiptType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { MAX_UPLOAD_SIZE, RECEIPT_TYPES } from "@/lib/constants";
import { toReceiptDTO } from "@/lib/receipts";

// Assumption (named per review): only CANCELLED work orders reject new receipts,
// matching the one existing "closed state" precedent in this codebase
// (src/app/api/jobs/bulk-costing/route.ts uses `status: { not: "CANCELLED" }`).
// INVOICED/PAID jobs still accept receipts since late expense reconciliation
// is a normal flow; revisit if the business wants a stricter cutoff.
const BLOCKED_RECEIPT_STATUSES = new Set(["CANCELLED"]);

export const maxDuration = 60;

const VALID_RECEIPT_TYPES = new Set(RECEIPT_TYPES.map((t) => t.value));
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic"]);
const MAX_RECEIPT_AMOUNT = 99999999.99; // matches Receipt.amount Decimal(10,2) column

// POST /api/jobs/[id]/receipts — upload a receipt photo + expense metadata
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: workOrderId } = await params;

  const [workOrder, formData] = await Promise.all([
    prisma.workOrder.findUnique({ where: { id: workOrderId } }),
    req.formData(),
  ]);
  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (BLOCKED_RECEIPT_STATUSES.has(workOrder.status)) {
    return NextResponse.json(
      { error: "Cannot add receipts to a cancelled work order" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const amountRaw = formData.get("amount") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or HEIC images are accepted" },
      { status: 400 }
    );
  }
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const detectedType = await fileTypeFromBuffer(fileBuffer);
  if (!detectedType || !ACCEPTED_MIME_TYPES.has(detectedType.mime)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or HEIC images are accepted" },
      { status: 400 }
    );
  }
  if (!type || !VALID_RECEIPT_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid receipt type" }, { status: 400 });
  }
  const amount = amountRaw ? Number(amountRaw) : NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_RECEIPT_AMOUNT) {
    return NextResponse.json(
      { error: `Amount must be between $0.01 and $${MAX_RECEIPT_AMOUNT.toLocaleString()}` },
      { status: 400 }
    );
  }

  let blobUrl: string | undefined;
  try {
    const blob = await put(`receipts/${workOrderId}/${Date.now()}_${file.name}`, fileBuffer, {
      access: "public",
      contentType: detectedType.mime,
    });
    blobUrl = blob.url;

    const receipt = await prisma.receipt.create({
      data: {
        workOrderId,
        uploadedById: session.user.id,
        url: blob.url,
        type: type as ReceiptType,
        amount: new Prisma.Decimal(amount),
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json(toReceiptDTO(receipt), { status: 201 });
  } catch (err) {
    console.error("Receipt upload failed:", err);
    if (blobUrl) {
      await del(blobUrl).catch((delErr) => {
        console.error("Failed to clean up orphaned receipt blob:", blobUrl, delErr);
      });
    }
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
  }
}
