import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// POST /api/machines/inventory/[id]/service — log a service event
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { serviceDate, serviceType, notes, performedBy } = body;

  if (!serviceDate) {
    return NextResponse.json({ error: "Service date is required" }, { status: 400 });
  }

  // Compute total hours at time of service
  const machine = await prisma.machineInventory.findUnique({
    where: { id },
    include: { jobMachines: { select: { hours: true } } },
  });

  if (!machine) {
    return NextResponse.json({ error: "Machine not found" }, { status: 404 });
  }

  const totalHours = machine.jobMachines.reduce((sum, m) => sum + Number(m.hours), 0);
  const date = new Date(serviceDate);

  // Create service log and update machine record in a transaction
  const [log] = await prisma.$transaction([
    prisma.machineServiceLog.create({
      data: {
        machineInventoryId: id,
        serviceDate: date,
        hoursAtService: totalHours,
        serviceType: serviceType || null,
        notes: notes || null,
        performedBy: performedBy || null,
      },
    }),
    prisma.machineInventory.update({
      where: { id },
      data: {
        lastServiceDate: date,
        lastServiceHours: totalHours,
      },
    }),
  ]);

  return NextResponse.json(log, { status: 201 });
}
