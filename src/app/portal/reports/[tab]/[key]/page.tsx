import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft, Download } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";
import { PageNumbersLink } from "@/components/portal/PageNumbers";

const VISITS_PER_PAGE = 50;
const JOBS_PER_PAGE = 25;

// ── Helpers ────────────────────────────────────────────────────────────────

function n(v: Decimal | number | null | undefined) { return Number(v ?? 0); }

function pct(num: number, denom: number) {
  if (!denom) return "—";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function catLabel(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const SEASON_MONTHS: Record<string, { months: number[]; labels: string[] }> = {
  spring: { months: [2, 3, 4], labels: ["March", "April", "May"] },
  summer: { months: [5, 6, 7], labels: ["June", "July", "August"] },
  fall:   { months: [8, 9, 10], labels: ["September", "October", "November"] },
};

const SEASON_LABEL: Record<string, string> = {
  spring: "Spring", summer: "Summer", fall: "Fall",
};

const BAR_COLORS = [
  "bg-brand", "bg-blue-500", "bg-green-500", "bg-amber-500",
  "bg-purple-500", "bg-rose-500", "bg-teal-500", "bg-orange-400",
];

// ── Route ─────────────────────────────────────────────────────────────────

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string; key: string }>;
  searchParams: Promise<{ spage?: string; lpage?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tab, key } = await params;
  const { spage, lpage } = await searchParams;

  if (tab === "snow") return <SnowSeasonDetail season={key} spage={spage} />;
  if (["spring", "summer", "fall"].includes(tab)) {
    const year = parseInt(key);
    if (isNaN(year)) notFound();
    return <LandscapeDetail tab={tab} year={year} lpage={lpage} />;
  }
  notFound();
}

// ── Snow Season Detail ─────────────────────────────────────────────────────

async function SnowSeasonDetail({ season, spage }: { season: string; spage?: string }) {
  const startYear = parseInt(season.split("-")[0]);
  if (isNaN(startYear)) notFound();

  const seasonStart = new Date(Date.UTC(startYear, 10, 1));
  const seasonEnd   = new Date(Date.UTC(startYear + 2, 0, 1));
  const seasonWhere = { storm: { eventStart: { gte: seasonStart, lt: seasonEnd } } } as const;

  const page = Math.max(1, parseInt(spage ?? "1"));

  // All queries in parallel
  const [allStorms, siteGroups, visits, totalVisits] = await Promise.all([
    prisma.snowStorm.findMany({
      where: { eventStart: { gte: seasonStart, lt: seasonEnd } },
      orderBy: { eventStart: "asc" },
      include: { _count: { select: { siteServices: true } } },
    }),
    // Cost by site — DB-aggregated, no JS loop over thousands of rows
    prisma.snowSiteService.groupBy({
      by: ["siteName"],
      where: seasonWhere,
      _count: { id: true },
      _sum: {
        employeeCost: true, subCost: true, fuelCost: true,
        bulkSaltCost: true, iceMelterCost: true, calciumCost: true,
        totalDirect: true, totalIndirect: true,
      },
      orderBy: { _sum: { totalDirect: "desc" } },
    }),
    // Paginated site visits
    prisma.snowSiteService.findMany({
      where: seasonWhere,
      select: {
        siteName: true, startTime: true, servicesPerformed: true, workerName: true,
        employeeCost: true, subCost: true, fuelCost: true,
        totalDirect: true, totalIndirect: true,
        storm: { select: { eventStart: true } },
      },
      orderBy: [{ storm: { eventStart: "asc" } }, { startTime: "asc" }],
      skip: (page - 1) * VISITS_PER_PAGE,
      take: VISITS_PER_PAGE,
    }),
    prisma.snowSiteService.count({ where: seasonWhere }),
  ]);

  if (allStorms.length === 0) notFound();

  // Storm-level aggregates (small list — fine in JS)
  const totals = allStorms.reduce(
    (acc, s) => ({
      storms: acc.storms + 1,
      sites: acc.sites + s._count.siteServices,
      totalCost: acc.totalCost + n(s.totalCost),
      labor: acc.labor + n(s.laborCost),
      sub: acc.sub + n(s.subCost),
      fuel: acc.fuel + n(s.fuelCost),
      direct: acc.direct + n(s.directCost),
      indirect: acc.indirect + n(s.indirectCost),
    }),
    { storms: 0, sites: 0, totalCost: 0, labor: 0, sub: 0, fuel: 0, direct: 0, indirect: 0 }
  );

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const byMonth = new Map<string, { label: string; totalCost: number; storms: number }>();
  for (const s of allStorms) {
    const m = s.eventStart.getUTCMonth();
    const y = s.eventStart.getUTCFullYear();
    const k = `${y}-${String(m).padStart(2, "0")}`;
    const existing = byMonth.get(k) ?? { label: `${monthNames[m]} ${y}`, totalCost: 0, storms: 0 };
    existing.totalCost += n(s.totalCost); existing.storms++;
    byMonth.set(k, existing);
  }
  const monthData = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);
  const maxMonthCost = Math.max(...monthData.map((m) => m.totalCost));

  const costTypes = [
    { label: "Labor", value: totals.labor },
    { label: "Subcontractors", value: totals.sub },
    { label: "Fuel", value: totals.fuel },
    { label: "Other Indirect", value: totals.indirect - totals.sub - totals.fuel },
  ].filter((c) => c.value > 0);
  const maxCostType = Math.max(...costTypes.map((c) => c.value));

  // Cost-by-site from groupBy results
  const siteCosts = siteGroups.map((g) => ({
    name: g.siteName,
    visits: g._count.id,
    labor:    n(g._sum.employeeCost),
    sub:      n(g._sum.subCost),
    fuel:     n(g._sum.fuelCost),
    bulkSalt: n(g._sum.bulkSaltCost),
    iceMelter:n(g._sum.iceMelterCost),
    calcium:  n(g._sum.calciumCost),
    direct:   n(g._sum.totalDirect),
    indirect: n(g._sum.totalIndirect),
    total:    n(g._sum.totalDirect) + n(g._sum.totalIndirect),
  }));

  const siteGrand = siteCosts.reduce(
    (acc, s) => ({
      visits: acc.visits + s.visits, labor: acc.labor + s.labor,
      sub: acc.sub + s.sub, fuel: acc.fuel + s.fuel,
      bulkSalt: acc.bulkSalt + s.bulkSalt, iceMelter: acc.iceMelter + s.iceMelter,
      calcium: acc.calcium + s.calcium,
      direct: acc.direct + s.direct, indirect: acc.indirect + s.indirect,
      total: acc.total + s.total,
    }),
    { visits: 0, labor: 0, sub: 0, fuel: 0, bulkSalt: 0, iceMelter: 0, calcium: 0, direct: 0, indirect: 0, total: 0 }
  );

  const totalPages = Math.ceil(totalVisits / VISITS_PER_PAGE);
  const storms = allStorms;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <BackHeader href="/portal/reports?tab=snow" title={`${season} Snow Season`} />
        <a
          href={`/api/snow/export?season=${season}`}
          download
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors shrink-0 mt-5"
        >
          <Download className="w-4 h-4" />
          Download Spreadsheet
        </a>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Storms" value={String(totals.storms)} />
        <StatCard label="Site Visits" value={totals.sites.toLocaleString()} />
        <StatCard label="Total Cost" value={formatCurrency(totals.totalCost)} highlight />
        <StatCard label="Avg / Storm" value={formatCurrency(totals.totalCost / totals.storms)} />
        <StatCard label="Labor" value={formatCurrency(totals.labor)} />
        <StatCard label="Subs" value={formatCurrency(totals.sub)} />
        <StatCard label="Fuel" value={formatCurrency(totals.fuel)} />
        <StatCard label="Direct" value={formatCurrency(totals.direct)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Cost by Month */}
        <Section title="Cost by Month">
          <div className="space-y-3">
            {monthData.map((m, i) => (
              <HBar
                key={i}
                label={m.label}
                value={m.totalCost}
                barPct={(m.totalCost / maxMonthCost) * 100}
                sub={`${m.storms} storm${m.storms !== 1 ? "s" : ""}`}
                color="bg-brand"
              />
            ))}
          </div>
        </Section>

        {/* Cost Breakdown */}
        <Section title="Cost Breakdown">
          <div className="space-y-3">
            {costTypes.map((c, i) => (
              <HBar
                key={c.label}
                label={c.label}
                value={c.value}
                barPct={(c.value / maxCostType) * 100}
                sub={pct(c.value, totals.totalCost)}
                color={BAR_COLORS[i % BAR_COLORS.length]}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* Storm List */}
      <Section title="All Storms">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Storm</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden sm:table-cell">Sites</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Labor</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Sub</th>
                <th className="pb-2 font-medium text-muted-foreground text-right whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {storms.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 pr-3 max-w-[200px]">
                    <Link href={`/portal/snow/${s.id}`} className="text-brand hover:underline line-clamp-1 text-sm">
                      {s.description}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap text-sm">{formatDate(s.eventStart)}</td>
                  <td className="py-2.5 pr-3 text-right text-muted-foreground hidden sm:table-cell">{s._count.siteServices}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(s.laborCost)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(s.subCost)}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{formatCurrency(s.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Cost by Site — full season */}
      {siteCosts.length > 0 && (
        <Section title={`Cost by Site — ${siteCosts.length} sites`}>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-3 font-medium text-muted-foreground min-w-[160px]">Site</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap">Visits</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Labor</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Sub</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden lg:table-cell">Fuel</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden lg:table-cell">Materials</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden sm:table-cell">Direct</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {siteCosts.map((s) => (
                  <tr key={s.name} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-2 pr-3 font-medium text-foreground text-sm">{s.name}</td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">{s.visits}</td>
                    <td className="py-2 pr-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(s.labor)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(s.sub)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums hidden lg:table-cell">{formatCurrency(s.fuel)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums hidden lg:table-cell">{formatCurrency(s.bulkSalt + s.iceMelter + s.calcium)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums hidden sm:table-cell">{formatCurrency(s.direct)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold bg-secondary/30">
                  <td className="pt-2.5 pr-3 text-foreground">Total</td>
                  <td className="pt-2.5 pr-3 text-right text-muted-foreground">{siteGrand.visits}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(siteGrand.labor)}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(siteGrand.sub)}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums hidden lg:table-cell">{formatCurrency(siteGrand.fuel)}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums hidden lg:table-cell">{formatCurrency(siteGrand.bulkSalt + siteGrand.iceMelter + siteGrand.calcium)}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums hidden sm:table-cell">{formatCurrency(siteGrand.direct)}</td>
                  <td className="pt-2.5 text-right tabular-nums">{formatCurrency(siteGrand.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>
      )}

      {/* All Site Visits — paginated */}
      {totalVisits > 0 && (
        <Section title={`All Site Visits (${totalVisits.toLocaleString()})`}>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground min-w-[140px]">Site</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground hidden sm:table-cell">Services</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground hidden md:table-cell">Worker</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden lg:table-cell">Labor</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden lg:table-cell">Sub</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Direct</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visits.map((svc, i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-1.5 pr-3 text-muted-foreground whitespace-nowrap text-xs">
                      {svc.startTime.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}
                    </td>
                    <td className="py-1.5 pr-3 font-medium text-foreground text-xs">{svc.siteName}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground text-xs hidden sm:table-cell max-w-[200px] truncate">{svc.servicesPerformed}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground text-xs hidden md:table-cell">{svc.workerName ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-xs hidden lg:table-cell">{formatCurrency(svc.employeeCost)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-xs hidden lg:table-cell">{formatCurrency(svc.subCost)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-xs hidden md:table-cell">{formatCurrency(svc.totalDirect)}</td>
                    <td className="py-1.5 text-right tabular-nums text-xs font-medium">{formatCurrency(n(svc.totalDirect) + n(svc.totalIndirect))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                Showing {((page - 1) * VISITS_PER_PAGE) + 1}–{Math.min(page * VISITS_PER_PAGE, totalVisits)} of {totalVisits.toLocaleString()}
              </p>
              <PageNumbersLink
                currentPage={page}
                totalPages={totalPages}
                pageUrl={(p) => `/portal/reports/snow/${season}?spage=${p}`}
              />
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

// ── Landscape Season Detail ────────────────────────────────────────────────

async function LandscapeDetail({ tab, year, lpage }: { tab: string; year: number; lpage?: string }) {
  const { months, labels } = SEASON_MONTHS[tab];
  const seasonStart = new Date(Date.UTC(year, months[0], 1));
  const seasonEnd   = new Date(Date.UTC(year, months[months.length - 1] + 1, 1));
  const where = { projectStartDate: { gte: seasonStart, lt: seasonEnd } } as const;

  const page = Math.max(1, parseInt(lpage ?? "1"));

  // Per-month date ranges
  const [m0Range, m1Range, m2Range] = months.map((m) => ({
    gte: new Date(Date.UTC(year, m, 1)),
    lt:  new Date(Date.UTC(year, m + 1, 1)),
  }));

  const [aggregate, catGroups, custGroups, jobs, totalJobs, m0, m1, m2] = await Promise.all([
    prisma.workOrder.aggregate({
      where,
      _sum: { invoiceAmount: true, profit: true, totalManHours: true },
      _count: { id: true },
    }),
    prisma.workOrder.groupBy({
      by: ["jobCategory"],
      where,
      _count: { id: true },
      _sum: { invoiceAmount: true, profit: true },
      orderBy: { _sum: { invoiceAmount: "desc" } },
    }),
    prisma.workOrder.groupBy({
      by: ["customerId"],
      where,
      _count: { id: true },
      _sum: { invoiceAmount: true },
      orderBy: { _sum: { invoiceAmount: "desc" } },
      take: 10,
    }),
    prisma.workOrder.findMany({
      where,
      select: {
        workOrderNumber: true,
        jobType: true,
        jobCategory: true,
        projectStartDate: true,
        invoiceAmount: true,
        profit: true,
        customer: { select: { name: true } },
      },
      orderBy: { projectStartDate: "asc" },
      skip: (page - 1) * JOBS_PER_PAGE,
      take: JOBS_PER_PAGE,
    }),
    prisma.workOrder.count({ where }),
    prisma.workOrder.aggregate({ where: { projectStartDate: m0Range }, _sum: { invoiceAmount: true, profit: true }, _count: { id: true } }),
    prisma.workOrder.aggregate({ where: { projectStartDate: m1Range }, _sum: { invoiceAmount: true, profit: true }, _count: { id: true } }),
    prisma.workOrder.aggregate({ where: { projectStartDate: m2Range }, _sum: { invoiceAmount: true, profit: true }, _count: { id: true } }),
  ]);

  if (totalJobs === 0) notFound();

  // Resolve customer names for top 10
  const customerNames = await prisma.customer.findMany({
    where: { id: { in: custGroups.map((g) => g.customerId) } },
    select: { id: true, name: true },
  });
  const customerNameMap = new Map(customerNames.map((c) => [c.id, c.name]));

  const totals = {
    jobs: aggregate._count.id,
    revenue: n(aggregate._sum.invoiceAmount),
    profit: n(aggregate._sum.profit),
    hours: n(aggregate._sum.totalManHours),
  };

  const categories = catGroups.map((g) => ({
    cat: g.jobCategory as string,
    jobs: g._count.id,
    revenue: n(g._sum.invoiceAmount),
    profit: n(g._sum.profit),
  }));
  const maxCatRevenue = Math.max(...categories.map((c) => c.revenue), 0);

  const monthBreakdown = [m0, m1, m2].map((m, i) => ({
    label: labels[i],
    jobs: m._count.id,
    revenue: n(m._sum.invoiceAmount),
    profit: n(m._sum.profit),
  }));
  const maxMonthRevenue = Math.max(...monthBreakdown.map((m) => m.revenue), 0);

  const topCustomers = custGroups.map((g) => ({
    name: customerNameMap.get(g.customerId) ?? g.customerId,
    jobs: g._count.id,
    revenue: n(g._sum.invoiceAmount),
  }));

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);
  const seasonLabel = SEASON_LABEL[tab];

  return (
    <div className="space-y-6">
      <BackHeader href={`/portal/reports?tab=${tab}`} title={`${seasonLabel} ${year}`} />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Jobs" value={totals.jobs.toLocaleString()} />
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} highlight />
        <StatCard label="Profit" value={totals.profit ? formatCurrency(totals.profit) : "—"} />
        <StatCard label="Margin" value={totals.profit && totals.revenue ? pct(totals.profit, totals.revenue) : "—"} />
        <StatCard label="Man Hours" value={totals.hours > 0 ? `${totals.hours.toFixed(0)}h` : "—"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue by Category */}
        <Section title="Revenue by Category">
          <div className="space-y-3">
            {categories.map((c, i) => (
              <HBar
                key={c.cat}
                label={catLabel(c.cat)}
                value={c.revenue}
                barPct={maxCatRevenue ? (c.revenue / maxCatRevenue) * 100 : 0}
                sub={`${c.jobs} job${c.jobs !== 1 ? "s" : ""}`}
                color={BAR_COLORS[i % BAR_COLORS.length]}
              />
            ))}
          </div>
        </Section>

        {/* Month Breakdown */}
        <Section title="Month Breakdown">
          <div className="space-y-3">
            {monthBreakdown.map((m) => (
              <HBar
                key={m.label}
                label={m.label}
                value={m.revenue}
                barPct={maxMonthRevenue ? (m.revenue / maxMonthRevenue) * 100 : 0}
                sub={`${m.jobs} jobs`}
                color="bg-brand"
              />
            ))}
          </div>

          {/* Month table */}
          <div className="mt-4 border-t border-border pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-1.5 font-medium text-muted-foreground">Month</th>
                  <th className="pb-1.5 font-medium text-muted-foreground text-right">Jobs</th>
                  <th className="pb-1.5 font-medium text-muted-foreground text-right">Revenue</th>
                  <th className="pb-1.5 font-medium text-muted-foreground text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {monthBreakdown.map((m) => (
                  <tr key={m.label}>
                    <td className="py-1.5 text-foreground">{m.label}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{m.jobs}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatCurrency(m.revenue)}</td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                      {m.profit ? formatCurrency(m.profit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* Category table */}
      <Section title="Category Breakdown">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Category</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Jobs</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Revenue</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Profit</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Margin</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">% of Rev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {categories.map((c) => (
                <tr key={c.cat} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{catLabel(c.cat)}</td>
                  <td className="py-2.5 pr-3 text-right text-muted-foreground">{c.jobs}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{formatCurrency(c.revenue)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums hidden sm:table-cell">
                    {c.profit ? formatCurrency(c.profit) : "—"}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums hidden sm:table-cell">
                    {c.profit && c.revenue ? pct(c.profit, c.revenue) : "—"}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {pct(c.revenue, totals.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="pt-2.5 pr-3 text-foreground">Total</td>
                <td className="pt-2.5 pr-3 text-right text-muted-foreground">{totals.jobs}</td>
                <td className="pt-2.5 pr-3 text-right tabular-nums">{formatCurrency(totals.revenue)}</td>
                <td className="pt-2.5 pr-3 text-right tabular-nums hidden sm:table-cell">
                  {totals.profit ? formatCurrency(totals.profit) : "—"}
                </td>
                <td className="pt-2.5 pr-3 hidden sm:table-cell" />
                <td className="pt-2.5 text-right text-muted-foreground">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <Section title="Top Customers">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-3 font-medium text-muted-foreground">Customer</th>
                  <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Jobs</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {topCustomers.map((c) => (
                  <tr key={c.name} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{c.jobs}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatCurrency(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* All Jobs — paginated */}
      <Section title={`All Jobs (${totalJobs.toLocaleString()})`}>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Customer</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Profit</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {jobs.map((j, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-1.5 pr-3 text-muted-foreground whitespace-nowrap text-xs">
                    {j.projectStartDate
                      ? j.projectStartDate.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="py-1.5 pr-3 font-medium text-foreground text-xs">{j.customer.name}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground text-xs hidden sm:table-cell max-w-[160px] truncate">{j.jobType}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground text-xs hidden md:table-cell">{catLabel(j.jobCategory)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-xs hidden sm:table-cell">
                    {j.profit ? formatCurrency(j.profit) : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-xs font-medium">
                    {j.invoiceAmount ? formatCurrency(j.invoiceAmount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * JOBS_PER_PAGE) + 1}–{Math.min(page * JOBS_PER_PAGE, totalJobs)} of {totalJobs.toLocaleString()}
            </p>
            <PageNumbersLink
              currentPage={page}
              totalPages={totalPages}
              pageUrl={(p) => `/portal/reports/${tab}/${year}?lpage=${p}`}
            />
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────────────────

function BackHeader({ href, title }: { href: string; title: string }) {
  return (
    <div>
      <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="w-3.5 h-3.5" />
        Reports
      </Link>
      <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums mt-0.5 ${highlight ? "text-foreground" : "text-foreground/80"}`}>
        {value}
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 space-y-3">
      <h2 className="font-display font-semibold text-sm text-foreground">{title}</h2>
      {children}
    </Card>
  );
}

function HBar({
  label, value, barPct, sub, color,
}: {
  label: string; value: number; barPct: number; sub: string; color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <span className="text-sm tabular-nums shrink-0">{formatCurrency(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all`}
            style={{ width: `${Math.max(barPct, 2)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{sub}</span>
      </div>
    </div>
  );
}
