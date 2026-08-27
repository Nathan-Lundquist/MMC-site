import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { CloudSnow, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { auth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

// A storm in Nov/Dec belongs to that year's season start; Jan–Oct belongs to prev year
function seasonKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = m >= 10 ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

function dec(n: Decimal | null) {
  return Number(n ?? 0);
}

export default async function SnowStormsPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canCreate = role === "ADMIN" || role === "MANAGER";

  const storms = await prisma.snowStorm.findMany({
    orderBy: { eventStart: "desc" },
    include: {
      _count: { select: { siteServices: true } },
    },
  });

  // Build per-season totals
  type SeasonData = {
    storms: number;
    sites: number;
    totalCost: number;
    laborCost: number;
    subCost: number;
    fuelCost: number;
  };
  const seasons = new Map<string, SeasonData>();
  let grandTotal = 0, grandLabor = 0, grandSub = 0, grandFuel = 0, grandSites = 0;

  for (const s of storms) {
    const key = seasonKey(s.eventStart);
    const existing = seasons.get(key) ?? { storms: 0, sites: 0, totalCost: 0, laborCost: 0, subCost: 0, fuelCost: 0 };
    existing.storms += 1;
    existing.sites += s._count.siteServices;
    existing.totalCost += dec(s.totalCost);
    existing.laborCost += dec(s.laborCost);
    existing.subCost += dec(s.subCost);
    existing.fuelCost += dec(s.fuelCost);
    seasons.set(key, existing);
    grandTotal += dec(s.totalCost);
    grandLabor += dec(s.laborCost);
    grandSub += dec(s.subCost);
    grandFuel += dec(s.fuelCost);
    grandSites += s._count.siteServices;
  }

  // Sorted newest season first
  const seasonList = [...seasons.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Snow Storms
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {storms.length} {storms.length === 1 ? "storm" : "storms"} across {seasonList.length} {seasonList.length === 1 ? "season" : "seasons"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/portal/snow/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Storm
          </Link>
        )}
      </div>

      {storms.length === 0 ? (
        <Card className="p-12 text-center">
          <CloudSnow className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No snow storms recorded yet
          </p>
        </Card>
      ) : (
        <>
          {/* Season summary cards */}
          <div className="space-y-3">
            {seasonList.map(([key, data]) => (
              <div key={key} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/50 px-4 py-2.5 flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-foreground">
                    {key} Season
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.storms} storms · {data.sites} site visits
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
                  <StatCell label="Total Cost" value={formatCurrency(data.totalCost)} highlight />
                  <StatCell label="Labor" value={formatCurrency(data.laborCost)} />
                  <StatCell label="Sub" value={formatCurrency(data.subCost)} />
                  <StatCell label="Fuel" value={formatCurrency(data.fuelCost)} />
                </div>
              </div>
            ))}

            {/* All-time totals (only show if >1 season) */}
            {seasonList.length > 1 && (
              <div className="border border-brand/30 rounded-xl overflow-hidden bg-brand/5">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-foreground">
                    All Seasons Combined
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {storms.length} storms · {grandSites} site visits
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
                  <StatCell label="Total Cost" value={formatCurrency(grandTotal)} highlight />
                  <StatCell label="Labor" value={formatCurrency(grandLabor)} />
                  <StatCell label="Sub" value={formatCurrency(grandSub)} />
                  <StatCell label="Fuel" value={formatCurrency(grandFuel)} />
                </div>
              </div>
            )}
          </div>

          {/* Storm list table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      Storm
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      Sites
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell text-right">
                      Labor
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell text-right">
                      Sub
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell text-right">
                      Fuel
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {storms.map((storm) => (
                    <tr
                      key={storm.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          href={`/portal/snow/${storm.id}`}
                          className="font-medium text-brand hover:underline line-clamp-2"
                        >
                          {storm.description}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(storm.eventStart)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {storm._count.siteServices}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-right tabular-nums">
                        {formatCurrency(storm.laborCost)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-right tabular-nums">
                        {formatCurrency(storm.subCost)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-right tabular-nums">
                        {formatCurrency(storm.fuelCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatCurrency(storm.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary/50 border-t border-border font-semibold">
                    <td className="px-4 py-3 text-foreground" colSpan={2}>
                      Total
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {grandSites}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right tabular-nums">
                      {formatCurrency(grandLabor)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right tabular-nums">
                      {formatCurrency(grandSub)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right tabular-nums">
                      {formatCurrency(grandFuel)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
