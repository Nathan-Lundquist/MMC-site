import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/machines/inventory/[id] — update machine details
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { name, type, serialNumber, serviceIntervalHours, serviceIntervalDays, notes, active } = body;

  const machine = await prisma.machineInventory.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(serialNumber !== undefined && { serialNumber: serialNumber || null }),
      ...(serviceIntervalHours !== undefined && {
        serviceIntervalHours: serviceIntervalHours ? Number(serviceIntervalHours) : null,
      }),
      ...(serviceIntervalDays !== undefined && {
        serviceIntervalDays: serviceIntervalDays ? Number(serviceIntervalDays) : null,
      }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(machine);
}
