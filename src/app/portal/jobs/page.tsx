import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ClipboardList, Pencil } from "lucide-react";

export default async function WorkOrdersPage() {
  const workOrders = await prisma.workOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, foreman: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {workOrders.length} total
          </p>
        </div>
        <Link href="/portal/jobs/new">
          <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {workOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No jobs yet
          </p>
          <Link href="/portal/jobs/new">
            <Button
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create your first job
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  WO #
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Job Type
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Foreman
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/jobs/${wo.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {wo.workOrderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{wo.customer.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {wo.jobType}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {wo.foreman?.name || "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={wo.status} />
                      <Link href={`/portal/jobs/${wo.id}/edit`}>
                        <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {wo.projectStartDate
                      ? new Date(wo.projectStartDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {Number(wo.percentCompleted)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-brand/10 text-brand",
    CANCELLED: "bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
        colors[status] || colors.DRAFT
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
