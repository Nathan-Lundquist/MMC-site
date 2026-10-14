import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { createWorkOrderWithNumber } from "@/lib/work-order-number";
import { z } from "zod";
import { JobCategory } from "@prisma/client";

const quickCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  jobType: z.string().min(1, "Job type is required"),
  jobCategory: z.nativeEnum(JobCategory, { message: "Job category is required" }),
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

    const workOrder = await createWorkOrderWithNumber((workOrderNumber) =>
      prisma.workOrder.create({
        data: {
          workOrderNumber,
          customerId: data.customerId,
          jobType: data.jobType,
          jobCategory: data.jobCategory,
          notes: data.notes || null,
          status: "IN_PROGRESS",
          projectStartDate: new Date(),
        },
        include: {
          customer: { select: { name: true } },
        },
      })
    );

    return NextResponse.json(workOrder, { status: 201 });
  } catch (err) {
    console.error("Quick work order creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}
