import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const storm = await prisma.snowStorm.findUnique({
      where: { id },
      include: {
        siteServices: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!storm) {
      return NextResponse.json({ error: "Storm not found" }, { status: 404 });
    }

    return NextResponse.json(storm);
  } catch (err) {
    console.error("Storm fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch storm" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.snowStorm.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Storm delete failed:", err);
    return NextResponse.json(
      { error: "Failed to delete storm" },
      { status: 500 }
    );
  }
}
