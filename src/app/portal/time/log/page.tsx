import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";

function parseDate(param: string | undefined): Date {
  if (!param) return new Date();
  const d = new Date(param + "T12:00:00");
  return isNaN(d.getTime()) ? new Date() : d;
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDuration(from: Date, to: Date | null) {
  if (!to) return "—";
  const diff = Math.floor((to.getTime() - from.getTime()) / 1000 / 60);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function navDate(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export default async function TimeLogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!["ADMIN", "MANAGER"].includes(session!.user.role)) {
    redirect("/portal/time");
  }

  const { date: dateParam } = await searchParams;
  const date = parseDate(dateParam);
  const dateStr = date.toISOString().split("T")[0];

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const punches = await prisma.punchRecord.findMany({
    where: { punchIn: { gte: start, lte: end } },
    include: {
      employee: { select: { id: true, name: true, role: true } },
      workOrder: { select: { workOrderNumber: true, jobType: true, customer: { select: { name: true } } } },
      extras: true,
    },
    orderBy: [{ employee: { name: "asc" } }, { punchIn: "asc" }],
  });

  // Group by employee
  const byEmployee = new Map<string, { name: string; role: string; punches: typeof punches }>();
  for (const p of punches) {
    const key = p.employee.id;
    if (!byEmployee.has(key)) {
      byEmployee.set(key, { name: p.employee.name, role: p.employee.role, punches: [] });
    }
    byEmployee.get(key)!.punches.push(p);
  }

  const today = new Date().toISOString().split("T")[0];
  const isToday = dateStr === today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Time Log</h1>
          <p className="text-sm text-muted-foreground mt-1">All employee punches</p>
        </div>
        <Link href="/portal/time" className="text-sm text-brand hover:underline">
          My Clock
        </Link>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <Link
          href={`/portal/time/log?date=${navDate(date, -1)}`}
          className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <ChevronLeft size={16} />
        </Link>
        <span className="font-medium text-sm min-w-[160px] text-center">
          {isToday
            ? "Today"
            : date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
        <Link
          href={`/portal/time/log?date=${navDate(date, 1)}`}
          className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <ChevronRight size={16} />
        </Link>
        {!isToday && (
          <Link href="/portal/time/log" className="text-xs text-brand hover:underline ml-2">
            Today
          </Link>
        )}
      </div>

      {byEmployee.size === 0 ? (
        <Card className="p-10 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No punch records for this day.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(byEmployee.entries()).map(([, emp]) => {
            const totalMins = emp.punches.reduce((sum, p) => {
              if (!p.punchOut) return sum;
              return sum + Math.floor((p.punchOut.getTime() - p.punchIn.getTime()) / 1000 / 60);
            }, 0);
            const extraTotal = emp.punches.reduce((sum, p) =>
              sum + p.extras.reduce((s, e) => s + Number(e.hours), 0), 0);
            const totalH = Math.floor(totalMins / 60);
            const totalM = totalMins % 60;

            return (
              <Card key={emp.name} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                      <User size={14} />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{emp.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide capitalize">
                      {emp.role.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {totalH > 0 || totalM > 0
                      ? `${totalH}h ${totalM}m`
                      : <span className="text-muted-foreground text-xs">Still in</span>}
                    {extraTotal > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">+{extraTotal}h extra</span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {emp.punches.map((p) => (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${p.punchOut ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
                          <span>
                            {fmtTime(p.punchIn)}
                            {p.punchOut ? ` – ${fmtTime(p.punchOut)}` : " — in progress"}
                          </span>
                          <span className="text-muted-foreground">
                            ({fmtDuration(p.punchIn, p.punchOut)})
                          </span>
                        </div>
                        {p.workOrder && (
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {p.workOrder.workOrderNumber} · {p.workOrder.customer.name}
                          </span>
                        )}
                      </div>
                      {p.extras.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 ml-5">
                          {p.extras.map((e) => (
                            <span key={e.id} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {e.type.toLowerCase()} +{Number(e.hours)}h
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
