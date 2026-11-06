import type { PrismaClient } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Next auto-generated work order number for the given year, formatted
 * `YYYY-0001`. Scoped per-year so the sequence resets annually; only
 * considers existing numbers already in that format (legacy imported
 * numbers like "25-32038" are a different shape and ignored).
 */
export async function generateNextWoNumber(tx: Tx, year: number): Promise<string> {
  const prefix = `${year}-`;
  const existing = await tx.workOrder.findMany({
    where: { workOrderNumber: { startsWith: prefix } },
    select: { workOrderNumber: true },
  });

  // Compare numerically (not lexicographically) so the sequence keeps
  // incrementing correctly past 9999 (where string sort would break).
  let max = 0;
  for (const { workOrderNumber } of existing) {
    const suffix = workOrderNumber.slice(prefix.length);
    if (/^\d+$/.test(suffix)) max = Math.max(max, parseInt(suffix, 10));
  }

  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/**
 * Upserts the catalog (shared with the landscape crew-log feature) with the
 * latest price entered for each named material on this job. Always
 * overwrites with the newest value per Nathan's note: "if the price
 * changes ... save that number to the item permanently."
 */
export async function syncMaterialCatalogPrices(
  tx: Tx,
  materials: Array<{ material?: string; units?: string; unitPrice?: string }>,
  outsourcedMaterials: Array<{ material?: string; unit?: string; perUnitCost?: string }>
) {
  for (const m of materials) {
    const name = m.material?.trim();
    const price = m.unitPrice ? parseFloat(m.unitPrice) : NaN;
    if (!name || isNaN(price)) continue;
    await tx.landscapeMaterial.upsert({
      where: { name },
      create: { name, unit: m.units || "", kind: "IN_HOUSE", defaultPrice: price },
      update: { defaultPrice: price },
    });
  }

  for (const m of outsourcedMaterials) {
    const name = m.material?.trim();
    const price = m.perUnitCost ? parseFloat(m.perUnitCost) : NaN;
    if (!name || isNaN(price)) continue;
    await tx.landscapeMaterial.upsert({
      where: { name },
      create: { name, unit: m.unit || "", kind: "OUTSOURCED", defaultPrice: price },
      update: { defaultPrice: price },
    });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RawBody {
  timeEntries?: any[];
  payments?: any[];
  machines?: any[];
  crewDetails?: any[];
  debris?: any[];
  weeding?: any[];
  hourlyWork?: any[];
  materials?: any[];
  outsourcedMaterials?: any[];
  additionalWork?: any[];
  additionalCrewDetails?: any[];
  additionalMaterials?: any[];
  additionalOutsourced?: any[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function buildNestedCreateData(body: RawBody) {
  const {
    timeEntries = [],
    payments = [],
    machines = [],
    crewDetails = [],
    debris = [],
    weeding = [],
    hourlyWork = [],
    materials = [],
    outsourcedMaterials = [],
  } = body;

  return {
    timeEntries: {
      create: timeEntries
        .filter((t: { startTime: string }) => t.startTime)
        .map((t: { startTime: string; endTime: string }) => ({
          startTime: new Date(t.startTime),
          endTime: t.endTime ? new Date(t.endTime) : null,
        })),
    },

    payments: {
      create: payments
        .filter((p: { amount: string }) => p.amount)
        .map((p: { date: string; checkNumber: string; amount: string }) => ({
          date: p.date ? new Date(p.date) : new Date(),
          checkNumber: p.checkNumber || null,
          amount: parseFloat(p.amount) || 0,
        })),
    },

    machines: {
      create: machines
        .filter((m: { vehicleInfo: string }) => m.vehicleInfo)
        .map((m: { vehicleInfo: string; hours: string }) => ({
          vehicleInfo: m.vehicleInfo,
          hours: parseFloat(m.hours) || 0,
        })),
    },

    crewDetails: {
      create: crewDetails
        .filter((c: { employeeId: string }) => c.employeeId)
        .map(
          (c: {
            date: string;
            employeeId: string;
            jobHours: string;
            setupHours: string;
            travelHours: string;
            unloadHours: string;
            deliveryHours: string;
          }) => ({
            date: c.date ? new Date(c.date) : new Date(),
            employeeId: c.employeeId || null,
            jobHours: parseFloat(c.jobHours) || 0,
            setupHours: parseFloat(c.setupHours) || 0,
            travelHours: parseFloat(c.travelHours) || 0,
            unloadHours: parseFloat(c.unloadHours) || 0,
            deliveryHours: parseFloat(c.deliveryHours) || 0,
          })
        ),
    },

    debris: {
      create: debris
        .filter(
          (d: { amountYards: string; type: string }) => d.amountYards || d.type
        )
        .map((d: { date: string; amountYards: string; type: string }) => ({
          date: d.date ? new Date(d.date) : new Date(),
          amountYards: parseFloat(d.amountYards) || 0,
          type: d.type || null,
        })),
    },

    weeding: {
      create: weeding
        .filter((w: { numEmployees: string }) => w.numEmployees)
        .map(
          (w: {
            date: string;
            numEmployees: string;
            timeValue: string;
            timeUnit: string;
          }) => ({
            date: w.date ? new Date(w.date) : new Date(),
            numEmployees: parseInt(w.numEmployees) || 0,
            timeValue: parseFloat(w.timeValue) || 0,
            timeUnit: w.timeUnit === "MINUTES" ? "MINUTES" as const : "HOURS" as const,
          })
        ),
    },

    hourlyWork: {
      create: hourlyWork
        .filter((h: { typeOfWork: string }) => h.typeOfWork)
        .map(
          (h: {
            date: string;
            typeOfWork: string;
            numEmployees: string;
            timeValue: string;
            timeUnit: string;
          }) => ({
            date: h.date ? new Date(h.date) : new Date(),
            typeOfWork: h.typeOfWork,
            numEmployees: parseInt(h.numEmployees) || 0,
            timeValue: parseFloat(h.timeValue) || 0,
            timeUnit: h.timeUnit === "MINUTES" ? "MINUTES" as const : "HOURS" as const,
          })
        ),
    },

    materials: {
      create: materials
        .filter((m: { material: string }) => m.material)
        .map((m: { material: string; qty: string; units: string; unitPrice?: string }) => ({
          material: m.material,
          qty: parseFloat(m.qty) || 0,
          units: m.units || null,
          unitPrice: m.unitPrice ? parseFloat(m.unitPrice) : null,
        })),
    },

    outsourcedMaterials: {
      create: outsourcedMaterials
        .filter((m: { material: string }) => m.material)
        .map(
          (m: {
            supplier: string;
            material: string;
            qty: string;
            unit: string;
            cost: string;
            perUnitCost: string;
            taxIncluded: boolean;
          }) => ({
            supplier: m.supplier || "",
            material: m.material,
            qty: parseFloat(m.qty) || 0,
            unit: m.unit || null,
            cost: m.cost ? parseFloat(m.cost) : null,
            perUnitCost: m.perUnitCost ? parseFloat(m.perUnitCost) : null,
            taxIncluded: m.taxIncluded ?? false,
          })
        ),
    },
  };
}

function buildAdditionalMaterialsData(
  additionalMaterials: Array<{ material: string; qty: string; units: string }>,
  additionalOutsourced: Array<{
    supplier: string;
    material: string;
    qty: string;
    units: string;
    cost: string;
    perUnitCost: string;
  }>
) {
  return [
    ...additionalMaterials
      .filter((m) => m.material)
      .map((m) => ({
        material: m.material,
        qty: parseFloat(m.qty) || 0,
        units: m.units || null,
        isOutsourced: false,
      })),
    ...additionalOutsourced
      .filter((m) => m.material)
      .map((m) => ({
        material: m.material,
        qty: parseFloat(m.qty) || 0,
        units: m.units || null,
        isOutsourced: true,
        supplier: m.supplier || null,
        cost: m.cost ? parseFloat(m.cost) : null,
        perUnitCost: m.perUnitCost ? parseFloat(m.perUnitCost) : null,
      })),
  ];
}

export async function createAdditionalWork(
  tx: Tx,
  workOrderId: string,
  body: RawBody
) {
  const {
    additionalWork = [],
    additionalCrewDetails = [],
    additionalMaterials = [],
    additionalOutsourced = [],
  } = body;

  if (additionalWork.length > 0) {
    const crewByNumber = new Map<
      string,
      Array<{
        date: string;
        employeeId: string;
        jobHours: string;
        deliveryHours: string;
      }>
    >();
    for (const crew of additionalCrewDetails) {
      const key = crew.number || "0";
      if (!crewByNumber.has(key)) crewByNumber.set(key, []);
      crewByNumber.get(key)!.push(crew);
    }

    for (const aw of additionalWork) {
      const awKey = aw.number || "0";
      const matchedCrew = crewByNumber.get(awKey) || [];

      const matData =
        awKey === (additionalWork[0]?.number || "0")
          ? buildAdditionalMaterialsData(additionalMaterials, additionalOutsourced)
          : [];

      await tx.additionalWork.create({
        data: {
          workOrderId,
          number: aw.number ? parseInt(aw.number) : null,
          date: aw.date ? new Date(aw.date) : null,
          status: aw.status || null,
          typeOfWork: aw.typeOfWork || null,
          crewDetails: {
            create: matchedCrew
              .filter((c) => c.employeeId)
              .map((c) => ({
                number: c.date ? parseInt(awKey) : null,
                date: c.date ? new Date(c.date) : null,
                employeeId: c.employeeId || null,
                jobHours: parseFloat(c.jobHours) || 0,
                deliveryHours: parseFloat(c.deliveryHours) || 0,
              })),
          },
          materials: {
            create: matData,
          },
        },
      });
    }
  } else if (
    additionalMaterials.length > 0 ||
    additionalOutsourced.length > 0 ||
    additionalCrewDetails.length > 0
  ) {
    await tx.additionalWork.create({
      data: {
        workOrderId,
        crewDetails: {
          create: additionalCrewDetails
            .filter((c: { employeeId: string }) => c.employeeId)
            .map(
              (c: {
                number: string;
                date: string;
                employeeId: string;
                jobHours: string;
                deliveryHours: string;
              }) => ({
                number: c.number ? parseInt(c.number) : null,
                date: c.date ? new Date(c.date) : null,
                employeeId: c.employeeId || null,
                jobHours: parseFloat(c.jobHours) || 0,
                deliveryHours: parseFloat(c.deliveryHours) || 0,
              })
            ),
        },
        materials: {
          create: buildAdditionalMaterialsData(additionalMaterials, additionalOutsourced),
        },
      },
    });
  }
}
