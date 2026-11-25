import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ClipboardList, Pencil, PenLine, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prisma, WorkOrderStatus } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { ProfitCell } from "@/components/portal/ProfitCell";
import { PageNumbersLink as PageNumbers, PaginationLink } from "@/components/portal/PageNumbers";
import { CLEAN_UP_CATEGORY_VALUES, JOB_CATEGORY_FILTER_OPTIONS } from "@/lib/job-categories";
import { MANAGER_VISIBLE_ROLES } from "@/lib/constants";
import LandscapeToolbar from "../landscape/LandscapeToolbar";

const PAGE_SIZE = 25;

export default async function AllJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const canSeeFinancialStatuses = (MANAGER_VISIBLE_ROLES as readonly string[]).includes(session.user.role);

  const params = await searchParams;

  const tab = params.tab === "closed" ? "closed" : "active";
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const year = typeof params.year === "string" ? params.year : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const closedStatuses: WorkOrderStatus[] = canSeeFinancialStatuses
    ? ["COMPLETED", "INVOICED", "PAID"]
    : ["COMPLETED"];
  const statusFilter: WorkOrderStatus[] = tab === "closed" ? closedStatuses : ["DRAFT", "IN_PROGRESS"];

  const where: Prisma.WorkOrderWhereInput = {
    status: { in: statusFilter },
  };

  if (search) {
    where.OR = [
      { workOrderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { jobType: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.jobCategory = category as Prisma.EnumJobCategoryFilter["equals"];
  }

  if (year) {
    const yearNum = parseInt(year, 10);
    if (!isNaN(yearNum)) {
      where.sourceYear = yearNum;
    }
  }

  const [totalCount, workOrders, yearResults, activeCount, closedCount] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      orderBy: [
        { projectStartDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: { customer: true, foreman: true, _count: { select: { crewWorkLogs: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.workOrder.findMany({
      where: { sourceYear: { not: null } },
      select: { sourceYear: true },
      distinct: ["sourceYear"],
      orderBy: { sourceYear: "desc" },
    }),
    prisma.workOrder.count({
      where: { status: { in: ["DRAFT", "IN_PROGRESS"] } },
    }),
    prisma.workOrder.count({
      where: { status: { in: closedStatuses } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const availableYears = yearResults
    .map((r) => r.sourceYear)
    .filter((y): y is number => y !== null);

  function tabUrl(nextTab: "active" | "closed"): string {
    const p = new URLSearchParams();
    if (nextTab !== "active") p.set("tab", nextTab);
    if (search) p.set("q", search);
    if (category) p.set("category", category);
    if (year) p.set("year", year);
    const qs = p.toString();
    return `/portal/jobs${qs ? `?${qs}` : ""}`;
  }

  function pageUrl(pageNum: number): string {
    const p = new URLSearchParams();
    if (tab !== "active") p.set("tab", tab);
    if (search) p.set("q", search);
    if (category) p.set("category", category);
    if (year) p.set("year", year);
    if (pageNum > 1) p.set("page", String(pageNum));
    const qs = p.toString();
    return `/portal/jobs${qs ? `?${qs}` : ""}`;
  }

  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount.toLocaleString()} {totalCount === 1 ? "job" : "jobs"}
            {(search || category || year) && " matching filters"}
          </p>
        </div>
        <Link href="/portal/jobs/new">
          <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Active / Closed tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <Link
          href={tabUrl("active")}
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
          href={tabUrl("closed")}
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

      {/* Search & Filters */}
      <LandscapeToolbar
        years={availableYears}
        currentSearch={search}
        currentCategory={category}
        currentYear={year}
        basePath="/portal/jobs"
        categoryOptions={JOB_CATEGORY_FILTER_OPTIONS}
      />

      {/* Table */}
      {workOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {search || category || year
              ? "No jobs match your filters"
              : tab === "closed"
                ? "No closed jobs"
                : "No active jobs"}
          </p>
          {search || category || year ? (
            <Link href={tabUrl(tab)}>
              <Button variant="outline" className="gap-2">
                Clear filters
              </Button>
            </Link>
          ) : tab === "active" ? (
            <Link href="/portal/jobs/new">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create your first job
              </Button>
            </Link>
          ) : null}
        </Card>
      ) : (
        <>
          <div className="border border-border rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary/60 text-center border-b border-border">
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      WO #
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Customer
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      Job Type
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      Foreman
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      Invoice
                    </th>
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden xl:table-cell">
                      Profit
                    </th>
                    {tab === "active" && (
                      <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        Log
                      </th>
                    )}
                    <th className="px-3 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo, i) => {
                    const profitNum = wo.profit !== null ? Number(wo.profit) : null;
                    const profitPctNum = wo.profitPercent !== null ? Number(wo.profitPercent) : null;
                    const detailHref = `/portal/jobs/${wo.id}`;
                    const isCleanUp = (CLEAN_UP_CATEGORY_VALUES as readonly string[]).includes(wo.jobCategory);
                    const logHref = isCleanUp
                      ? `/portal/cleanups/log?wo=${wo.id}`
                      : `/portal/landscape/log?wo=${wo.id}`;

                    return (
                      <tr
                        key={wo.id}
                        className={cn(
                          "border-b border-border last:border-b-0 hover:bg-brand/5",
                          i % 2 === 1 && "bg-secondary/45"
                        )}
                      >
                        <td className="p-0">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center font-semibold text-brand">
                            {wo.workOrderNumber}
                          </Link>
                        </td>
                        <td className="p-0">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center max-w-48 truncate mx-auto text-foreground">
                            {wo.customer.name}
                          </Link>
                        </td>
                        <td className="p-0 hidden sm:table-cell">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center text-muted-foreground">
                            {wo.jobType}
                          </Link>
                        </td>
                        <td className="p-0 hidden md:table-cell">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center text-muted-foreground">
                            {wo.foreman?.name || "—"}
                          </Link>
                        </td>
                        <td className="p-0 hidden md:table-cell">
                          <Link href={detailHref} className="flex items-center justify-center px-3 py-1.5">
                            <StatusBadge status={wo.status} />
                          </Link>
                        </td>
                        <td className="p-0 hidden lg:table-cell">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center text-muted-foreground whitespace-nowrap">
                            {formatDate(wo.projectStartDate)}
                          </Link>
                        </td>
                        <td className="p-0 hidden lg:table-cell">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center tabular-nums whitespace-nowrap">
                            {formatCurrency(wo.invoiceAmount)}
                          </Link>
                        </td>
                        <td className="p-0 hidden xl:table-cell">
                          <Link href={detailHref} className="block px-3 py-1.5 text-center tabular-nums whitespace-nowrap">
                            <ProfitCell profit={profitNum} profitPct={profitPctNum} />
                          </Link>
                        </td>
                        {tab === "active" && (
                          <td className="p-0">
                            <Link
                              href={logHref}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5 transition-colors"
                            >
                              <PenLine className="w-3 h-3" />
                              Log
                              {wo._count.crewWorkLogs > 0 && (
                                <span className="text-[10px] text-muted-foreground">({wo._count.crewWorkLogs})</span>
                              )}
                            </Link>
                          </td>
                        )}
                        <td className="p-0">
                          <Link
                            href={`/portal/jobs/${wo.id}/edit`}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 text-sm">
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
        </>
      )}
    </div>
  );
}
