import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PunchCard from "./PunchCard";

export default async function TimePage() {
  const session = await auth();
  const employeeId = session!.user.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [activePunchRaw, todayPunchesRaw, activeJobs] = await Promise.all([
    // Current open punch for this employee
    prisma.punchRecord.findFirst({
      where: { employeeId, punchOut: null },
      include: {
        workOrder: { select: { workOrderNumber: true, jobType: true, customer: { select: { name: true } } } },
        extras: true,
      },
    }),
    // Today's completed punches for this employee
    prisma.punchRecord.findMany({
      where: {
        employeeId,
        punchIn: { gte: todayStart, lte: todayEnd },
        punchOut: { not: null },
      },
      include: {
        workOrder: { select: { workOrderNumber: true, jobType: true, customer: { select: { name: true } } } },
        extras: true,
      },
      orderBy: { punchIn: "desc" },
    }),
    // Active jobs to select when punching in
    prisma.workOrder.findMany({
      where: { status: { in: ["IN_PROGRESS", "DRAFT"] } },
      select: { id: true, workOrderNumber: true, jobType: true, customer: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  // Serialize Prisma types for client component
  const activePunch = activePunchRaw
    ? {
        id: activePunchRaw.id,
        punchIn: activePunchRaw.punchIn.toISOString(),
        jobLabel: activePunchRaw.workOrder
          ? `${activePunchRaw.workOrder.workOrderNumber} — ${activePunchRaw.workOrder.customer.name}`
          : null,
        extras: activePunchRaw.extras.map((e) => ({
          id: e.id,
          type: e.type,
          hours: Number(e.hours),
          notes: e.notes,
        })),
      }
    : null;

  const todayPunches = todayPunchesRaw.map((p) => ({
    id: p.id,
    punchIn: p.punchIn.toISOString(),
    punchOut: p.punchOut!.toISOString(),
    jobLabel: p.workOrder
      ? `${p.workOrder.workOrderNumber} — ${p.workOrder.customer.name}`
      : null,
    extras: p.extras.map((e) => ({
      id: e.id,
      type: e.type,
      hours: Number(e.hours),
      notes: e.notes,
    })),
  }));

  const jobs = activeJobs.map((j) => ({
    id: j.id,
    workOrderNumber: j.workOrderNumber,
    jobType: j.jobType,
    customerName: j.customer.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Time Clock</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Punch in and out for your jobs
        </p>
      </div>
      <PunchCard
        activePunch={activePunch}
        todayPunches={todayPunches}
        jobs={jobs}
      />
    </div>
  );
}
