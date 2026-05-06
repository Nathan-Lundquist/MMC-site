import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CostingForm, CostingWorkOrder } from "@/components/portal/CostingForm";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function CostingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      crewDetails: true,
    },
  });

  if (!wo) return notFound();

  // Calculate total man hours from crew details
  const totalManHoursFromCrew = wo.crewDetails.reduce((sum, cd) => {
    return (
      sum +
      Number(cd.jobHours) +
      Number(cd.setupHours) +
      Number(cd.travelHours) +
      Number(cd.unloadHours) +
      Number(cd.deliveryHours)
    );
  }, 0);

  const workOrder: CostingWorkOrder = {
    id: wo.id,
    workOrderNumber: wo.workOrderNumber,
    jobType: wo.jobType,
    status: wo.status,
    projectStartDate: wo.projectStartDate
      ? wo.projectStartDate.toISOString()
      : null,
    customerName: wo.customer.name,
    totalManHours:
      totalManHoursFromCrew > 0
        ? Math.round(totalManHoursFromCrew * 100) / 100
        : Number(wo.totalManHours),
    // Costing fields
    invoiceNumber: wo.invoiceNumber,
    invoiceAmount: wo.invoiceAmount ? Number(wo.invoiceAmount) : null,
    estCrewWage: wo.estCrewWage ? Number(wo.estCrewWage) : null,
    estHours: wo.estHours ? Number(wo.estHours) : null,
    estCrewTotal: wo.estCrewTotal ? Number(wo.estCrewTotal) : null,
    crewWage: wo.crewWage ? Number(wo.crewWage) : null,
    actualHours: wo.actualHours ? Number(wo.actualHours) : null,
    crewTotal: wo.crewTotal ? Number(wo.crewTotal) : null,
    materialCost: wo.materialCost ? Number(wo.materialCost) : null,
    subCost: wo.subCost ? Number(wo.subCost) : null,
    dumpCost: wo.dumpCost ? Number(wo.dumpCost) : null,
    fuelCost: wo.fuelCost ? Number(wo.fuelCost) : null,
    totalDirectExpense: wo.totalDirectExpense
      ? Number(wo.totalDirectExpense)
      : null,
    totalIndirectExpense: wo.totalIndirectExpense
      ? Number(wo.totalIndirectExpense)
      : null,
    profit: wo.profit ? Number(wo.profit) : null,
    profitPercent: wo.profitPercent ? Number(wo.profitPercent) : null,
    amountPaid: wo.amountPaid ? Number(wo.amountPaid) : null,
    datePaid: wo.datePaid ? fmtDate(wo.datePaid) : null,
    amountOwed: wo.amountOwed ? Number(wo.amountOwed) : null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Cost This Job &mdash; {wo.workOrderNumber}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add financial and costing data for {wo.customer.name}
        </p>
      </div>
      <CostingForm workOrder={workOrder} />
    </div>
  );
}
