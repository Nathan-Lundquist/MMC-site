import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { toBoardJobDTO } from "@/lib/board";
import { BOARD_DONE_WINDOW_DAYS } from "@/lib/constants";

const MAX_CREATE_RETRIES = 10;

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

  const doneWindowStart = new Date(
    Date.now() - BOARD_DONE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const jobs = await prisma.workOrder.findMany({
    where: {
      OR: [
        { status: { in: ["DRAFT", "IN_PROGRESS"] } },
        {
          status: "COMPLETED",
          boardStatusChangedAt: { gte: doneWindowStart },
        },
      ],
    },
    include: {
      customer: { select: { name: true } },
      foreman: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs.map(toBoardJobDTO));
}

// POST /api/board/jobs — quick-create a job directly from the board
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
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

  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  for (let attempt = 0; attempt < MAX_CREATE_RETRIES; attempt++) {
    const lastCW = await prisma.workOrder.findFirst({
      where: { workOrderNumber: { startsWith: "CW-" } },
      orderBy: { workOrderNumber: "desc" },
      select: { workOrderNumber: true },
    });

    let nextNum = 1;
    if (lastCW) {
      const num = parseInt(lastCW.workOrderNumber.replace("CW-", ""), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const woNumber = `CW-${String(nextNum).padStart(4, "0")}`;

    try {
      const job = await prisma.workOrder.create({
        data: {
          workOrderNumber: woNumber,
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
      });
      return NextResponse.json(toBoardJobDTO(job), { status: 201 });
    } catch (err) {
      const isCollision =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (isCollision && attempt < MAX_CREATE_RETRIES - 1) {
        continue; // another request claimed this number — re-read max and retry
      }
      console.error("Board job creation failed:", err);
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
}
