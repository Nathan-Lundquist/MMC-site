import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorkOrderStatus } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CleanUpsWorkOrderList } from "@/components/portal/landscape-form";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";
import { MANAGER_VISIBLE_ROLES } from "@/lib/constants";
import { PageNumbersLink as PageNumbers, PaginationLink } from "@/components/portal/PageNumbers";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZE = 25;

export default async function CleanUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const canSeeFinancialStatuses = (MANAGER_VISIBLE_ROLES as readonly string[]).includes(session.user.role);

  const params = await searchParams;
  const tab = params.tab === "closed" ? "closed" : "active";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const closedStatuses: WorkOrderStatus[] = canSeeFinancialStatuses
    ? ["COMPLETED", "INVOICED", "PAID"]
    : ["COMPLETED"];
  const statusFilter: WorkOrderStatus[] = tab === "closed" ? closedStatuses : ["DRAFT", "IN_PROGRESS"];

  const where = {
    status: { in: statusFilter },
    jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] },
  };

  const [totalCount, workOrders, customers, activeCount, closedCount] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        workOrderNumber: true,
        jobType: true,
        jobCategory: true,
        status: true,
        notes: true,
        projectStartDate: true,
        invoiceAmount: true,
        profit: true,
        profitPercent: true,
        customer: { select: { name: true } },
        foreman: { select: { name: true } },
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  function pageUrl(pageNum: number): string {
    const p = new URLSearchParams();
    if (tab !== "active") p.set("tab", tab);
    if (pageNum > 1) p.set("page", String(pageNum));
    const qs = p.toString();
    return `/portal/cleanups${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-6xl pb-24 sm:pb-6">
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
          foremanName: wo.foreman?.name ?? null,
          startDate: wo.projectStartDate?.toISOString() || null,
          invoiceAmount: wo.invoiceAmount != null ? Number(wo.invoiceAmount) : null,
          profit: wo.profit != null ? Number(wo.profit) : null,
          profitPercent: wo.profitPercent != null ? Number(wo.profitPercent) : null,
        }))}
        customers={customers}
      />

      {workOrders.length > 0 && (
        <div className="flex items-center justify-between gap-4 text-sm mt-4">
          <p className="text-muted-foreground whitespace-nowrap">
            {startItem}–{endItem} of {totalCount.toLocaleString()}
          </p>

          <div className="flex items-center gap-1">
            <PaginationLink href={pageUrl(1)} disabled={page <= 1} label="First page">
              <ChevronsLeft className="w-4 h-4" />
            </PaginationLink>
            <PaginationLink href={pageUrl(page - 1)} disabled={page <= 1} label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </PaginationLink>
            <PageNumbers currentPage={page} totalPages={totalPages} pageUrl={pageUrl} />
            <PaginationLink href={pageUrl(page + 1)} disabled={page >= totalPages} label="Next page">
              <ChevronRight className="w-4 h-4" />
            </PaginationLink>
            <PaginationLink href={pageUrl(totalPages)} disabled={page >= totalPages} label="Last page">
              <ChevronsRight className="w-4 h-4" />
            </PaginationLink>
          </div>
        </div>
      )}
    </div>
  );
}
