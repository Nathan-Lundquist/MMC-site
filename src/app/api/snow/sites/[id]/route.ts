import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { snowSiteUpdateSchema } from "@/lib/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  try {
    const { id } = await params;
    const raw = await req.json();
    const result = snowSiteUpdateSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    // Check for duplicate name if name is being changed
    if (result.data.name) {
      const existing = await prisma.snowSite.findFirst({
        where: { name: result.data.name, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A site with that name already exists" },
          { status: 409 }
        );
      }
    }

    const site = await prisma.snowSite.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(site);
  } catch (err) {
    console.error("Snow site update failed:", err);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}
