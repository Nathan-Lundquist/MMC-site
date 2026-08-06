import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// PATCH /api/punch/[id]  — punch out
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const punch = await prisma.punchRecord.findUnique({ where: { id } });
  if (!punch) {
    return NextResponse.json({ error: "Punch record not found" }, { status: 404 });
  }

  const isAdmin = ["ADMIN", "MANAGER"].includes(session.user.role);
  if (punch.employeeId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (punch.punchOut) {
    return NextResponse.json({ error: "Already punched out" }, { status: 400 });
  }

  const updated = await prisma.punchRecord.update({
    where: { id },
    data: { punchOut: new Date() },
    include: {
      workOrder: { select: { workOrderNumber: true, jobType: true, customer: { select: { name: true } } } },
      extras: true,
    },
  });

  return NextResponse.json(updated);
}
