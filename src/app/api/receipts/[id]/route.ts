import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// DELETE /api/receipts/[id] — remove a receipt (ADMIN/MANAGER only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth(["ADMIN", "MANAGER"]);
  if (authError) return authError;

  const { id } = await params;

  const receipt = await prisma.receipt.findUnique({ where: { id } });
  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  await del(receipt.url);
  await prisma.receipt.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
