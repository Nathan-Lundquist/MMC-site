import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { landscapeMaterialUpdateSchema } from "@/lib/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  try {
    const { id } = await params;
    const raw = await req.json();
    const result = landscapeMaterialUpdateSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const material = await prisma.landscapeMaterial.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(material);
  } catch (err) {
    console.error("Landscape material update failed:", err);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}
