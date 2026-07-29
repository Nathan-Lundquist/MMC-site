import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { landscapeMaterialSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const all = req.nextUrl.searchParams.get("all") === "true";
    const materials = await prisma.landscapeMaterial.findMany({
      where: all ? undefined : { active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(materials);
  } catch (err) {
    console.error("Landscape materials list failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  try {
    const raw = await req.json();
    const result = landscapeMaterialSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const existing = await prisma.landscapeMaterial.findUnique({
      where: { name: result.data.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A material with that name already exists" },
        { status: 409 }
      );
    }

    const material = await prisma.landscapeMaterial.create({
      data: {
        name: result.data.name,
        unit: result.data.unit || "",
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (err) {
    console.error("Landscape material creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}
