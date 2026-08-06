import { prisma } from "@/lib/db";
import FleetView from "./FleetView";

type MachineStatus = "RED" | "YELLOW" | "GREEN" | "UNTRACKED";

function getStatus(
  totalHours: number,
  lastServiceHours: number | null,
  lastServiceDate: Date | null,
  intervalHours: number | null,
  intervalDays: number | null
): { status: MachineStatus; pct: number } {
  if (!intervalHours && !intervalDays) return { status: "UNTRACKED", pct: 0 };

  const hoursSince = totalHours - (lastServiceHours ?? 0);
  const daysSince = lastServiceDate
    ? Math.floor((Date.now() - lastServiceDate.getTime()) / 86400000)
    : Infinity;

  const hoursRatio = intervalHours ? hoursSince / intervalHours : 0;
  const daysRatio = intervalDays && isFinite(daysSince) ? daysSince / intervalDays : 0;
  const pct = Math.max(hoursRatio, daysRatio);

  const status: MachineStatus = pct >= 1 ? "RED" : pct >= 0.8 ? "YELLOW" : "GREEN";
  return { status, pct };
}

export default async function MachinesPage() {
  const raw = await prisma.machineInventory.findMany({
    where: { active: true },
    include: {
      jobMachines: { select: { hours: true } },
      serviceLogs: { orderBy: { serviceDate: "desc" }, take: 3 },
    },
    orderBy: { name: "asc" },
  });

  const machines = raw.map((m) => {
    const totalHours = m.jobMachines.reduce((s, j) => s + Number(j.hours), 0);
    const { status, pct } = getStatus(
      totalHours,
      m.lastServiceHours ? Number(m.lastServiceHours) : null,
      m.lastServiceDate,
      m.serviceIntervalHours ? Number(m.serviceIntervalHours) : null,
      m.serviceIntervalDays
    );
    return {
      id: m.id,
      name: m.name,
      type: m.type,
      serialNumber: m.serialNumber,
      serviceIntervalHours: m.serviceIntervalHours ? Number(m.serviceIntervalHours) : null,
      serviceIntervalDays: m.serviceIntervalDays,
      lastServiceDate: m.lastServiceDate?.toISOString() ?? null,
      lastServiceHours: m.lastServiceHours ? Number(m.lastServiceHours) : null,
      notes: m.notes,
      totalHours,
      hoursSinceService: totalHours - (m.lastServiceHours ? Number(m.lastServiceHours) : 0),
      daysSinceService: m.lastServiceDate
        ? Math.floor((Date.now() - m.lastServiceDate.getTime()) / 86400000)
        : null,
      status,
      pct: Math.round(pct * 100),
      recentService: m.serviceLogs[0]
        ? {
            date: m.serviceLogs[0].serviceDate.toISOString(),
            type: m.serviceLogs[0].serviceType,
            performedBy: m.serviceLogs[0].performedBy,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Fleet</h1>
        <p className="text-sm text-muted-foreground mt-1">Machine maintenance tracking</p>
      </div>
      <FleetView machines={machines} />
    </div>
  );
}
