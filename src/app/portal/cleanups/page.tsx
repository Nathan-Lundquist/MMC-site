import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorkOrderStatus } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CleanUpsWorkOrderList } from "@/components/portal/landscape-form";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";
import { MANAGER_VISIBLE_ROLES } from "@/lib/constants";

export default async function CleanUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const canSeeFinancialStatuses = (MANAGER_VISIBLE_ROLES as readonly string[]).includes(session.user.role);

  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "closed" ? "closed" : "active";

  const closedStatuses: WorkOrderStatus[] = canSeeFinancialStatuses
    ? ["COMPLETED", "INVOICED", "PAID"]
    : ["COMPLETED"];
  const statusFilter: WorkOrderStatus[] = tab === "closed" ? closedStatuses : ["DRAFT", "IN_PROGRESS"];

  const [workOrders, customers, activeCount, closedCount] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        status: { in: statusFilter },
        jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        workOrderNumber: true,
        jobType: true,
        jobCategory: true,
        status: true,
        notes: true,
        projectStartDate: true,
        customer: { select: { name: true } },
        _count: { select: { crewWorkLogs: true } },
      },
    }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.workOrder.count({
      where: { jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] }, status: { in: ["DRAFT", "IN_PROGRESS"] } },
    }),
    prisma.workOrder.count({
      where: { jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] }, status: { in: closedStatuses } },
    }),
  ]);

  return (
    <div className="max-w-lg mx-auto pb-24 sm:pb-6">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">
        Clean Ups
      </h1>

      {/* Active / Closed tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-4">
        <Link
          href="/portal/cleanups"
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "active"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Active ({activeCount.toLocaleString()})
        </Link>
        <Link
          href="/portal/cleanups?tab=closed"
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "closed"
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Closed ({closedCount.toLocaleString()})
        </Link>
      </div>

      <CleanUpsWorkOrderList
        tab={tab}
        workOrders={workOrders.map((wo) => ({
          id: wo.id,
          workOrderNumber: wo.workOrderNumber,
          jobType: wo.jobType,
          status: wo.status,
          customerName: wo.customer.name,
          startDate: wo.projectStartDate?.toISOString() || null,
          logCount: wo._count.crewWorkLogs,
        }))}
        customers={customers}
      />
    </div>
  );
}
