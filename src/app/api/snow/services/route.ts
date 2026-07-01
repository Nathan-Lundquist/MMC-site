import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { snowSiteServiceSchema } from "@/lib/schemas";
import { computeSiteServiceCosts } from "@/lib/snow-cost";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const raw = await req.json();
    const result = snowSiteServiceSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Look up site name from siteId
    const site = await prisma.snowSite.findUnique({
      where: { id: data.siteId },
    });
    if (!site) {
      return NextResponse.json(
        { error: "Invalid site selected" },
        { status: 400 }
      );
    }

    // Get current rates for cost calculation
    let rates = await prisma.snowRate.findFirst();
    if (!rates) {
      rates = await prisma.snowRate.create({ data: {} });
    }

    // Calculate duration in hours
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));

    const crewSize = data.crewMembers.length;
    const workerName = data.crewMembers.join(", ");

    const costs = computeSiteServiceCosts(
      {
        bulkSaltYards: data.bulkSaltYards,
        iceMelterBags: data.iceMelterBags,
        calciumChlorideBags: data.calciumChlorideBags,
      },
      rates,
      durationHours,
      crewSize
    );

    const service = await prisma.snowSiteService.create({
      data: {
        siteName: site.name,
        startTime,
        endTime,
        servicesPerformed: data.servicesPerformed,
        plowCount: data.plowCount,
        saltLotCount: data.saltLotCount,
        shovelCount: data.shovelCount,
        saltWalkCount: data.saltWalkCount,
        bulkSaltYards: data.bulkSaltYards,
        iceMelterBags: data.iceMelterBags,
        calciumChlorideBags: data.calciumChlorideBags,
        workerName,
        addedUser: session.user?.name || null,
        additionalWorkRequested: data.additionalWorkRequested,
        additionalWorkDesc: data.additionalWorkDesc || null,
        siteNotes: data.siteNotes || null,
        ...costs,
      },
    });

    return NextResponse.json({ id: service.id }, { status: 201 });
  } catch (err) {
    console.error("Site service creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create site service" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const unlinked = req.nextUrl.searchParams.get("unlinked") === "true";

    const services = await prisma.snowSiteService.findMany({
      where: unlinked ? { stormId: null } : undefined,
      orderBy: { startTime: "desc" },
      take: 200,
    });

    return NextResponse.json(services);
  } catch (err) {
    console.error("Site services list failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
