import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

function seasonKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = m >= 10 ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

function n(v: unknown): number { return Number(v ?? 0); }

function fmt(date: Date): string {
  return date.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
}

function dur(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const h = Math.floor(ms / 3600000);
  const min = Math.round((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

// GET /api/snow/export?season=2025-26
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  const season = req.nextUrl.searchParams.get("season");
  if (!season) return NextResponse.json({ error: "season required" }, { status: 400 });

  const startYear = parseInt(season.split("-")[0]);
  if (isNaN(startYear)) return NextResponse.json({ error: "invalid season" }, { status: 400 });

  const allStorms = await prisma.snowStorm.findMany({
    orderBy: { eventStart: "asc" },
    include: {
      siteServices: { orderBy: { startTime: "asc" } },
      _count: { select: { siteServices: true } },
    },
  });

  const storms = allStorms.filter((s) => {
    const y = s.eventStart.getUTCFullYear();
    const m = s.eventStart.getUTCMonth();
    return m >= 10 ? y === startYear : y === startYear + 1;
  });

  if (storms.length === 0) return NextResponse.json({ error: "No data for that season" }, { status: 404 });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Storm Summary ─────────────────────────────────────────────
  const s1Header = [
    "Storm / Description", "Date", "Duration", "Sites Serviced",
    "Man Hours on Site", "Labor Cost", "Sub Cost", "Fuel Cost",
    "Direct Cost", "Indirect Cost", "Total Cost",
  ];

  const s1Rows = storms.map((s) => [
    s.description,
    fmt(s.eventStart),
    `${fmt(s.eventStart)} – ${fmt(s.eventEnd)}`,
    s._count.siteServices,
    n(s.masterTimeOnSite),
    n(s.laborCost),
    n(s.subCost),
    n(s.fuelCost),
    n(s.directCost),
    n(s.indirectCost),
    n(s.totalCost),
  ]);

  const t = storms.reduce(
    (acc, s) => ({
      sites: acc.sites + s._count.siteServices,
      hours: acc.hours + n(s.masterTimeOnSite),
      labor: acc.labor + n(s.laborCost),
      sub: acc.sub + n(s.subCost),
      fuel: acc.fuel + n(s.fuelCost),
      direct: acc.direct + n(s.directCost),
      indirect: acc.indirect + n(s.indirectCost),
      total: acc.total + n(s.totalCost),
    }),
    { sites: 0, hours: 0, labor: 0, sub: 0, fuel: 0, direct: 0, indirect: 0, total: 0 }
  );

  s1Rows.push([
    `SEASON TOTAL (${storms.length} storms)`, "", "",
    t.sites, t.hours, t.labor, t.sub, t.fuel, t.direct, t.indirect, t.total,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([s1Header, ...s1Rows]);
  ws1["!cols"] = [
    { wch: 55 }, { wch: 14 }, { wch: 30 }, { wch: 8 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Storm Summary");

  // ── Sheet 2: Site Services Detail ──────────────────────────────────────
  const s2Header = [
    "Storm Date", "Storm", "Site Name", "Start Time", "End Time", "Duration",
    "Services Performed", "Worker / Sub",
    "Plows", "Salt Lots", "Shovels", "Salt Walks",
    "Bulk Salt (yds)", "Ice Melter (bags)", "Calcium (bags)",
    "Employee Cost", "Sub Cost", "Bulk Salt Cost", "Ice Melter Cost", "Calcium Cost", "Fuel Cost",
    "Total Direct", "Total Indirect", "Notes",
  ];

  const s2Rows: unknown[][] = [];
  for (const storm of storms) {
    for (const svc of storm.siteServices) {
      s2Rows.push([
        fmt(storm.eventStart), storm.description, svc.siteName,
        fmt(svc.startTime), fmt(svc.endTime), dur(svc.startTime, svc.endTime),
        svc.servicesPerformed, svc.workerName ?? "",
        svc.plowCount, svc.saltLotCount, svc.shovelCount, svc.saltWalkCount,
        n(svc.bulkSaltYards), n(svc.iceMelterBags), n(svc.calciumChlorideBags),
        n(svc.employeeCost), n(svc.subCost),
        n(svc.bulkSaltCost), n(svc.iceMelterCost), n(svc.calciumCost), n(svc.fuelCost),
        n(svc.totalDirect), n(svc.totalIndirect),
        svc.siteNotes ?? "",
      ]);
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet([s2Header, ...s2Rows]);
  ws2["!cols"] = [
    { wch: 12 }, { wch: 40 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
    { wch: 30 }, { wch: 22 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Site Services Detail");

  // ── Sheet 3: Cost by Site ──────────────────────────────────────────────
  type SiteTotals = {
    visits: number; labor: number; sub: number; fuel: number;
    bulkSalt: number; iceMelter: number; calcium: number; direct: number; indirect: number;
  };
  const siteMap = new Map<string, SiteTotals>();

  for (const storm of storms) {
    for (const svc of storm.siteServices) {
      const row = siteMap.get(svc.siteName) ?? {
        visits: 0, labor: 0, sub: 0, fuel: 0, bulkSalt: 0, iceMelter: 0, calcium: 0, direct: 0, indirect: 0,
      };
      row.visits++;
      row.labor += n(svc.employeeCost); row.sub += n(svc.subCost); row.fuel += n(svc.fuelCost);
      row.bulkSalt += n(svc.bulkSaltCost); row.iceMelter += n(svc.iceMelterCost); row.calcium += n(svc.calciumCost);
      row.direct += n(svc.totalDirect); row.indirect += n(svc.totalIndirect);
      siteMap.set(svc.siteName, row);
    }
  }

  const s3Header = [
    "Site Name", "Visits",
    "Labor Cost", "Sub Cost", "Fuel Cost", "Bulk Salt Cost", "Ice Melter Cost", "Calcium Cost",
    "Total Direct", "Total Indirect", "Grand Total",
  ];

  const s3Rows = [...siteMap.entries()]
    .sort((a, b) => b[1].direct - a[1].direct)
    .map(([name, d]) => [
      name, d.visits,
      d.labor, d.sub, d.fuel, d.bulkSalt, d.iceMelter, d.calcium,
      d.direct, d.indirect, d.direct + d.indirect,
    ]);

  const sg = [...siteMap.values()].reduce(
    (acc, d) => ({
      visits: acc.visits + d.visits, labor: acc.labor + d.labor, sub: acc.sub + d.sub,
      fuel: acc.fuel + d.fuel, bulkSalt: acc.bulkSalt + d.bulkSalt,
      iceMelter: acc.iceMelter + d.iceMelter, calcium: acc.calcium + d.calcium,
      direct: acc.direct + d.direct, indirect: acc.indirect + d.indirect,
    }),
    { visits: 0, labor: 0, sub: 0, fuel: 0, bulkSalt: 0, iceMelter: 0, calcium: 0, direct: 0, indirect: 0 }
  );

  s3Rows.push([
    "TOTAL", sg.visits, sg.labor, sg.sub, sg.fuel, sg.bulkSalt, sg.iceMelter, sg.calcium,
    sg.direct, sg.indirect, sg.direct + sg.indirect,
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet([s3Header, ...s3Rows]);
  ws3["!cols"] = [
    { wch: 30 }, { wch: 7 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Cost by Site");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `MCC-Snow-${season}-Season.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
