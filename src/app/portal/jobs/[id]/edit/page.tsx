import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import {
  WorkOrderForm,
  WorkOrderInitialData,
} from "@/components/portal/work-order-form";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function fmtTime(d: Date): string {
  return d.toISOString().slice(11, 16);
}

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [wo, customers, employees] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: {
        timeEntries: { orderBy: { startTime: "asc" } },
        crewDetails: { orderBy: { date: "asc" } },
        payments: { orderBy: { date: "asc" } },
        machines: true,
        debris: { orderBy: { date: "asc" } },
        weeding: { orderBy: { date: "asc" } },
        hourlyWork: { orderBy: { date: "asc" } },
        materials: true,
        outsourcedMaterials: true,
        additionalWork: {
          include: { crewDetails: true, materials: true },
        },
      },
    }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!wo) return notFound();

  // Group crew details by date+hours to reconstruct multi-employee rows
  const crewGroupKey = (c: {
    date: Date;
    jobHours: unknown;
    setupHours: unknown;
    travelHours: unknown;
    unloadHours: unknown;
    deliveryHours: unknown;
  }) =>
    `${fmtDate(c.date)}|${c.jobHours}|${c.setupHours}|${c.travelHours}|${c.unloadHours}|${c.deliveryHours}`;

  const crewGroups = new Map<
    string,
    { date: string; employeeIds: string[]; jobHours: string; setupHours: string; travelHours: string; unloadHours: string; deliveryHours: string }
  >();
  for (const c of wo.crewDetails) {
    const key = crewGroupKey(c);
    if (!crewGroups.has(key)) {
      crewGroups.set(key, {
        date: fmtDate(c.date),
        employeeIds: [],
        jobHours: String(Number(c.jobHours)),
        setupHours: String(Number(c.setupHours)),
        travelHours: String(Number(c.travelHours)),
        unloadHours: String(Number(c.unloadHours)),
        deliveryHours: String(Number(c.deliveryHours)),
      });
    }
    if (c.employeeId) {
      crewGroups.get(key)!.employeeIds.push(c.employeeId);
    }
  }

  const initialData: WorkOrderInitialData = {
    id: wo.id,
    customerId: wo.customerId,
    jobType: wo.jobType,
    foremanId: wo.foremanId,
    woNumber: wo.workOrderNumber,
    pctComplete: String(Number(wo.percentCompleted)),
    totalHours: String(Number(wo.totalManHours)),
    notes: wo.notes || "",
    materialsNotUsed: wo.materialsNotUsed || "",

    timeRows: wo.timeEntries.map((t) => ({
      date: fmtDate(t.startTime),
      startTime: fmtTime(t.startTime),
      endTime: t.endTime ? fmtTime(t.endTime) : "",
    })),

    paymentRows: wo.payments.map((p) => ({
      date: fmtDate(p.date),
      checkNumber: p.checkNumber || "",
      amount: String(Number(p.amount)),
    })),

    machineRows: wo.machines.map((m) => ({
      vehicleInfo: m.vehicleInfo,
      hours: String(Number(m.hours)),
    })),

    crewRows: Array.from(crewGroups.values()),

    debrisRows: wo.debris.map((d) => ({
      date: fmtDate(d.date),
      amountYards: String(Number(d.amountYards)),
      type: d.type || "",
    })),

    weedingRows: wo.weeding.map((w) => ({
      date: fmtDate(w.date),
      numEmployees: String(w.numEmployees),
      timeValue: String(Number(w.timeValue)),
      timeUnit: w.timeUnit as "HOURS" | "MINUTES",
    })),

    hourlyRows: wo.hourlyWork.map((h) => ({
      date: fmtDate(h.date),
      typeOfWork: h.typeOfWork,
      numEmployees: String(h.numEmployees),
      timeValue: String(Number(h.timeValue)),
      timeUnit: h.timeUnit as "HOURS" | "MINUTES",
    })),

    materialRows: wo.materials.map((m) => ({
      material: m.material,
      qty: String(Number(m.qty)),
      units: m.units || "",
    })),

    outsourcedRows: wo.outsourcedMaterials.map((m) => ({
      supplier: m.supplier,
      material: m.material,
      qty: String(Number(m.qty)),
      unit: m.unit || "",
      cost: m.cost ? String(Number(m.cost)) : "",
      perUnitCost: m.perUnitCost ? String(Number(m.perUnitCost)) : "",
      taxIncluded: m.taxIncluded,
    })),

    addlWorkRows: wo.additionalWork.map((aw) => ({
      number: aw.number ? String(aw.number) : "",
      date: aw.date ? fmtDate(aw.date) : "",
      status: aw.status || "",
      typeOfWork: aw.typeOfWork || "",
    })),

    addlCrewRows: wo.additionalWork.flatMap((aw) =>
      aw.crewDetails.map((c) => ({
        number: c.number ? String(c.number) : "",
        date: c.date ? fmtDate(c.date) : "",
        employeeId: c.employeeId || "",
        jobHours: String(Number(c.jobHours)),
        deliveryHours: String(Number(c.deliveryHours)),
      }))
    ),

    addlMaterialRows: wo.additionalWork.flatMap((aw) =>
      aw.materials
        .filter((m) => !m.isOutsourced)
        .map((m) => ({
          material: m.material,
          qty: String(Number(m.qty)),
          units: m.units || "",
        }))
    ),

    addlOutsourcedRows: wo.additionalWork.flatMap((aw) =>
      aw.materials
        .filter((m) => m.isOutsourced)
        .map((m) => ({
          supplier: m.supplier || "",
          material: m.material,
          qty: String(Number(m.qty)),
          units: m.units || "",
          cost: m.cost ? String(Number(m.cost)) : "",
          perUnitCost: m.perUnitCost ? String(Number(m.perUnitCost)) : "",
        }))
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Edit Job {wo.workOrderNumber}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {wo.jobType}
        </p>
      </div>
      <WorkOrderForm
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        initialData={initialData}
      />
    </div>
  );
}
