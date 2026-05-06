import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Prisma } from "@prisma/client";

/* ─────────────────────────────────────────────────────────
   Types for raw query results
   ───────────────────────────────────────────────────────── */

interface SummaryRow {
  total_revenue: Prisma.Decimal | null;
  total_direct: Prisma.Decimal | null;
  total_indirect: Prisma.Decimal | null;
  total_profit: Prisma.Decimal | null;
  avg_profit_pct: Prisma.Decimal | null;
  total_owed: Prisma.Decimal | null;
  job_count: bigint;
}

interface CategoryRow {
  job_category: string;
  total_profit: Prisma.Decimal | null;
  total_revenue: Prisma.Decimal | null;
  job_count: bigint;
}

interface MonthlyRow {
  month: string;
  revenue: Prisma.Decimal | null;
  profit: Prisma.Decimal | null;
}

interface EstVsActualRow {
  avg_est_hours: Prisma.Decimal | null;
  avg_actual_hours: Prisma.Decimal | null;
  avg_est_crew_total: Prisma.Decimal | null;
  avg_actual_crew_total: Prisma.Decimal | null;
}

interface TopJobRow {
  wo_number: string;
  customer_name: string;
  job_type: string;
  job_category: string;
  invoice_amount: Prisma.Decimal | null;
  total_expense: Prisma.Decimal | null;
  profit: Prisma.Decimal | null;
  profit_pct: Prisma.Decimal | null;
}

interface UnpaidRow {
  wo_number: string;
  customer_name: string;
  job_type: string;
  invoice_amount: Prisma.Decimal | null;
  amount_paid: Prisma.Decimal | null;
  amount_owed: Prisma.Decimal | null;
  status: string;
}

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function fmt(v: Prisma.Decimal | number | null | undefined): string {
  const n = Number(v ?? 0);
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

function fmtPct(v: Prisma.Decimal | number | null | undefined): string {
  const n = Number(v ?? 0);
  return `${n.toFixed(1)}%`;
}

function profitColor(v: Prisma.Decimal | number | null | undefined): string {
  const n = Number(v ?? 0);
  if (n > 0) return "text-green-600";
  if (n < 0) return "text-red-600";
  return "text-muted-foreground";
}

function profitBg(v: Prisma.Decimal | number | null | undefined): string {
  const n = Number(v ?? 0);
  if (n > 0) return "bg-green-500";
  if (n < 0) return "bg-red-500";
  return "bg-muted";
}

function categoryLabel(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const YEARS = [
  "All Time",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
];

/* ─────────────────────────────────────────────────────────
   Page component
   ───────────────────────────────────────────────────────── */

export default async function CostingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const selectedYear = params.year || "All Time";
  const yearFilter =
    selectedYear !== "All Time" ? parseInt(selectedYear, 10) : null;

  // Build WHERE clause fragment
  const yearWhere = yearFilter
    ? Prisma.sql`AND source_year = ${yearFilter}`
    : Prisma.empty;

  const yearWhereStart = yearFilter
    ? Prisma.sql`WHERE source_year = ${yearFilter}`
    : Prisma.empty;

  // ── 1. Summary aggregation ───────────────────────────
  const [summary] = await prisma.$queryRaw<SummaryRow[]>`
    SELECT
      COALESCE(SUM(invoice_amount), 0)  AS total_revenue,
      COALESCE(SUM(total_direct_expense), 0)   AS total_direct,
      COALESCE(SUM(total_indirect_expense), 0) AS total_indirect,
      COALESCE(SUM(profit), 0)          AS total_profit,
      AVG(profit_pct) FILTER (WHERE profit_pct IS NOT NULL) AS avg_profit_pct,
      COALESCE(SUM(amount_owed) FILTER (WHERE amount_owed > 0), 0) AS total_owed,
      COUNT(*)::bigint AS job_count
    FROM work_orders
    WHERE status != 'CANCELLED'
    ${yearWhere}
  `;

  // ── 2. Profit by category ───────────────────────────
  const categoryData = await prisma.$queryRaw<CategoryRow[]>`
    SELECT
      job_category,
      COALESCE(SUM(profit), 0) AS total_profit,
      COALESCE(SUM(invoice_amount), 0) AS total_revenue,
      COUNT(*)::bigint AS job_count
    FROM work_orders
    WHERE status != 'CANCELLED'
    ${yearWhere}
    GROUP BY job_category
    ORDER BY total_profit DESC
  `;

  // ── 3. Monthly revenue & profit ──────────────────────
  const monthlyData = yearFilter
    ? await prisma.$queryRaw<MonthlyRow[]>`
        SELECT
          to_char(start_date, 'YYYY-MM') AS month,
          COALESCE(SUM(invoice_amount), 0) AS revenue,
          COALESCE(SUM(profit), 0) AS profit
        FROM work_orders
        WHERE start_date IS NOT NULL
          AND status != 'CANCELLED'
          AND source_year = ${yearFilter}
        GROUP BY month
        ORDER BY month ASC
      `
    : await prisma.$queryRaw<MonthlyRow[]>`
        SELECT
          to_char(start_date, 'YYYY-MM') AS month,
          COALESCE(SUM(invoice_amount), 0) AS revenue,
          COALESCE(SUM(profit), 0) AS profit
        FROM work_orders
        WHERE start_date IS NOT NULL
          AND status != 'CANCELLED'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 24
      `;

  // For "All Time" we fetched DESC and need to reverse; for year we already ASC
  const monthlyChart = yearFilter ? monthlyData : [...monthlyData].reverse();

  // ── 4. Estimates vs Actuals ──────────────────────────
  const [estVsActual] = await prisma.$queryRaw<EstVsActualRow[]>`
    SELECT
      AVG(est_hours) FILTER (WHERE est_hours IS NOT NULL AND est_hours > 0) AS avg_est_hours,
      AVG(actual_hours) FILTER (WHERE actual_hours IS NOT NULL AND actual_hours > 0) AS avg_actual_hours,
      AVG(est_crew_total) FILTER (WHERE est_crew_total IS NOT NULL AND est_crew_total > 0) AS avg_est_crew_total,
      AVG(crew_total) FILTER (WHERE crew_total IS NOT NULL AND crew_total > 0) AS avg_actual_crew_total
    FROM work_orders
    WHERE status != 'CANCELLED'
    ${yearWhere}
  `;

  // ── 5. Top 15 most profitable jobs ───────────────────
  const topJobs = await prisma.$queryRaw<TopJobRow[]>`
    SELECT
      w.wo_number,
      c.name AS customer_name,
      w.job_type,
      w.job_category,
      w.invoice_amount,
      COALESCE(w.total_direct_expense, 0) + COALESCE(w.total_indirect_expense, 0) AS total_expense,
      w.profit,
      w.profit_pct
    FROM work_orders w
    LEFT JOIN customers c ON c.id = w.customer_id
    WHERE w.profit IS NOT NULL
      AND w.status != 'CANCELLED'
      ${yearWhere}
    ORDER BY w.profit DESC
    LIMIT 15
  `;

  // ── 6. Bottom 15 least profitable jobs ───────────────
  const bottomJobs = await prisma.$queryRaw<TopJobRow[]>`
    SELECT
      w.wo_number,
      c.name AS customer_name,
      w.job_type,
      w.job_category,
      w.invoice_amount,
      COALESCE(w.total_direct_expense, 0) + COALESCE(w.total_indirect_expense, 0) AS total_expense,
      w.profit,
      w.profit_pct
    FROM work_orders w
    LEFT JOIN customers c ON c.id = w.customer_id
    WHERE w.profit IS NOT NULL
      AND w.status != 'CANCELLED'
      ${yearWhere}
    ORDER BY w.profit ASC
    LIMIT 15
  `;

  // ── 7. Unpaid invoices ───────────────────────────────
  const unpaidJobs = await prisma.$queryRaw<UnpaidRow[]>`
    SELECT
      w.wo_number,
      c.name AS customer_name,
      w.job_type,
      w.invoice_amount,
      w.amount_paid,
      w.amount_owed,
      w.status::text
    FROM work_orders w
    LEFT JOIN customers c ON c.id = w.customer_id
    WHERE w.amount_owed > 0
      AND w.status != 'CANCELLED'
      ${yearWhere}
    ORDER BY w.amount_owed DESC
    LIMIT 50
  `;

  // ── Derived values ───────────────────────────────────
  const totalRevenue = Number(summary.total_revenue ?? 0);
  const totalExpenses =
    Number(summary.total_direct ?? 0) + Number(summary.total_indirect ?? 0);
  const totalProfit = Number(summary.total_profit ?? 0);
  const avgProfitPct = Number(summary.avg_profit_pct ?? 0);
  const totalOwed = Number(summary.total_owed ?? 0);

  // Chart max values
  const maxMonthlyRevenue = Math.max(
    ...monthlyChart.map((m) => Number(m.revenue ?? 0)),
    1
  );

  const maxCategoryProfit = Math.max(
    ...categoryData.map((c) => Math.abs(Number(c.total_profit ?? 0))),
    1
  );

  // Est vs Actual calculations
  const avgEstHours = Number(estVsActual?.avg_est_hours ?? 0);
  const avgActualHours = Number(estVsActual?.avg_actual_hours ?? 0);
  const avgEstCrewTotal = Number(estVsActual?.avg_est_crew_total ?? 0);
  const avgActualCrewTotal = Number(estVsActual?.avg_actual_crew_total ?? 0);

  const hoursVariance =
    avgEstHours > 0
      ? ((avgActualHours - avgEstHours) / avgEstHours) * 100
      : 0;
  const costVariance =
    avgEstCrewTotal > 0
      ? ((avgActualCrewTotal - avgEstCrewTotal) / avgEstCrewTotal) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Job Costing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Financial analysis across {Number(summary.job_count).toLocaleString()}{" "}
          jobs
          {yearFilter ? ` in ${yearFilter}` : " (all time)"}
        </p>
      </div>

      {/* ── Year Selector ───────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {YEARS.map((year) => {
          const isActive = year === selectedYear;
          const href =
            year === "All Time"
              ? "/portal/costing"
              : `/portal/costing?year=${year}`;
          return (
            <Link
              key={year}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {year}
            </Link>
          );
        })}
      </div>

      {/* ── Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total Revenue" value={fmt(totalRevenue)} />
        <SummaryCard label="Total Expenses" value={fmt(totalExpenses)} />
        <SummaryCard
          label="Total Profit"
          value={fmt(totalProfit)}
          valueClass={profitColor(totalProfit)}
        />
        <SummaryCard
          label="Avg Profit %"
          value={fmtPct(avgProfitPct)}
          valueClass={profitColor(avgProfitPct)}
        />
        <SummaryCard
          label="Outstanding"
          value={fmt(totalOwed)}
          valueClass={totalOwed > 0 ? "text-amber-600" : undefined}
        />
      </div>

      {/* ── Profit by Category ──────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Profit by Category
        </h3>
        <div className="space-y-3">
          {categoryData.map((c) => {
            const profit = Number(c.total_profit ?? 0);
            const pct =
              (Math.abs(profit) / maxCategoryProfit) * 100;
            return (
              <div key={c.job_category} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-36 shrink-0 truncate">
                  {categoryLabel(c.job_category)}
                </span>
                <div className="flex-1 h-5 bg-secondary rounded overflow-hidden relative">
                  <div
                    className={`h-full rounded ${profitBg(profit)} opacity-80`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-medium tabular-nums w-24 text-right ${profitColor(profit)}`}
                >
                  {fmt(profit)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                  {Number(c.job_count).toLocaleString()} jobs
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Monthly Revenue & Profit ────────────────────── */}
      {monthlyChart.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Monthly Revenue &amp; Profit
            {yearFilter ? ` (${yearFilter})` : " (Last 24 Months)"}
          </h3>
          <div className="flex items-end gap-[3px] h-40">
            {monthlyChart.map((m) => {
              const rev = Number(m.revenue ?? 0);
              const prof = Number(m.profit ?? 0);
              const revPct = (rev / maxMonthlyRevenue) * 100;
              const profPct = prof > 0 ? (prof / maxMonthlyRevenue) * 100 : 0;
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium whitespace-nowrap">
                    {fmt(rev)}
                  </span>
                  <div className="w-full relative" style={{ height: "100%" }}>
                    <div className="absolute bottom-0 w-full flex flex-col items-stretch">
                      {/* Revenue bar (outline) */}
                      <div
                        className="w-full border-2 border-brand/40 bg-brand/10 rounded-sm"
                        style={{
                          height: `${Math.max(revPct * 1.2, 2)}px`,
                        }}
                        title={`${m.month}: Revenue ${fmt(rev)}`}
                      >
                        {/* Profit bar (filled, inside) */}
                        <div
                          className={`w-full rounded-sm ${prof >= 0 ? "bg-green-500/60" : "bg-red-500/60"}`}
                          style={{
                            height: `${Math.max(profPct * 1.2, 0)}px`,
                          }}
                          title={`${m.month}: Profit ${fmt(prof)}`}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-[7px] text-muted-foreground -rotate-45 origin-center whitespace-nowrap mt-1 hidden sm:block">
                    {m.month.slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm border-2 border-brand/40 bg-brand/10" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-green-500/60" />
              Profit
            </span>
          </div>
        </Card>
      )}

      {/* ── Estimates vs Actuals ─────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Estimates vs Actuals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ComparisonBlock
            label="Crew Hours"
            estimated={avgEstHours}
            actual={avgActualHours}
            variance={hoursVariance}
            unit="hrs"
          />
          <ComparisonBlock
            label="Crew Cost"
            estimated={avgEstCrewTotal}
            actual={avgActualCrewTotal}
            variance={costVariance}
            unit="$"
          />
        </div>
      </Card>

      {/* ── Top Profitable & Least Profitable ────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Top 15 Most Profitable Jobs
          </h3>
          <JobTable jobs={topJobs} />
        </Card>

        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            15 Least Profitable Jobs
          </h3>
          <JobTable jobs={bottomJobs} />
        </Card>
      </div>

      {/* ── Unpaid Invoices ──────────────────────────────── */}
      {unpaidJobs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Unpaid Invoices
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({unpaidJobs.length} outstanding)
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-3">WO #</th>
                  <th className="pb-2 pr-3">Customer</th>
                  <th className="pb-2 pr-3">Job Type</th>
                  <th className="pb-2 pr-3 text-right">Invoice</th>
                  <th className="pb-2 pr-3 text-right">Paid</th>
                  <th className="pb-2 pr-3 text-right">Owed</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unpaidJobs.map((j) => (
                  <tr key={j.wo_number}>
                    <td className="py-2 pr-3 font-medium text-brand">
                      {j.wo_number}
                    </td>
                    <td className="py-2 pr-3 truncate max-w-[160px]">
                      {j.customer_name || "---"}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground truncate max-w-[120px]">
                      {j.job_type}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {fmt(j.invoice_amount)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                      {fmt(j.amount_paid)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums font-medium text-amber-600">
                      {fmt(j.amount_owed)}
                    </td>
                    <td className="py-2 text-right">
                      <StatusBadge status={j.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────── */

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card className="p-4">
      <div
        className={`font-display text-2xl font-bold ${valueClass || "text-foreground"}`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

function ComparisonBlock({
  label,
  estimated,
  actual,
  variance,
  unit,
}: {
  label: string;
  estimated: number;
  actual: number;
  variance: number;
  unit: string;
}) {
  const isOver = variance > 0;
  const varianceColor = isOver ? "text-red-600" : "text-green-600";
  const varianceLabel = isOver ? "over" : "under";

  const formatVal = (v: number) => {
    if (unit === "$") return fmt(v);
    return v.toFixed(1);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Estimated Avg</div>
          <div className="text-lg font-display font-bold text-foreground tabular-nums">
            {formatVal(estimated)}
            {unit !== "$" && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Actual Avg</div>
          <div className="text-lg font-display font-bold text-foreground tabular-nums">
            {formatVal(actual)}
            {unit !== "$" && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>
      {(estimated > 0 || actual > 0) && (
        <div className={`text-sm font-medium ${varianceColor}`}>
          {Math.abs(variance).toFixed(1)}% {varianceLabel} estimate
        </div>
      )}
    </div>
  );
}

function JobTable({ jobs }: { jobs: TopJobRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="pb-2 pr-2">WO #</th>
            <th className="pb-2 pr-2">Customer</th>
            <th className="pb-2 pr-2">Type</th>
            <th className="pb-2 pr-2 text-right">Invoice</th>
            <th className="pb-2 pr-2 text-right">Expense</th>
            <th className="pb-2 pr-2 text-right">Profit</th>
            <th className="pb-2 text-right">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((j) => (
            <tr key={j.wo_number}>
              <td className="py-1.5 pr-2 font-medium text-brand whitespace-nowrap">
                {j.wo_number}
              </td>
              <td className="py-1.5 pr-2 truncate max-w-[120px]">
                {j.customer_name || "---"}
              </td>
              <td className="py-1.5 pr-2 text-muted-foreground truncate max-w-[100px]">
                {j.job_type}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {fmt(j.invoice_amount)}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                {fmt(j.total_expense)}
              </td>
              <td
                className={`py-1.5 pr-2 text-right tabular-nums font-medium ${profitColor(j.profit)}`}
              >
                {fmt(j.profit)}
              </td>
              <td
                className={`py-1.5 text-right tabular-nums ${profitColor(j.profit_pct)}`}
              >
                {j.profit_pct != null ? fmtPct(j.profit_pct) : "---"}
              </td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="py-6 text-center text-muted-foreground"
              >
                No job costing data available for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-brand/10 text-brand",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || colors.DRAFT}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
