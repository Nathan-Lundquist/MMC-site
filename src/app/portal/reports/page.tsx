import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { CloudSnow, Sprout, Sun, Leaf, TrendingUp, ArrowRight } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";

// ── Helpers ────────────────────────────────────────────────────────────────

function n(v: Decimal | number | null | undefined) { return Number(v ?? 0); }

function pct(num: number, denom: number) {
  if (!denom) return "—";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

// Uses regular hyphen so it's URL-safe: "2025-26"
function seasonKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = m >= 10 ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

type TabKey = "snow" | "spring" | "summer" | "fall" | "annual";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "snow",   label: "Snow",   icon: CloudSnow },
  { key: "spring", label: "Spring", icon: Sprout },
  { key: "summer", label: "Summer", icon: Sun },
  { key: "fall",   label: "Fall",   icon: Leaf },
  { key: "annual", label: "Annual", icon: TrendingUp },
];

const SEASON_MONTHS: Record<string, number[]> = {
  spring: [2, 3, 4],
  summer: [5, 6, 7],
  fall:   [8, 9, 10],
};

// ── Page ──────────────────────────────────────────────────────────────────

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tab = "snow" } = await searchParams;
  const activeTab = (TABS.find((t) => t.key === tab)?.key ?? "snow") as TabKey;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Click any row to see a full breakdown</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/portal/reports?tab=${key}`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
              activeTab === key
                ? "border-brand text-brand bg-brand/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "snow"   && <SnowReport />}
      {activeTab === "spring" && <LandscapeReport season="spring" />}
      {activeTab === "summer" && <LandscapeReport season="summer" />}
      {activeTab === "fall"   && <LandscapeReport season="fall" />}
      {activeTab === "annual" && <AnnualReport />}
    </div>
  );
}

// ── Snow Report ────────────────────────────────────────────────────────────

async function SnowReport() {
  const storms = await prisma.snowStorm.findMany({
    orderBy: { eventStart: "asc" },
    include: { _count: { select: { siteServices: true } } },
  });

  if (storms.length === 0) {
    return (
      <Card className="p-10 text-center">
        <CloudSnow className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No snow data yet</p>
      </Card>
    );
  }

  type SeasonRow = { storms: number; sites: number; totalCost: number; labor: number; sub: number; fuel: number };
  const map = new Map<string, SeasonRow>();

  for (const s of storms) {
    const key = seasonKey(s.eventStart);
    const row = map.get(key) ?? { storms: 0, sites: 0, totalCost: 0, labor: 0, sub: 0, fuel: 0 };
    row.storms++; row.sites += s._count.siteServices;
    row.totalCost += n(s.totalCost); row.labor += n(s.laborCost);
    row.sub += n(s.subCost); row.fuel += n(s.fuelCost);
    map.set(key, row);
  }

  const seasons = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const grand = seasons.reduce(
    (acc, [, d]) => ({ storms: acc.storms + d.storms, sites: acc.sites + d.sites, totalCost: acc.totalCost + d.totalCost, labor: acc.labor + d.labor, sub: acc.sub + d.sub, fuel: acc.fuel + d.fuel }),
    { storms: 0, sites: 0, totalCost: 0, labor: 0, sub: 0, fuel: 0 }
  );

  return (
    <div className="space-y-3">
      {seasons.map(([key, data]) => (
        <Link key={key} href={`/portal/reports/snow/${key}`} className="block group">
          <div className="border border-border rounded-xl overflow-hidden hover:border-brand/40 hover:shadow-sm transition-all">
            <div className="bg-secondary/50 px-4 py-2.5 flex items-center justify-between">
              <span className="font-display font-semibold text-sm text-foreground group-hover:text-brand transition-colors">
                {key} Season
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{data.storms} storms · {data.sites} site visits</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-brand transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
              <StatCell label="Total Cost"  value={formatCurrency(data.totalCost)} highlight />
              <StatCell label="Labor"       value={formatCurrency(data.labor)} />
              <StatCell label="Subs"        value={formatCurrency(data.sub)} />
              <StatCell label="Fuel"        value={formatCurrency(data.fuel)} />
            </div>
          </div>
        </Link>
      ))}

      {seasons.length > 1 && (
        <div className="border border-brand/30 rounded-xl overflow-hidden bg-brand/5">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="font-display font-semibold text-sm text-foreground">All Seasons</span>
            <span className="text-xs text-muted-foreground">{grand.storms} storms · {grand.sites} visits</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
            <StatCell label="Total Cost" value={formatCurrency(grand.totalCost)} highlight />
            <StatCell label="Labor"      value={formatCurrency(grand.labor)} />
            <StatCell label="Subs"       value={formatCurrency(grand.sub)} />
            <StatCell label="Fuel"       value={formatCurrency(grand.fuel)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Landscape Season Report ────────────────────────────────────────────────

async function LandscapeReport({ season }: { season: "spring" | "summer" | "fall" }) {
  const months = SEASON_MONTHS[season];
  const SEASON_LABEL: Record<string, string> = { spring: "Spring", summer: "Summer", fall: "Fall" };

  const jobs = await prisma.workOrder.findMany({
    where: { projectStartDate: { not: null } },
    select: { projectStartDate: true, invoiceAmount: true, profit: true },
  });

  type YearRow = { jobs: number; revenue: number; profit: number };
  const map = new Map<number, YearRow>();

  for (const j of jobs) {
    if (!j.projectStartDate) continue;
    const m = j.projectStartDate.getUTCMonth();
    if (!months.includes(m)) continue;
    const y = j.projectStartDate.getUTCFullYear();
    const row = map.get(y) ?? { jobs: 0, revenue: 0, profit: 0 };
    row.jobs++; row.revenue += n(j.invoiceAmount); row.profit += n(j.profit);
    map.set(y, row);
  }

  const years = [...map.entries()].sort((a, b) => b[0] - a[0]);

  if (years.length === 0) {
    return <Card className="p-10 text-center"><p className="text-sm text-muted-foreground">No {season} jobs found</p></Card>;
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Year</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Jobs</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Revenue</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Profit</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Margin</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {years.map(([year, data]) => (
              <tr
                key={year}
                className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                onClick={undefined}
              >
                <td className="px-4 py-3">
                  <Link href={`/portal/reports/${season}/${year}`} className="font-medium text-foreground group-hover:text-brand transition-colors block">
                    {SEASON_LABEL[season]} {year}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{data.jobs}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(data.revenue)}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{data.profit ? formatCurrency(data.profit) : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                  {data.profit && data.revenue ? pct(data.profit, data.revenue) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/portal/reports/${season}/${year}`}>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-secondary/50 border-t border-border font-semibold">
              <td className="px-4 py-3 text-foreground">Total</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{years.reduce((s, [, d]) => s + d.jobs, 0)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(years.reduce((s, [, d]) => s + d.revenue, 0))}</td>
              <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{formatCurrency(years.reduce((s, [, d]) => s + d.profit, 0))}</td>
              <td className="px-4 py-3 hidden sm:table-cell" />
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Annual Report ──────────────────────────────────────────────────────────

async function AnnualReport() {
  const [jobs, storms] = await Promise.all([
    prisma.workOrder.findMany({
      where: { projectStartDate: { not: null } },
      select: { projectStartDate: true, invoiceAmount: true, profit: true },
    }),
    prisma.snowStorm.findMany({ select: { eventStart: true, totalCost: true } }),
  ]);

  type YearRow = { landscapeJobs: number; landscapeRevenue: number; landscapeProfit: number; snowStorms: number; snowRevenue: number };
  const map = new Map<number, YearRow>();
  const blank = (): YearRow => ({ landscapeJobs: 0, landscapeRevenue: 0, landscapeProfit: 0, snowStorms: 0, snowRevenue: 0 });

  for (const j of jobs) {
    if (!j.projectStartDate) continue;
    const y = j.projectStartDate.getUTCFullYear();
    const row = map.get(y) ?? blank();
    row.landscapeJobs++; row.landscapeRevenue += n(j.invoiceAmount); row.landscapeProfit += n(j.profit);
    map.set(y, row);
  }

  for (const s of storms) {
    const y = s.eventStart.getUTCFullYear();
    const row = map.get(y) ?? blank();
    row.snowStorms++; row.snowRevenue += n(s.totalCost);
    map.set(y, row);
  }

  const years = [...map.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Year</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Landscape Jobs</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Landscape Rev</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Profit</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Snow Storms</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden lg:table-cell">Snow Cost</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {years.map(([year, data]) => (
              <tr key={year} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{year}</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{data.landscapeJobs}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(data.landscapeRevenue)}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{data.landscapeProfit ? formatCurrency(data.landscapeProfit) : "—"}</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{data.snowStorms}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">{formatCurrency(data.snowRevenue)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(data.landscapeRevenue + data.snowRevenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-secondary/50 border-t border-border font-semibold">
              <td className="px-4 py-3 text-foreground">Total</td>
              <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{years.reduce((s, [, d]) => s + d.landscapeJobs, 0)}</td>
              <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(years.reduce((s, [, d]) => s + d.landscapeRevenue, 0))}</td>
              <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(years.reduce((s, [, d]) => s + d.landscapeProfit, 0))}</td>
              <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{years.reduce((s, [, d]) => s + d.snowStorms, 0)}</td>
              <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">{formatCurrency(years.reduce((s, [, d]) => s + d.snowRevenue, 0))}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(years.reduce((s, [, d]) => s + d.landscapeRevenue + d.snowRevenue, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold tabular-nums mt-0.5 ${highlight ? "text-foreground" : "text-foreground/80"}`}>
        {value}
      </div>
    </div>
  );
}
