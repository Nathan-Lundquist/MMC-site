import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
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

    if (!customerId || !woNumber) {
      return NextResponse.json(
        { error: "Customer and Work Order Number are required." },
        { status: 400 }
      );
    }

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
      // Create the work order with all simple nested records
      const wo = await tx.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          foremanId: foremanId || null,
          jobType: jobType || "Fall Clean Up",
          projectStartDate: startDate ? new Date(startDate) : null,
          projectEndDate: endDate ? new Date(endDate) : null,
          percentCompleted: pctComplete ?? 0,
          totalManHours: totalHours ?? 0,
          notes: notes || null,
          materialsNotUsed: materialsNotUsed || null,
          status: "DRAFT",

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

      // Handle additional work — group crew by number and link to work entries
      if (additionalWork.length > 0) {
        // Group crew details by their number field
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

          // Combine MCC materials + outsourced into AdditionalWorkMaterial
          // Attach all materials to the first additional work entry
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
        // Create a catch-all AdditionalWork if there are materials/crew but no work entries
        await tx.additionalWork.create({
          data: {
            workOrderId: wo.id,
            crewDetails: {
              create: additionalCrewDetails
                .filter(
                  (c: { employeeId: string }) => c.employeeId
                )
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

    return NextResponse.json({ id: workOrder.id }, { status: 201 });
  } catch (err) {
    console.error("Work order creation failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create work order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
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
