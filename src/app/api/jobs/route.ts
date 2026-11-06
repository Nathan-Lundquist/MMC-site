import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  buildNestedCreateData,
  createAdditionalWork,
  generateNextWoNumber,
  syncMaterialCatalogPrices,
} from "@/lib/work-order-data";
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
      jobCategory,
      foremanId,
      startDate,
      endDate,
      estimateNumber,
      pctComplete,
      totalHours,
      notes,
      materialsNotUsed,
    } = body;

    const workOrder = await prisma.$transaction(async (tx) => {
      const woNumber = await generateNextWoNumber(tx, new Date().getFullYear());

      const wo = await tx.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          foremanId: foremanId || null,
          jobType: jobType || "Fall Clean Up",
          jobCategory,
          projectStartDate: startDate ? new Date(startDate) : null,
          projectEndDate: endDate ? new Date(endDate) : null,
          estimateNumber: estimateNumber || null,
          percentCompleted: pctComplete,
          totalManHours: totalHours,
          notes: notes || null,
          materialsNotUsed: materialsNotUsed || null,
          status: "DRAFT",
          ...buildNestedCreateData(body),
        },
      });

      await createAdditionalWork(tx, wo.id, body);
      await syncMaterialCatalogPrices(tx, body.materials, body.outsourcedMaterials);
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
