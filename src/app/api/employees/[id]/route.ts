import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { employeeUpdateSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const raw = await req.json();
    const result = employeeUpdateSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { hourlyRate: result.data.hourlyRate },
    });

    return NextResponse.json({
      id: employee.id,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null,
    });
  } catch (err) {
    console.error("Employee update failed:", err);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
