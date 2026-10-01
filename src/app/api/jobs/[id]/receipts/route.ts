import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { MAX_UPLOAD_SIZE, RECEIPT_TYPES } from "@/lib/constants";
import { toReceiptDTO } from "@/lib/receipts";

export const maxDuration = 60;

const VALID_RECEIPT_TYPES = new Set(RECEIPT_TYPES.map((t) => t.value));
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic"]);

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
  if (!type || !VALID_RECEIPT_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid receipt type" }, { status: 400 });
  }
  const amount = amountRaw ? Number(amountRaw) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const blob = await put(`receipts/${workOrderId}/${Date.now()}_${file.name}`, file, {
    access: "public",
    contentType: file.type,
  });

  const receipt = await prisma.receipt.create({
    data: {
      workOrderId,
      uploadedById: session.user.id,
      url: blob.url,
      type: type as "MATERIALS" | "FUEL" | "DUMP_FEE" | "OTHER",
      amount,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(toReceiptDTO(receipt), { status: 201 });
}
