import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { CloudSnow, Sprout, Sun, Leaf, TrendingUp, ArrowRight } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";

// ── Helpers ────────────────────────────────────────────────────────────────

function n(v: Decimal | number | null | undefined) {
  return Number(v ?? 0);
}

function pct(num: number, denom: number) {
  if (!denom) return "—";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function seasonKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return m >= 10 ? `${y}–${String(y + 1).slice(2)}` : `${y - 1}–${String(y).slice(2)}`;
}

type TabKey = "snow" | "spring" | "summer" | "fall" | "annual";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "snow",   label: "Snow",   icon: CloudSnow },
  { key: "spring", label: "Spring", icon: Sprout },
  { key: "summer", label: "Summer", icon: Sun },
  { key: "fall",   label: "Fall",   icon: Leaf },
  { key: "annual", label: "Annual", icon: TrendingUp },
];

// Which months belong to each landscape season (0-indexed)
const SEASON_MONTHS: Record<string, number[]> = {
  spring: [2, 3, 4],       // Mar Apr May
  summer: [5, 6, 7],       // Jun Jul Aug
  fall:   [8, 9, 10],      // Sep Oct Nov
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
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Season-by-season breakdown</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-0">
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

      {/* Tab content */}
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

  type SeasonRow = {
    storms: number; sites: number;
    totalCost: number; labor: number; sub: number; fuel: number; direct: number; indirect: number;
  };
  const map = new Map<string, SeasonRow>();

  for (const s of storms) {
    const key = seasonKey(s.eventStart);
    const row = map.get(key) ?? { storms: 0, sites: 0, totalCost: 0, labor: 0, sub: 0, fuel: 0, direct: 0, indirect: 0 };
    row.storms++;
    row.sites += s._count.siteServices;
    row.totalCost += n(s.totalCost);
    row.labor += n(s.laborCost);
    row.sub += n(s.subCost);
    row.fuel += n(s.fuelCost);
    row.direct += n(s.directCost);
    row.indirect += n(s.indirectCost);
    map.set(key, row);
  }

  const seasons = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const grand = seasons.reduce(
    (acc, [, d]) => ({
      storms: acc.storms + d.storms, sites: acc.sites + d.sites,
      totalCost: acc.totalCost + d.totalCost, labor: acc.labor + d.labor,
      sub: acc.sub + d.sub, fuel: acc.fuel + d.fuel,
    }),
    { storms: 0, sites: 0, totalCost: 0, labor: 0, sub: 0, fuel: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Season cards */}
      {seasons.map(([key, data]) => (
        <div key={key} className="border border-border rounded-xl overflow-hidden">
          <div className="bg-secondary/50 px-4 py-2.5 flex items-center justify-between">
            <span className="font-display font-semibold text-sm text-foreground">{key} Season</span>
            <span className="text-xs text-muted-foreground">{data.storms} storms · {data.sites} site visits</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border">
            <StatCell label="Total Cost"  value={formatCurrency(data.totalCost)} highlight />
            <StatCell label="Labor"       value={formatCurrency(data.labor)} />
            <StatCell label="Subs"        value={formatCurrency(data.sub)} />
            <StatCell label="Fuel"        value={formatCurrency(data.fuel)} />
            <StatCell label="Direct"      value={formatCurrency(data.direct)} />
            <StatCell label="Indirect"    value={formatCurrency(data.indirect)} />
          </div>
        </div>
      ))}

      {/* Grand total */}
      {seasons.length > 1 && (
        <div className="border border-brand/30 rounded-xl overflow-hidden bg-brand/5">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="font-display font-semibold text-sm text-foreground">All Seasons</span>
            <span className="text-xs text-muted-foreground">{grand.storms} storms · {grand.sites} visits</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
            <StatCell label="Total Cost" value={formatCurrency(grand.totalCost)} highlight />
            <StatCell label="Labor"      value={formatCurrency(grand.labor)} />
            <StatCell label="Subs"       value={formatCurrency(grand.sub)} />
            <StatCell label="Fuel"       value={formatCurrency(grand.fuel)} />
          </div>
        </div>
      )}

      <Link
        href="/portal/snow"
        className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
      >
        View individual storms <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ── Landscape Season Report ────────────────────────────────────────────────

async function LandscapeReport({ season }: { season: "spring" | "summer" | "fall" }) {
  const months = SEASON_MONTHS[season];

  const jobs = await prisma.workOrder.findMany({
    where: { projectStartDate: { not: null } },
    select: {
      projectStartDate: true,
      invoiceAmount: true,
      profit: true,
      jobCategory: true,
      status: true,
      totalManHours: true,
    },
  });

  // Filter to this season's months and group by year
  type YearRow = {
    jobs: number; invoiced: number; profit: number; hours: number;
    categories: Record<string, number>;
  };
  const map = new Map<number, YearRow>();

  for (const j of jobs) {
    if (!j.projectStartDate) continue;
    const m = j.projectStartDate.getUTCMonth();
    if (!months.includes(m)) continue;
    const y = j.projectStartDate.getUTCFullYear();
    const row = map.get(y) ?? { jobs: 0, invoiced: 0, profit: 0, hours: 0, categories: {} };
    row.jobs++;
    row.invoiced += n(j.invoiceAmount);
    row.profit += n(j.profit);
    row.hours += n(j.totalManHours);
    row.categories[j.jobCategory] = (row.categories[j.jobCategory] ?? 0) + 1;
    map.set(y, row);
  }

  const years = [...map.entries()].sort((a, b) => b[0] - a[0]);

  const icons: Record<string, string> = {
    spring: "🌱", summer: "☀️", fall: "🍂",
  };
  const ranges: Record<string, string> = {
    spring: "Mar – May", summer: "Jun – Aug", fall: "Sep – Nov",
  };

  if (years.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">No {season} jobs found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {icons[season]} {season.charAt(0).toUpperCase() + season.slice(1)} ({ranges[season]}) — jobs with a start date in those months
      </p>

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
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden lg:table-cell">Man Hours</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Top Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {years.map(([year, data]) => {
                const topCat = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0];
                return (
                  <tr key={year} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{year}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{data.jobs}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(data.invoiced)}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                      {data.profit ? formatCurrency(data.profit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                      {data.profit && data.invoiced ? pct(data.profit, data.invoiced) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell text-muted-foreground">
                      {data.hours > 0 ? `${data.hours.toFixed(0)}h` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-sm">
                      {topCat ? `${topCat[0].replace(/_/g, " ")} (${topCat[1]})` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-secondary/50 border-t border-border font-semibold">
                <td className="px-4 py-3 text-foreground">Total</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {years.reduce((s, [, d]) => s + d.jobs, 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(years.reduce((s, [, d]) => s + d.invoiced, 0))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                  {formatCurrency(years.reduce((s, [, d]) => s + d.profit, 0))}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell" />
                <td className="px-4 py-3 hidden lg:table-cell" />
                <td className="px-4 py-3 hidden md:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Annual Report ──────────────────────────────────────────────────────────

async function AnnualReport() {
  const [jobs, storms] = await Promise.all([
    prisma.workOrder.findMany({
      where: { projectStartDate: { not: null } },
      select: { projectStartDate: true, invoiceAmount: true, profit: true, status: true },
    }),
    prisma.snowStorm.findMany({
      select: { eventStart: true, totalCost: true, laborCost: true },
    }),
  ]);

  type YearRow = {
    landscapeJobs: number; landscapeRevenue: number; landscapeProfit: number;
    snowStorms: number; snowRevenue: number;
  };
  const map = new Map<number, YearRow>();

  const blank = (): YearRow => ({
    landscapeJobs: 0, landscapeRevenue: 0, landscapeProfit: 0,
    snowStorms: 0, snowRevenue: 0,
  });

  for (const j of jobs) {
    if (!j.projectStartDate) continue;
    const y = j.projectStartDate.getUTCFullYear();
    const row = map.get(y) ?? blank();
    row.landscapeJobs++;
    row.landscapeRevenue += n(j.invoiceAmount);
    row.landscapeProfit += n(j.profit);
    map.set(y, row);
  }

  for (const s of storms) {
    // Snow revenue counts for the season start year
    const y = s.eventStart.getUTCFullYear();
    const m = s.eventStart.getUTCMonth();
    const year = m >= 10 ? y : y;  // snow is attributed to the calendar year of the storm
    const row = map.get(year) ?? blank();
    row.snowStorms++;
    row.snowRevenue += n(s.totalCost);
    map.set(year, row);
  }

  const years = [...map.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Year</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Landscape Jobs</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Landscape Rev</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Landscape Profit</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Snow Storms</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Snow Cost</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {years.map(([year, data]) => (
                <tr key={year} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{year}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{data.landscapeJobs}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{formatCurrency(data.landscapeRevenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                    {data.landscapeProfit ? formatCurrency(data.landscapeProfit) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell text-muted-foreground">{data.snowStorms}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{formatCurrency(data.snowRevenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(data.landscapeRevenue + data.snowRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-secondary/50 border-t border-border font-semibold">
                <td className="px-4 py-3 text-foreground">Total</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {years.reduce((s, [, d]) => s + d.landscapeJobs, 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                  {formatCurrency(years.reduce((s, [, d]) => s + d.landscapeRevenue, 0))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                  {formatCurrency(years.reduce((s, [, d]) => s + d.landscapeProfit, 0))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                  {years.reduce((s, [, d]) => s + d.snowStorms, 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                  {formatCurrency(years.reduce((s, [, d]) => s + d.snowRevenue, 0))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(years.reduce((s, [, d]) => s + d.landscapeRevenue + d.snowRevenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
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
