import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { BOARD_MOVE_ROLES, BOARD_COLUMNS } from "@/lib/constants";

const BOARD_STATUSES: Set<string> = new Set(BOARD_COLUMNS.map((c) => c.status));

// PATCH /api/jobs/[id]/status — board-driven status change (DRAFT/IN_PROGRESS/COMPLETED only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth([...BOARD_MOVE_ROLES]);
  if (authError) return authError;

  const { id } = await params;

  let body: { status?: string; fromStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, fromStatus } = body;
  if (!status || !BOARD_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status must be one of DRAFT, IN_PROGRESS, COMPLETED" },
      { status: 400 }
    );
  }
  if (!fromStatus || !BOARD_STATUSES.has(fromStatus)) {
    return NextResponse.json(
      { error: "fromStatus must be one of DRAFT, IN_PROGRESS, COMPLETED" },
      { status: 400 }
    );
  }

  // Atomic conditional update: the WHERE clause encodes the expected current status, so a
  // concurrent request that already moved this job will cause this one to match zero rows
  // instead of both requests racing past a separate read-then-write check.
  const result = await prisma.workOrder.updateMany({
    where: { id, status: fromStatus as "DRAFT" | "IN_PROGRESS" | "COMPLETED" },
    data: {
      status: status as "DRAFT" | "IN_PROGRESS" | "COMPLETED",
      boardStatusChangedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const current = await prisma.workOrder.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Job was already updated", currentStatus: current.status },
      { status: 409 }
    );
  }

  return NextResponse.json({ id, status });
}
