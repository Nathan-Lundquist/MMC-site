import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  try {
    const body = await req.json();

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
      timeEntries = [],
      payments = [],
      machines = [],
      crewDetails = [],
      debris = [],
      weeding = [],
      hourlyWork = [],
      materials = [],
      outsourcedMaterials = [],
      additionalWork = [],
      additionalCrewDetails = [],
      additionalMaterials = [],
      additionalOutsourced = [],
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

    const pct = parseFloat(pctComplete) || 0;
    let status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" = "DRAFT";
    if (pct >= 100) status = "COMPLETED";
    else if (pct > 0) status = "IN_PROGRESS";

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
          totalManHours: parseFloat(totalHours) || 0,
          notes: notes || null,
          materialsNotUsed: materialsNotUsed || null,
          status,

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
              .map(
                (p: { date: string; checkNumber: string; amount: string }) => ({
                  date: p.date ? new Date(p.date) : new Date(),
                  checkNumber: p.checkNumber || null,
                  amount: parseFloat(p.amount) || 0,
                })
              ),
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
                (d: { amountYards: string; type: string }) =>
                  d.amountYards || d.type
              )
              .map(
                (d: { date: string; amountYards: string; type: string }) => ({
                  date: d.date ? new Date(d.date) : new Date(),
                  amountYards: parseFloat(d.amountYards) || 0,
                  type: d.type || null,
                })
              ),
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
                  timeUnit: w.timeUnit === "MINUTES" ? "MINUTES" : "HOURS",
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
                  timeUnit: h.timeUnit === "MINUTES" ? "MINUTES" : "HOURS",
                })
              ),
          },

          materials: {
            create: materials
              .filter((m: { material: string }) => m.material)
              .map((m: { material: string; qty: string; units: string }) => ({
                material: m.material,
                qty: parseFloat(m.qty) || 0,
                units: m.units || null,
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
        },
      });

      // Handle additional work
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
              ? [
                  ...additionalMaterials
                    .filter((m: { material: string }) => m.material)
                    .map(
                      (m: { material: string; qty: string; units: string }) => ({
                        material: m.material,
                        qty: parseFloat(m.qty) || 0,
                        units: m.units || null,
                        isOutsourced: false,
                      })
                    ),
                  ...additionalOutsourced
                    .filter((m: { material: string }) => m.material)
                    .map(
                      (m: {
                        supplier: string;
                        material: string;
                        qty: string;
                        units: string;
                        cost: string;
                        perUnitCost: string;
                      }) => ({
                        material: m.material,
                        qty: parseFloat(m.qty) || 0,
                        units: m.units || null,
                        isOutsourced: true,
                        supplier: m.supplier || null,
                        cost: m.cost ? parseFloat(m.cost) : null,
                        perUnitCost: m.perUnitCost
                          ? parseFloat(m.perUnitCost)
                          : null,
                      })
                    ),
                ]
              : [];

          await tx.additionalWork.create({
            data: {
              workOrderId: wo.id,
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
            workOrderId: wo.id,
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
              create: [
                ...additionalMaterials
                  .filter((m: { material: string }) => m.material)
                  .map(
                    (m: { material: string; qty: string; units: string }) => ({
                      material: m.material,
                      qty: parseFloat(m.qty) || 0,
                      units: m.units || null,
                      isOutsourced: false,
                    })
                  ),
                ...additionalOutsourced
                  .filter((m: { material: string }) => m.material)
                  .map(
                    (m: {
                      supplier: string;
                      material: string;
                      qty: string;
                      units: string;
                      cost: string;
                      perUnitCost: string;
                    }) => ({
                      material: m.material,
                      qty: parseFloat(m.qty) || 0,
                      units: m.units || null,
                      isOutsourced: true,
                      supplier: m.supplier || null,
                      cost: m.cost ? parseFloat(m.cost) : null,
                      perUnitCost: m.perUnitCost
                        ? parseFloat(m.perUnitCost)
                        : null,
                    })
                  ),
              ],
            },
          },
        });
      }

      return wo;
    });

    return NextResponse.json({ id: workOrder.id });
  } catch (err) {
    console.error("Update job failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
