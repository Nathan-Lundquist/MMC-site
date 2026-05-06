import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface BulkUpdateItem {
  id: string;
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  estCrewTotal?: number | null;
  crewTotal?: number | null;
  materialCost?: number | null;
  subCost?: number | null;
  dumpCost?: number | null;
  fuelCost?: number | null;
  totalIndirectExpense?: number | null;
  amountPaid?: number | null;
}

function toDecimal(v: number | null | undefined): Prisma.Decimal | null {
  if (v === null || v === undefined || isNaN(v)) return null;
  return new Prisma.Decimal(v);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body as { updates: BulkUpdateItem[] };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided." },
        { status: 400 }
      );
    }

    if (updates.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 updates per request." },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(async (tx) => {
      const updated: string[] = [];

      for (const item of updates) {
        if (!item.id) continue;

        // Calculate totalDirectExpense
        const crewTotal = item.crewTotal ?? 0;
        const materialCost = item.materialCost ?? 0;
        const subCost = item.subCost ?? 0;
        const dumpCost = item.dumpCost ?? 0;
        const fuelCost = item.fuelCost ?? 0;
        const totalDirectExpense = crewTotal + materialCost + subCost + dumpCost + fuelCost;

        // Calculate profit
        const invoiceAmount = item.invoiceAmount ?? 0;
        const totalIndirectExpense = item.totalIndirectExpense ?? 0;
        const totalExpense = totalDirectExpense + totalIndirectExpense;
        const profit = invoiceAmount - totalExpense;

        // Calculate profit percent
        const profitPercent = invoiceAmount > 0
          ? (profit / invoiceAmount) * 100
          : null;

        // Calculate amount owed
        const amountPaid = item.amountPaid ?? 0;
        const amountOwed = invoiceAmount - amountPaid;

        // Determine status based on costing data
        // If invoiceAmount is set and amountPaid >= invoiceAmount -> PAID
        // If invoiceAmount is set -> INVOICED
        // Otherwise leave status unchanged
        let statusUpdate: { status?: "INVOICED" | "PAID" } = {};
        if (invoiceAmount > 0) {
          if (amountPaid >= invoiceAmount) {
            statusUpdate = { status: "PAID" };
          } else {
            statusUpdate = { status: "INVOICED" };
          }
        }

        await tx.workOrder.update({
          where: { id: item.id },
          data: {
            invoiceNumber: item.invoiceNumber ?? null,
            invoiceAmount: toDecimal(item.invoiceAmount),
            estCrewTotal: toDecimal(item.estCrewTotal),
            crewTotal: toDecimal(item.crewTotal),
            materialCost: toDecimal(item.materialCost),
            subCost: toDecimal(item.subCost),
            dumpCost: toDecimal(item.dumpCost),
            fuelCost: toDecimal(item.fuelCost),
            totalDirectExpense: toDecimal(totalDirectExpense),
            totalIndirectExpense: toDecimal(item.totalIndirectExpense),
            profit: toDecimal(profit),
            profitPercent: profitPercent !== null ? toDecimal(profitPercent) : null,
            amountPaid: toDecimal(item.amountPaid),
            amountOwed: toDecimal(amountOwed),
            ...statusUpdate,
          },
        });

        updated.push(item.id);
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      updatedCount: results.length,
      updatedIds: results,
    });
  } catch (err) {
    console.error("Bulk costing update failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update work orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const uncostedOnly = searchParams.get("uncosted") !== "false"; // default true
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)));

    const where: Prisma.WorkOrderWhereInput = {
      status: { not: "CANCELLED" },
    };

    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        where.sourceYear = yearNum;
      }
    }

    if (category) {
      where.jobCategory = category as Prisma.EnumJobCategoryFilter["equals"];
    }

    if (status) {
      where.status = status as Prisma.EnumWorkOrderStatusFilter["equals"];
    }

    if (uncostedOnly) {
      where.invoiceAmount = null;
    }

    const [totalCount, workOrders, yearResults] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        orderBy: [
          { projectStartDate: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: {
          customer: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workOrder.findMany({
        where: { sourceYear: { not: null } },
        select: { sourceYear: true },
        distinct: ["sourceYear"],
        orderBy: { sourceYear: "desc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const availableYears = yearResults
      .map((r) => r.sourceYear)
      .filter((y): y is number => y !== null);

    return NextResponse.json({
      workOrders,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      availableYears,
    });
  } catch (err) {
    console.error("Bulk costing GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch work orders for bulk costing" },
      { status: 500 }
    );
  }
}
