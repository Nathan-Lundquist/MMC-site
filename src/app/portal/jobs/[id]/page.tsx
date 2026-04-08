import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      foreman: true,
      timeEntries: { orderBy: { startTime: "asc" } },
      crewDetails: { include: { employee: true }, orderBy: { date: "asc" } },
      payments: { orderBy: { date: "asc" } },
      machines: true,
      debris: { orderBy: { date: "asc" } },
      weeding: { orderBy: { date: "asc" } },
      hourlyWork: { orderBy: { date: "asc" } },
      materials: true,
      outsourcedMaterials: true,
      additionalWork: {
        include: {
          crewDetails: { include: { employee: true } },
          materials: true,
        },
      },
    },
  });

  if (!wo) return notFound();

  const statusColors: Record<string, string> = {
    DRAFT: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-brand/10 text-brand",
    CANCELLED: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/portal/jobs">
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-xl font-bold text-foreground">
              {wo.workOrderNumber}
            </h1>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[wo.status] || statusColors.DRAFT}`}
            >
              {wo.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {wo.jobType} &mdash; {wo.customer.name}
          </p>
        </div>
        <Link href={`/portal/jobs/${wo.id}/edit`}>
          <Button className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Overview */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Customer</div>
            <div className="font-medium">{wo.customer.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Foreman</div>
            <div className="font-medium">{wo.foreman?.name || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Start Date</div>
            <div className="font-medium">
              {wo.projectStartDate
                ? new Date(wo.projectStartDate).toLocaleDateString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">End Date</div>
            <div className="font-medium">
              {wo.projectEndDate
                ? new Date(wo.projectEndDate).toLocaleDateString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">% Complete</div>
            <div className="font-medium">{Number(wo.percentCompleted)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Total Hours</div>
            <div className="font-medium">{Number(wo.totalManHours)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Job Type</div>
            <div className="font-medium">{wo.jobType}</div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {(wo.notes || wo.materialsNotUsed) && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Notes
          </h3>
          {wo.notes && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
              {wo.notes}
            </p>
          )}
          {wo.materialsNotUsed && (
            <div>
              <div className="text-xs text-muted-foreground font-medium mb-1">
                Materials/Services not used
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {wo.materialsNotUsed}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Crew Details */}
      {wo.crewDetails.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Crew Details ({wo.crewDetails.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Employee</th>
                  <th className="pb-2 pr-3 text-right">Job</th>
                  <th className="pb-2 pr-3 text-right">Setup</th>
                  <th className="pb-2 pr-3 text-right">Travel</th>
                  <th className="pb-2 pr-3 text-right">Unload</th>
                  <th className="pb-2 text-right">Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wo.crewDetails.map((cd) => (
                  <tr key={cd.id}>
                    <td className="py-2 pr-3">
                      {new Date(cd.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3">{cd.employee?.name || "—"}</td>
                    <td className="py-2 pr-3 text-right">{Number(cd.jobHours)}</td>
                    <td className="py-2 pr-3 text-right">{Number(cd.setupHours)}</td>
                    <td className="py-2 pr-3 text-right">{Number(cd.travelHours)}</td>
                    <td className="py-2 pr-3 text-right">{Number(cd.unloadHours)}</td>
                    <td className="py-2 text-right">{Number(cd.deliveryHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Time Entries */}
      {wo.timeEntries.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Time Log ({wo.timeEntries.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.timeEntries.map((te) => (
              <div key={te.id} className="flex gap-4">
                <span className="text-muted-foreground">
                  {new Date(te.startTime).toLocaleDateString()}
                </span>
                <span>
                  {new Date(te.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {te.endTime &&
                    ` – ${new Date(te.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payments */}
      {wo.payments.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Payments ({wo.payments.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.payments.map((p) => (
              <div key={p.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {new Date(p.date).toLocaleDateString()}
                  {p.checkNumber && ` — Check #${p.checkNumber}`}
                </span>
                <span className="font-medium">
                  ${Number(p.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Materials */}
      {wo.materials.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            MCC Materials ({wo.materials.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.materials.map((m) => (
              <div key={m.id} className="flex justify-between">
                <span>{m.material}</span>
                <span className="text-muted-foreground">
                  {Number(m.qty)} {m.units || ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Outsourced Materials */}
      {wo.outsourcedMaterials.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Outsourced Materials ({wo.outsourcedMaterials.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.outsourcedMaterials.map((m) => (
              <div key={m.id} className="flex justify-between">
                <span>
                  {m.material}
                  <span className="text-muted-foreground ml-1">
                    ({m.supplier})
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {Number(m.qty)} {m.unit || ""}
                  {m.cost && ` — $${Number(m.cost).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Machines */}
      {wo.machines.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Machines ({wo.machines.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.machines.map((m) => (
              <div key={m.id} className="flex justify-between">
                <span>{m.vehicleInfo}</span>
                <span className="text-muted-foreground">
                  {Number(m.hours)} hrs
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Debris */}
      {wo.debris.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Debris ({wo.debris.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.debris.map((d) => (
              <div key={d.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {new Date(d.date).toLocaleDateString()}
                </span>
                <span>
                  {Number(d.amountYards)} yds {d.type && `— ${d.type}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weeding */}
      {wo.weeding.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Weeding ({wo.weeding.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.weeding.map((w) => (
              <div key={w.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {new Date(w.date).toLocaleDateString()}
                </span>
                <span>
                  {w.numEmployees} emp × {Number(w.timeValue)}{" "}
                  {w.timeUnit.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hourly Work */}
      {wo.hourlyWork.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Hourly Work ({wo.hourlyWork.length})
          </h3>
          <div className="space-y-1 text-sm">
            {wo.hourlyWork.map((h) => (
              <div key={h.id} className="flex justify-between">
                <span>
                  {h.typeOfWork}{" "}
                  <span className="text-muted-foreground">
                    — {new Date(h.date).toLocaleDateString()}
                  </span>
                </span>
                <span>
                  {h.numEmployees} emp × {Number(h.timeValue)}{" "}
                  {h.timeUnit.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Additional Work */}
      {wo.additionalWork.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Additional Work ({wo.additionalWork.length})
          </h3>
          <div className="space-y-4">
            {wo.additionalWork.map((aw) => (
              <div key={aw.id} className="border-l-2 border-brand/20 pl-3">
                <div className="text-sm font-medium">
                  {aw.typeOfWork || "Additional Work"}
                  {aw.number && ` #${aw.number}`}
                  {aw.status && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({aw.status})
                    </span>
                  )}
                </div>
                {aw.date && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(aw.date).toLocaleDateString()}
                  </div>
                )}
                {aw.crewDetails.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Crew:{" "}
                    {aw.crewDetails
                      .map((c) => c.employee?.name || "Unknown")
                      .join(", ")}
                  </div>
                )}
                {aw.materials.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Materials:{" "}
                    {aw.materials.map((m) => m.material).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
