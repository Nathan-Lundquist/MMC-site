import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function BreakdownPage() {
  const [
    totalJobs,
    totalCustomers,
    totalEmployees,
    statusCounts,
    jobsByType,
    topCustomers,
    foremanStats,
    crewStats,
    topMaterials,
    topSuppliers,
    topMachines,
    paymentAgg,
    outsourcedAgg,
    subRecordCounts,
    monthlyJobs,
  ] = await Promise.all([
    prisma.workOrder.count(),
    prisma.customer.count(),
    prisma.employee.count({ where: { active: true } }),
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: true,
      orderBy: { _count: { status: "desc" } },
    }),
    prisma.workOrder.groupBy({
      by: ["jobType"],
      _count: true,
      orderBy: { _count: { jobType: "desc" } },
      take: 20,
    }),
    prisma.workOrder.groupBy({
      by: ["customerId"],
      _count: true,
      orderBy: { _count: { customerId: "desc" } },
      take: 10,
    }),
    prisma.workOrder.groupBy({
      by: ["foremanId"],
      _count: true,
      orderBy: { _count: { foremanId: "desc" } },
      where: { foremanId: { not: null } },
    }),
    prisma.crewDetail.groupBy({
      by: ["employeeId"],
      _count: true,
      _sum: { jobHours: true, setupHours: true, travelHours: true },
      orderBy: { _sum: { jobHours: "desc" } },
      where: { employeeId: { not: null } },
      take: 15,
    }),
    prisma.material.groupBy({
      by: ["material"],
      _count: true,
      _sum: { qty: true },
      orderBy: { _count: { material: "desc" } },
      take: 15,
    }),
    prisma.outsourcedMaterial.groupBy({
      by: ["supplier"],
      _count: true,
      _sum: { cost: true },
      orderBy: { _sum: { cost: "desc" } },
      take: 10,
    }),
    prisma.machine.groupBy({
      by: ["vehicleInfo"],
      _count: true,
      _sum: { hours: true },
      orderBy: { _sum: { hours: "desc" } },
      take: 10,
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.outsourcedMaterial.aggregate({
      _sum: { cost: true },
      _count: true,
    }),
    Promise.all([
      prisma.crewDetail.count(),
      prisma.timeEntry.count(),
      prisma.payment.count(),
      prisma.material.count(),
      prisma.outsourcedMaterial.count(),
      prisma.machine.count(),
      prisma.additionalWork.count(),
    ]),
    // Monthly jobs breakdown via raw query
    prisma.$queryRaw<
      { month: string; cnt: bigint }[]
    >`SELECT to_char("start_date", 'YYYY-MM') as month, count(*)::bigint as cnt
      FROM work_orders WHERE start_date IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 18`,
  ]);

  // Resolve foreman names
  const foremanIds = foremanStats
    .map((f) => f.foremanId)
    .filter(Boolean) as string[];
  const foremen = await prisma.employee.findMany({
    where: { id: { in: foremanIds } },
    select: { id: true, name: true },
  });
  const foremanMap = Object.fromEntries(foremen.map((f) => [f.id, f.name]));

  // Resolve customer names
  const customerIds = topCustomers.map((c) => c.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true },
  });
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));

  // Resolve crew employee names
  const crewEmpIds = crewStats
    .map((c) => c.employeeId)
    .filter(Boolean) as string[];
  const crewEmployees = await prisma.employee.findMany({
    where: { id: { in: crewEmpIds } },
    select: { id: true, name: true },
  });
  const empMap = Object.fromEntries(crewEmployees.map((e) => [e.id, e.name]));

  const [
    crewCount,
    timeCount,
    paymentCount,
    materialCount,
    outsourcedCount,
    machineCount,
    addlCount,
  ] = subRecordCounts;

  const totalPayments = Number(paymentAgg._sum.amount || 0);
  const totalOutsourcedCost = Number(outsourcedAgg._sum.cost || 0);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-brand/10 text-brand",
    CANCELLED: "bg-destructive/10 text-destructive",
  };

  // Monthly chart data (last 18 months, chronological)
  const monthlyData = [...monthlyJobs].reverse();
  const maxMonthly = Math.max(...monthlyData.map((m) => Number(m.cnt)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Landscape Breakdown
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stats across {totalJobs} jobs, {totalCustomers} customers, {totalEmployees} active employees
        </p>
      </div>

      {/* ── Top Stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={totalJobs} />
        <StatCard label="Customers" value={totalCustomers} />
        <StatCard
          label="Total Payments"
          value={`$${totalPayments.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        />
        <StatCard
          label="Outsourced Cost"
          value={`$${totalOutsourcedCost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        />
      </div>

      {/* ── Record Counts ──────────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Records Imported
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
          <MiniStat label="Crew Entries" value={crewCount} />
          <MiniStat label="Time Entries" value={timeCount} />
          <MiniStat label="Payments" value={paymentCount} />
          <MiniStat label="Materials" value={materialCount} />
          <MiniStat label="Outsourced" value={outsourcedCount} />
          <MiniStat label="Machines" value={machineCount} />
          <MiniStat label="Addl Work" value={addlCount} />
        </div>
      </Card>

      {/* ── Monthly Jobs Chart ─────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Jobs by Month
        </h3>
        <div className="flex items-end gap-[3px] h-32">
          {monthlyData.map((m) => {
            const pct = (Number(m.cnt) / maxMonthly) * 100;
            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {Number(m.cnt)}
                </span>
                <div
                  className="w-full bg-brand/70 hover:bg-brand transition-colors rounded-sm min-h-[2px]"
                  style={{ height: `${Math.max(pct, 3)}%` }}
                  title={`${m.month}: ${Number(m.cnt)} jobs`}
                />
                <span className="text-[8px] text-muted-foreground -rotate-45 origin-center whitespace-nowrap mt-1 hidden sm:block">
                  {m.month.slice(2)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Status Breakdown ─────────────────────────── */}
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Job Status
          </h3>
          <div className="space-y-2">
            {statusCounts.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || statusColors.DRAFT}`}
                >
                  {s.status.replace("_", " ")}
                </span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand/60 rounded-full"
                    style={{
                      width: `${(s._count / totalJobs) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground w-10 text-right">
                  {s._count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Foreman Workload ─────────────────────────── */}
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Foreman Workload
          </h3>
          <div className="space-y-2">
            {foremanStats.map((f) => {
              const name = foremanMap[f.foremanId!] || "Unknown";
              const pct = (f._count / totalJobs) * 100;
              return (
                <div key={f.foremanId} className="flex items-center gap-3">
                  <span className="text-sm text-foreground w-36 truncate">
                    {name}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-10 text-right">
                    {f._count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Job Types ──────────────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Top Job Types
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {jobsByType.map((j, i) => (
            <div
              key={j.jobType}
              className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
            >
              <span className="text-sm text-foreground">
                <span className="text-muted-foreground text-xs mr-2">
                  {i + 1}.
                </span>
                {j.jobType}
              </span>
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {j._count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Top Customers ──────────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Top 10 Customers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Customer</th>
                <th className="pb-2 text-right">Jobs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topCustomers.map((c, i) => (
                <tr key={c.customerId}>
                  <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-3 font-medium">
                    {customerMap[c.customerId] || "Unknown"}
                  </td>
                  <td className="py-2 text-right tabular-nums">{c._count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Crew Hours by Employee ───────────────────── */}
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Crew Hours by Employee
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-3">Employee</th>
                  <th className="pb-2 pr-3 text-right">Entries</th>
                  <th className="pb-2 pr-3 text-right">Job Hrs</th>
                  <th className="pb-2 pr-3 text-right">Setup</th>
                  <th className="pb-2 text-right">Travel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {crewStats.map((c) => (
                  <tr key={c.employeeId}>
                    <td className="py-1.5 pr-3 font-medium truncate max-w-[140px]">
                      {empMap[c.employeeId!] || "—"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                      {c._count}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {Number(c._sum.jobHours || 0).toFixed(1)}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                      {Number(c._sum.setupHours || 0).toFixed(1)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                      {Number(c._sum.travelHours || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Machine Usage ────────────────────────────── */}
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Machine Usage
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-3">Vehicle / Equipment</th>
                  <th className="pb-2 pr-3 text-right">Uses</th>
                  <th className="pb-2 text-right">Total Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topMachines.map((m) => (
                  <tr key={m.vehicleInfo}>
                    <td className="py-1.5 pr-3 font-medium truncate max-w-[180px]">
                      {m.vehicleInfo}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                      {m._count}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {Number(m._sum.hours || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Top Materials ─────────────────────────────── */}
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Top Materials
          </h3>
          <div className="space-y-1">
            {topMaterials.map((m) => (
              <div
                key={m.material}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
              >
                <span className="text-sm text-foreground truncate max-w-[200px]">
                  {m.material}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    qty {Number(m._sum.qty || 0).toFixed(0)}
                  </span>
                  <span className="text-sm font-medium tabular-nums w-8 text-right">
                    {m._count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Top Suppliers ─────────────────────────────── */}
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Top Outsourced Suppliers
          </h3>
          <div className="space-y-1">
            {topSuppliers.map((s) => (
              <div
                key={s.supplier}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
              >
                <span className="text-sm text-foreground truncate max-w-[180px]">
                  {s.supplier}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s._count} items
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    ${Number(s._sum.cost || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <div className="font-display text-2xl font-bold text-foreground">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-lg font-bold text-foreground">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
