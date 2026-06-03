import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { buildNestedCreateData, createAdditionalWork } from "@/lib/work-order-data";
import { workOrderBodySchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const raw = await req.json();
    const result = workOrderBodySchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request body" },
        { status: 400 }
      );
    }
    const body = result.data;

    const {
      customerId,
      jobType,
      foremanId,
      startDate,
      endDate,
      woNumber,
      pctComplete,
      totalHours,
      notes,
      materialsNotUsed,
    } = body;

    // Check for duplicate WO number
    const existing = await prisma.workOrder.findUnique({
      where: { workOrderNumber: woNumber },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Work order ${woNumber} already exists.` },
        { status: 409 }
      );
    }

    const workOrder = await prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          foremanId: foremanId || null,
          jobType: jobType || "Fall Clean Up",
          projectStartDate: startDate ? new Date(startDate) : null,
          projectEndDate: endDate ? new Date(endDate) : null,
          percentCompleted: pctComplete,
          totalManHours: totalHours,
          notes: notes || null,
          materialsNotUsed: materialsNotUsed || null,
          status: "DRAFT",
          ...buildNestedCreateData(body),
        },
      });

      await createAdditionalWork(tx, wo.id, body);
      return wo;
    });

    return NextResponse.json({ id: workOrder.id }, { status: 201 });
  } catch (err) {
    console.error("Work order creation failed:", err);
    console.error(err);
    return NextResponse.json({ error: "Failed to create work order" }, { status: 500 });
  }
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        foreman: { select: { name: true } },
        _count: {
          select: {
            crewDetails: true,
            timeEntries: true,
          },
        },
      },
    });

    return NextResponse.json(workOrders);
  } catch (err) {
    console.error("Work order list failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}
