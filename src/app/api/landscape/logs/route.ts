import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { crewWorkLogSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const raw = await req.json();
    const result = crewWorkLogSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify work order exists and is open
    const wo = await prisma.workOrder.findUnique({
      where: { id: data.workOrderId },
      select: { id: true, status: true },
    });

    if (!wo) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    if (!["DRAFT", "IN_PROGRESS"].includes(wo.status)) {
      return NextResponse.json(
        { error: "Work order is not open" },
        { status: 400 }
      );
    }

    // Filter materials to only those with quantity > 0
    const materialsToCreate = data.materials.filter((m) => m.quantity > 0);

    const log = await prisma.crewWorkLog.create({
      data: {
        workOrderId: data.workOrderId,
        workType: data.workType,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        crewMembers: data.crewMembers,
        notes: data.notes || null,
        materials: {
          create: materialsToCreate.map((m) => ({
            materialId: m.materialId,
            quantity: m.quantity,
          })),
        },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("Crew work log creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create work log" },
      { status: 500 }
    );
  }
}
