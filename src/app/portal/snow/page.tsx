import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { CloudSnow, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { auth } from "@/lib/auth";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Snow Storms
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {storms.length} {storms.length === 1 ? "storm" : "storms"} recorded
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
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/snow/${storm.id}`}
                        className="font-medium text-brand hover:underline"
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
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
