import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

type MachineStatus = "RED" | "YELLOW" | "GREEN" | "UNTRACKED";

function getMachineStatus(
  totalHours: number,
  lastServiceHours: number | null,
  lastServiceDate: Date | null,
  intervalHours: number | null,
  intervalDays: number | null
): { status: MachineStatus; hoursRatio: number; daysRatio: number } {
  if (!intervalHours && !intervalDays) return { status: "UNTRACKED", hoursRatio: 0, daysRatio: 0 };

  const hoursSince = totalHours - (lastServiceHours ?? 0);
  const daysSinceSvc = lastServiceDate ? daysSince(lastServiceDate) : Infinity;

  const hoursRatio = intervalHours ? hoursSince / intervalHours : 0;
  const daysRatio = intervalDays ? daysSinceSvc / intervalDays : 0;
  const max = Math.max(hoursRatio, daysRatio);

  const status: MachineStatus = max >= 1 ? "RED" : max >= 0.8 ? "YELLOW" : "GREEN";
  return { status, hoursRatio, daysRatio };
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const machines = await prisma.machineInventory.findMany({
    where: { active: true },
    include: { jobMachines: { select: { hours: true } } },
  });

  const overdue: typeof machines = [];
  const warning: typeof machines = [];

  for (const m of machines) {
    const totalHours = m.jobMachines.reduce((sum, j) => sum + Number(j.hours), 0);
    const { status } = getMachineStatus(
      totalHours,
      m.lastServiceHours ? Number(m.lastServiceHours) : null,
      m.lastServiceDate,
      m.serviceIntervalHours ? Number(m.serviceIntervalHours) : null,
      m.serviceIntervalDays
    );
    if (status === "RED") overdue.push(m);
    else if (status === "YELLOW") warning.push(m);
  }

  if (overdue.length === 0 && warning.length === 0) {
    return NextResponse.json({ sent: false, message: "All machines OK" });
  }

  // Get all admin emails
  const admins = await prisma.employee.findMany({
    where: { active: true, role: { in: ["ADMIN", "MANAGER"] } },
    select: { email: true, name: true },
  });

  const rows = (list: typeof machines, label: string) =>
    list
      .map(
        (m) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.type}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            ${m.lastServiceDate ? new Date(m.lastServiceDate).toLocaleDateString("en-US") : "Never"}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${label === "OVERDUE" ? "#dc2626" : "#d97706"};font-weight:600;">${label}</td>
        </tr>`
      )
      .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#166534;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">Machine Maintenance Alert</h2>
        <p style="margin:4px 0 0;opacity:0.85;font-size:13px;">Mike's Clean Cut Landscaping</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <p style="margin:0 0 16px;color:#374151;">
          The following machines require attention as of ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}:
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Machine</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Type</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Last Service</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows(overdue, "OVERDUE")}
            ${rows(warning, "DUE SOON")}
          </tbody>
        </table>
        <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
          Log into the portal to view details and record service:
          <a href="https://app.mikescleancut.com/portal/machines" style="color:#166534;">Portal → Fleet</a>
        </p>
      </div>
    </div>`;

  for (const admin of admins) {
    if (!admin.email) continue;
    await sendMail({
      to: admin.email,
      subject: `[MCC] Machine Maintenance Alert — ${overdue.length} overdue, ${warning.length} due soon`,
      html,
    });
  }

  return NextResponse.json({
    sent: true,
    overdue: overdue.length,
    warning: warning.length,
    notified: admins.length,
  });
}
