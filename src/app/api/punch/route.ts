import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// GET /api/punch?date=YYYY-MM-DD  — today's punches for current user (or all employees if admin + ?all=true)
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const all = searchParams.get("all") === "true";

  const date = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const isAdmin = ["ADMIN", "MANAGER"].includes(session.user.role);

  const punches = await prisma.punchRecord.findMany({
    where: {
      ...(all && isAdmin ? {} : { employeeId: session.user.id }),
      punchIn: { gte: start, lte: end },
    },
    include: {
      employee: { select: { id: true, name: true, role: true } },
      workOrder: { select: { id: true, workOrderNumber: true, jobType: true, customer: { select: { name: true } } } },
      extras: true,
    },
    orderBy: { punchIn: "desc" },
  });

  return NextResponse.json(punches);
}

// POST /api/punch  — punch in
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Check for an already-open punch
  const open = await prisma.punchRecord.findFirst({
    where: { employeeId: session.user.id, punchOut: null },
  });
  if (open) {
    return NextResponse.json({ error: "You are already punched in" }, { status: 400 });
  }

  const body = await req.json();
  const { workOrderId, notes } = body;

  const punch = await prisma.punchRecord.create({
    data: {
      employeeId: session.user.id,
      workOrderId: workOrderId || null,
      punchIn: new Date(),
      notes: notes || null,
    },
    include: {
      workOrder: { select: { workOrderNumber: true, jobType: true, customer: { select: { name: true } } } },
      extras: true,
    },
  });

  return NextResponse.json(punch, { status: 201 });
}
