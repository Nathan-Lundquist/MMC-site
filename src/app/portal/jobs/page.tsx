import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ClipboardList, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import JobsToolbar from "./JobsToolbar";

const PAGE_SIZE = 25;

function formatCurrency(value: Prisma.Decimal | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Parse filter parameters
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const status = typeof params.status === "string" ? params.status : "";
  const year = typeof params.year === "string" ? params.year : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  // Build Prisma where clause
  const where: Prisma.WorkOrderWhereInput = {};

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

  if (status) {
    where.status = status as Prisma.EnumWorkOrderStatusFilter["equals"];
  }

  if (year) {
    const yearNum = parseInt(year, 10);
    if (!isNaN(yearNum)) {
      where.sourceYear = yearNum;
    }
  }

  // Fetch data: count + paginated rows + distinct years (for filter dropdown)
  const [totalCount, workOrders, yearResults] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      orderBy: [
        { projectStartDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: { customer: true, foreman: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.workOrder.findMany({
      where: { sourceYear: { not: null } },
      select: { sourceYear: true },
      distinct: ["sourceYear"],
      orderBy: { sourceYear: "desc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const availableYears = yearResults
    .map((r) => r.sourceYear)
    .filter((y): y is number => y !== null);

  // Build pagination URL helper
  function pageUrl(pageNum: number): string {
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (category) p.set("category", category);
    if (status) p.set("status", status);
    if (year) p.set("year", year);
    if (pageNum > 1) p.set("page", String(pageNum));
    const qs = p.toString();
    return `/portal/jobs${qs ? `?${qs}` : ""}`;
  }

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount.toLocaleString()} {totalCount === 1 ? "job" : "jobs"}
            {(search || category || status || year) && " matching filters"}
          </p>
        </div>
        <Link href="/portal/jobs/new">
          <Button className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <JobsToolbar
        years={availableYears}
        currentSearch={search}
        currentCategory={category}
        currentStatus={status}
        currentYear={year}
      />

      {/* Table */}
      {workOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {search || category || status || year
              ? "No jobs match your filters"
              : "No jobs yet"}
          </p>
          {search || category || status || year ? (
            <Link href="/portal/jobs">
              <Button variant="outline" className="gap-2">
                Clear filters
              </Button>
            </Link>
          ) : (
            <Link href="/portal/jobs/new">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create your first job
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      WO #
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      Customer
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      Job Type
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      Foreman
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell text-right">
                      Invoice
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden xl:table-cell text-right">
                      Profit
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workOrders.map((wo) => {
                    const profitNum = wo.profit !== null ? Number(wo.profit) : null;
                    const profitPctNum = wo.profitPercent !== null ? Number(wo.profitPercent) : null;

                    return (
                      <tr
                        key={wo.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/portal/jobs/${wo.id}`}
                            className="font-medium text-brand hover:underline"
                          >
                            {wo.workOrderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 max-w-48 truncate">
                          {wo.customer.name}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {wo.jobType}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {wo.foreman?.name || "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <StatusBadge status={wo.status} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                          {formatDate(wo.projectStartDate)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(wo.invoiceAmount)}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-right tabular-nums whitespace-nowrap">
                          <ProfitCell profit={profitNum} profitPct={profitPctNum} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/portal/jobs/${wo.id}/edit`}>
                            <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
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
              {/* First page */}
              <PaginationLink
                href={pageUrl(1)}
                disabled={page <= 1}
                label="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </PaginationLink>

              {/* Previous */}
              <PaginationLink
                href={pageUrl(page - 1)}
                disabled={page <= 1}
                label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </PaginationLink>

              {/* Page numbers */}
              <PageNumbers currentPage={page} totalPages={totalPages} pageUrl={pageUrl} />

              {/* Next */}
              <PaginationLink
                href={pageUrl(page + 1)}
                disabled={page >= totalPages}
                label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </PaginationLink>

              {/* Last page */}
              <PaginationLink
                href={pageUrl(totalPages)}
                disabled={page >= totalPages}
                label="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </PaginationLink>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-brand/10 text-brand",
    PAID: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        colors[status] || colors.DRAFT
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ProfitCell({
  profit,
  profitPct,
}: {
  profit: number | null;
  profitPct: number | null;
}) {
  if (profit === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isPositive = profit >= 0;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";

  return (
    <span className={cn("font-medium", colorClass)}>
      {formatCurrency(profit)}
      {profitPct !== null && (
        <span className="text-xs ml-1 opacity-70">
          ({profitPct.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}

function PaginationLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/40 cursor-not-allowed"
        aria-label={label}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

function PageNumbers({
  currentPage,
  totalPages,
  pageUrl,
}: {
  currentPage: number;
  totalPages: number;
  pageUrl: (page: number) => string;
}) {
  // Show up to 5 page numbers centered around current page
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground text-xs"
          >
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={pageUrl(p)}
            className={cn(
              "inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-colors",
              p === currentPage
                ? "bg-brand text-brand-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {p}
          </Link>
        )
      )}
    </div>
  );
}
