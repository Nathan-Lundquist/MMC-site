import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { buildNestedCreateData, createAdditionalWork } from "@/lib/work-order-data";
import { workOrderBodySchema } from "@/lib/schemas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        foreman: true,
        timeEntries: { orderBy: { startTime: "asc" } },
        crewDetails: { include: { employee: true }, orderBy: { date: "asc" } },
        payments: { orderBy: { date: "asc" } },
        machines: true,
        debris: { orderBy: { date: "asc" } },
        weeding: { orderBy: { date: "asc" } },
        hourlyWork: { orderBy: { date: "asc" } },
        materials: true,
        outsourcedMaterials: true,
        additionalWork: {
          include: {
            crewDetails: { include: { employee: true } },
            materials: true,
          },
        },
      },
    });

    if (!wo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(wo);
  } catch (err) {
    console.error("GET job failed:", err);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
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

    const existing = await prisma.workOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If WO number changed, check for duplicates
    if (woNumber && woNumber !== existing.workOrderNumber) {
      const dup = await prisma.workOrder.findUnique({
        where: { workOrderNumber: woNumber },
      });
      if (dup) {
        return NextResponse.json(
          { error: `Work order ${woNumber} already exists.` },
          { status: 409 }
        );
      }
    }

    const pct = pctComplete;

    // Preserve INVOICED/PAID status set by costing — only auto-set for non-financial statuses
    const FINANCIAL_STATUSES: string[] = ["INVOICED", "PAID"];
    let status = existing.status;
    if (!FINANCIAL_STATUSES.includes(existing.status)) {
      if (pct >= 100) status = "COMPLETED" as typeof status;
      else if (pct > 0) status = "IN_PROGRESS" as typeof status;
      else status = "DRAFT" as typeof status;
    }

    const workOrder = await prisma.$transaction(async (tx) => {
      // Delete all child records — we'll re-create them from the form data
      await Promise.all([
        tx.timeEntry.deleteMany({ where: { workOrderId: id } }),
        tx.payment.deleteMany({ where: { workOrderId: id } }),
        tx.machine.deleteMany({ where: { workOrderId: id } }),
        tx.crewDetail.deleteMany({ where: { workOrderId: id } }),
        tx.debris.deleteMany({ where: { workOrderId: id } }),
        tx.weeding.deleteMany({ where: { workOrderId: id } }),
        tx.hourlyWork.deleteMany({ where: { workOrderId: id } }),
        tx.material.deleteMany({ where: { workOrderId: id } }),
        tx.outsourcedMaterial.deleteMany({ where: { workOrderId: id } }),
      ]);

      // Delete additional work (cascades crew + materials)
      await tx.additionalWork.deleteMany({ where: { workOrderId: id } });

      // Update work order + re-create all nested records
      const wo = await tx.workOrder.update({
        where: { id },
        data: {
          workOrderNumber: woNumber || existing.workOrderNumber,
          customerId,
          foremanId: foremanId || null,
          jobType: jobType || "General",
          projectStartDate: startDate ? new Date(startDate) : null,
          projectEndDate: endDate ? new Date(endDate) : null,
          percentCompleted: pct,
          totalManHours: totalHours,
          notes: notes || null,
          materialsNotUsed: materialsNotUsed || null,
          status,
          ...buildNestedCreateData(body),
        },
      });

      await createAdditionalWork(tx, wo.id, body);
      return wo;
    });

    return NextResponse.json({ id: workOrder.id });
  } catch (err) {
    console.error("Update job failed:", err);
    console.error(err);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
