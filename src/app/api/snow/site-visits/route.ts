import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/snow/site-visits?season=2025-26&site=SiteName
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER", "FOREMAN", "CREW"]);
  if (error) return error;

  const season = req.nextUrl.searchParams.get("season");
  const site = req.nextUrl.searchParams.get("site");
  if (!season || !site) {
    return NextResponse.json({ error: "season and site required" }, { status: 400 });
  }

  const startYear = parseInt(season.split("-")[0]);
  if (isNaN(startYear)) {
    return NextResponse.json({ error: "invalid season" }, { status: 400 });
  }

  const seasonStart = new Date(Date.UTC(startYear, 10, 1));
  const seasonEnd   = new Date(Date.UTC(startYear + 2, 0, 1));

  const visits = await prisma.snowSiteService.findMany({
    where: {
      siteName: site,
      storm: { eventStart: { gte: seasonStart, lt: seasonEnd } },
    },
    select: {
      startTime: true,
      endTime: true,
      servicesPerformed: true,
      workerName: true,
      plowCount: true,
      saltLotCount: true,
      shovelCount: true,
      saltWalkCount: true,
      bulkSaltYards: true,
      iceMelterBags: true,
      calciumChlorideBags: true,
      employeeCost: true,
      subCost: true,
      bulkSaltCost: true,
      iceMelterCost: true,
      calciumCost: true,
      fuelCost: true,
      totalDirect: true,
      totalIndirect: true,
      siteNotes: true,
      storm: { select: { eventStart: true, description: true } },
    },
    orderBy: [{ storm: { eventStart: "asc" } }, { startTime: "asc" }],
  });

  return NextResponse.json(visits);
}
