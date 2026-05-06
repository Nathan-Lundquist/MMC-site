import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { WorkOrderStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        invoiceNumber: invoiceNumber ?? null,
        invoiceAmount: invoiceAmount != null ? parseFloat(invoiceAmount) : null,
        estCrewWage: estCrewWage != null ? parseFloat(estCrewWage) : null,
        estHours: estHours != null ? parseFloat(estHours) : null,
        estCrewTotal: estCrewTotal != null ? parseFloat(estCrewTotal) : null,
        crewWage: crewWage != null ? parseFloat(crewWage) : null,
        actualHours: actualHours != null ? parseFloat(actualHours) : null,
        crewTotal: crewTotal != null ? parseFloat(crewTotal) : null,
        materialCost: materialCost != null ? parseFloat(materialCost) : null,
        subCost: subCost != null ? parseFloat(subCost) : null,
        dumpCost: dumpCost != null ? parseFloat(dumpCost) : null,
        fuelCost: fuelCost != null ? parseFloat(fuelCost) : null,
        totalDirectExpense:
          totalDirectExpense != null ? parseFloat(totalDirectExpense) : null,
        totalIndirectExpense:
          totalIndirectExpense != null
            ? parseFloat(totalIndirectExpense)
            : null,
        profit: profit != null ? parseFloat(profit) : null,
        profitPercent:
          profitPercent != null ? parseFloat(profitPercent) : null,
        amountPaid: amountPaid != null ? parseFloat(amountPaid) : null,
        datePaid: datePaid ? new Date(datePaid) : null,
        amountOwed: amountOwed != null ? parseFloat(amountOwed) : null,
        status,
      },
    });

    return NextResponse.json({ id: workOrder.id, status: workOrder.status });
  } catch (err) {
    console.error("Update costing failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update costing data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
