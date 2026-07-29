import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function StormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const storm = await prisma.snowStorm.findUnique({
    where: { id },
    include: {
      siteServices: {
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!storm) notFound();

  // Calculate duration for each site service
  function duration(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.round((ms % 3600000) / 60000);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/portal/snow">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            All Storms
          </Button>
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground">
          {storm.description}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatDate(storm.eventStart)} — {formatDate(storm.eventEnd)}
        </p>
      </div>

      {/* Storm summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Cost" value={formatCurrency(storm.totalCost)} />
        <SummaryCard label="Labor" value={formatCurrency(storm.laborCost)} />
        <SummaryCard label="Sub Cost" value={formatCurrency(storm.subCost)} />
        <SummaryCard label="Fuel" value={formatCurrency(storm.fuelCost)} />
        <SummaryCard label="Direct Cost" value={formatCurrency(storm.directCost)} />
        <SummaryCard label="Indirect Cost" value={formatCurrency(storm.indirectCost)} />
        <SummaryCard label="Time on Site" value={`${Number(storm.masterTimeOnSite)}h`} />
        <SummaryCard label="Sites Serviced" value={String(storm.siteServices.length)} />
      </div>

      {/* Site services */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Site Services
        </h2>

        {storm.siteServices.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No site services recorded for this storm
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {storm.siteServices.map((site) => (
              <Card key={site.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">
                      {site.siteName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration(site.startTime, site.endTime)}
                      </span>
                      {site.workerName && (
                        <span>Worker: {site.workerName}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {site.servicesPerformed}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium tabular-nums">
                      {formatCurrency(site.totalDirect)}
                    </div>
                    <div className="text-xs text-muted-foreground">direct</div>
                  </div>
                </div>

                {/* Service counts & materials */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                  {site.plowCount > 0 && <span>Plow: {site.plowCount}</span>}
                  {site.saltLotCount > 0 && <span>Salt Lot: {site.saltLotCount}</span>}
                  {site.shovelCount > 0 && <span>Shovel: {site.shovelCount}</span>}
                  {site.saltWalkCount > 0 && <span>Salt Walk: {site.saltWalkCount}</span>}
                  {Number(site.bulkSaltYards) > 0 && (
                    <span>Bulk Salt: {Number(site.bulkSaltYards)} yd</span>
                  )}
                  {Number(site.iceMelterBags) > 0 && (
                    <span>Ice Melter: {Number(site.iceMelterBags)} bags</span>
                  )}
                  {Number(site.calciumChlorideBags) > 0 && (
                    <span>Calcium: {Number(site.calciumChlorideBags)} bags</span>
                  )}
                </div>

                {site.siteNotes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {site.siteNotes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
        {value}
      </div>
    </Card>
  );
}
