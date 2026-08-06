import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// GET /api/machines/inventory — list all fleet machines with computed hours
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const machines = await prisma.machineInventory.findMany({
    where: { active: true },
    include: {
      jobMachines: { select: { hours: true } },
      serviceLogs: {
        orderBy: { serviceDate: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(machines);
}

// POST /api/machines/inventory — create a new fleet machine
export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  const body = await req.json();
  const { name, type, serialNumber, serviceIntervalHours, serviceIntervalDays, notes } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const machine = await prisma.machineInventory.create({
    data: {
      name,
      type,
      serialNumber: serialNumber || null,
      serviceIntervalHours: serviceIntervalHours ? Number(serviceIntervalHours) : null,
      serviceIntervalDays: serviceIntervalDays ? Number(serviceIntervalDays) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(machine, { status: 201 });
}
