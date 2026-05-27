import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma, WorkOrderStatus } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";

function toDecimal(v: number | null | undefined): Prisma.Decimal | null {
  if (v === null || v === undefined || isNaN(v)) return null;
  return new Prisma.Decimal(v);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth(["ADMIN", "MANAGER"]);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await req.json();

    const existing = await prisma.workOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const {
      invoiceNumber,
      invoiceAmount,
      estCrewWage,
      estHours,
      estCrewTotal,
      crewWage,
      actualHours,
      crewTotal,
      materialCost,
      subCost,
      dumpCost,
      fuelCost,
      totalDirectExpense,
      totalIndirectExpense,
      profit,
      profitPercent,
      amountPaid,
      datePaid,
      amountOwed,
    } = body;

    // Auto-determine status based on financial data
    let status: WorkOrderStatus = existing.status;

    // If fully paid (amount owed <= 0 and invoice exists), mark as PAID
    if (
      invoiceAmount &&
      amountPaid &&
      parseFloat(amountPaid) >= parseFloat(invoiceAmount)
    ) {
      status = "PAID";
    }
    // If invoice amount is set but not fully paid, mark as INVOICED
    else if (invoiceAmount && parseFloat(invoiceAmount) > 0) {
      status = "INVOICED";
    }

    const parseNum = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      const n = parseFloat(String(v));
      return isNaN(n) ? null : n;
    };

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        invoiceNumber: invoiceNumber ?? null,
        invoiceAmount: toDecimal(parseNum(invoiceAmount)),
        estCrewWage: toDecimal(parseNum(estCrewWage)),
        estHours: toDecimal(parseNum(estHours)),
        estCrewTotal: toDecimal(parseNum(estCrewTotal)),
        crewWage: toDecimal(parseNum(crewWage)),
        actualHours: toDecimal(parseNum(actualHours)),
        crewTotal: toDecimal(parseNum(crewTotal)),
        materialCost: toDecimal(parseNum(materialCost)),
        subCost: toDecimal(parseNum(subCost)),
        dumpCost: toDecimal(parseNum(dumpCost)),
        fuelCost: toDecimal(parseNum(fuelCost)),
        totalDirectExpense: toDecimal(parseNum(totalDirectExpense)),
        totalIndirectExpense: toDecimal(parseNum(totalIndirectExpense)),
        profit: toDecimal(parseNum(profit)),
        profitPercent: toDecimal(parseNum(profitPercent)),
        amountPaid: toDecimal(parseNum(amountPaid)),
        datePaid: datePaid ? new Date(datePaid) : null,
        amountOwed: toDecimal(parseNum(amountOwed)),
        status,
      },
    });

    return NextResponse.json({ id: workOrder.id, status: workOrder.status });
  } catch (err) {
    console.error("Update costing failed:", err);
    console.error(err);
    return NextResponse.json({ error: "Failed to update costing data" }, { status: 500 });
  }
}
