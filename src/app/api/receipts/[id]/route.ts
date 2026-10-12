import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { RECEIPT_DELETE_ROLES } from "@/lib/constants";

// DELETE /api/receipts/[id] — remove a receipt (ADMIN/MANAGER only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth([...RECEIPT_DELETE_ROLES]);
  if (authError) return authError;

  const { id } = await params;

  try {
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Blob delete must succeed before the DB row is removed — a failed blob
    // delete leaves the row intact rather than orphaning a deleted blob with
    // a dangling DB reference.
    await del(receipt.url);

    try {
      await prisma.receipt.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        // Already deleted by a concurrent request — the blob is gone either way.
        return new NextResponse(null, { status: 204 });
      }
      console.error(
        `Receipt ${id}: blob deleted but DB row delete failed — row is now orphaned, pointing at a removed blob:`,
        err
      );
      return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Receipt delete failed:", err);
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
  }
}
