import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { getBoardJobs, toBoardJobDTO } from "@/lib/board";
import { createWorkOrderWithNumber } from "@/lib/work-order-number";
import { BOARD_MOVE_ROLES } from "@/lib/constants";

const quickCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  jobType: z.string().min(1, "Job type is required"),
  foremanId: z.string().optional(),
  projectStartDate: z.string().optional(),
});

// GET /api/board/jobs — jobs eligible for the Kanban board
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    return NextResponse.json(await getBoardJobs());
  } catch (err) {
    console.error("Board jobs fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

// POST /api/board/jobs — quick-create a job directly from the board
export async function POST(req: NextRequest) {
  const { error } = await requireAuth([...BOARD_MOVE_ROLES]);
  if (error) return error;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = quickCreateSchema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }
  const data = result.data;

  try {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const job = await createWorkOrderWithNumber((workOrderNumber) =>
      prisma.workOrder.create({
        data: {
          workOrderNumber,
          customerId: data.customerId,
          jobType: data.jobType,
          foremanId: data.foremanId || null,
          projectStartDate: data.projectStartDate ? new Date(data.projectStartDate) : null,
          status: "DRAFT",
        },
        include: {
          customer: { select: { name: true } },
          foreman: { select: { id: true, name: true } },
        },
      })
    );
    return NextResponse.json(toBoardJobDTO(job), { status: 201 });
  } catch (err) {
    console.error("Board job creation failed:", err);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
