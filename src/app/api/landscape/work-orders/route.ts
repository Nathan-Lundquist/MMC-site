import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const quickCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  jobType: z.string().min(1, "Job type is required"),
  notes: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const raw = await req.json();
    const result = quickCreateSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Auto-generate WO number: CW-NNNN
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

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber: woNumber,
        customerId: data.customerId,
        jobType: data.jobType,
        notes: data.notes || null,
        status: "IN_PROGRESS",
        projectStartDate: new Date(),
      },
      include: {
        customer: { select: { name: true } },
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (err) {
    console.error("Quick work order creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}
