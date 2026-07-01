import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { snowSiteSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const all = req.nextUrl.searchParams.get("all") === "true";
    const sites = await prisma.snowSite.findMany({
      where: all ? undefined : { active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(sites);
  } catch (err) {
    console.error("Snow sites list failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  try {
    const raw = await req.json();
    const result = snowSiteSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const existing = await prisma.snowSite.findUnique({
      where: { name: result.data.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A site with that name already exists" },
        { status: 409 }
      );
    }

    const site = await prisma.snowSite.create({
      data: { name: result.data.name },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (err) {
    console.error("Snow site creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
