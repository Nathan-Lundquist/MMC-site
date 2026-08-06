import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// POST /api/punch/[id]/extra  — add extra hours to a punch record
export async function POST(
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

  const body = await req.json();
  const { type, hours, notes } = body;

  if (!type || !hours || Number(hours) <= 0) {
    return NextResponse.json({ error: "Type and hours are required" }, { status: 400 });
  }

  const extra = await prisma.punchExtra.create({
    data: {
      punchRecordId: id,
      type,
      hours,
      notes: notes || null,
    },
  });

  return NextResponse.json(extra, { status: 201 });
}
