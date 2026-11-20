import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  Sprout,
  CloudSnow,
  ArrowUpRight,
  ClipboardList,
  Package,
  Users,
  BarChart3,
  DollarSign,
  FileBarChart,
  Timer,
  Kanban,
  CalendarClock,
  Tractor,
  UserCog,
  Settings,
  Upload,
  MessageSquarePlus,
  Shield,
} from "lucide-react";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";
import { MANAGER_VISIBLE_ROLES, CHANGE_REQUEST_ROLES } from "@/lib/constants";

const ACTIVE_STATUSES = ["DRAFT", "IN_PROGRESS"] as const;

// Nov/Dec belongs to that year's season start; Jan–Oct belongs to the previous year's season.
function currentSnowSeasonStart(now: Date): Date {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const startYear = m >= 10 ? y : y - 1;
  return new Date(Date.UTC(startYear, 10, 1));
}

export default async function PortalHome() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];
  const role = session?.user?.role ?? "";
  const isManager = (MANAGER_VISIBLE_ROLES as readonly string[]).includes(role);
  const isAdmin = (CHANGE_REQUEST_ROLES as readonly string[]).includes(role);

  const seasonStart = currentSnowSeasonStart(new Date());

  const [landscapeActive, cleanUpActive, stormsThisSeason] = await Promise.all([
    prisma.workOrder.count({
      where: {
        jobCategory: { notIn: [...CLEAN_UP_CATEGORY_VALUES] },
        status: { in: [...ACTIVE_STATUSES] },
      },
    }),
    prisma.workOrder.count({
      where: {
        jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] },
        status: { in: [...ACTIVE_STATUSES] },
      },
    }),
    prisma.snowStorm.count({ where: { eventStart: { gte: seasonStart } } }),
  ]);

  const warmSeasonActive = landscapeActive + cleanUpActive;

  const jobTypes = [
    {
      href: "/portal/jobs",
      label: "Spring/Summer/Fall",
      icon: Sprout,
      count: warmSeasonActive,
      countLabel: warmSeasonActive === 1 ? "active job" : "active jobs",
    },
    {
      href: "/portal/snow",
      label: "Winter",
      icon: CloudSnow,
      count: stormsThisSeason,
      countLabel: stormsThisSeason === 1 ? "storm this season" : "storms this season",
    },
  ];

  const quickLinks = [
    { href: "/portal/jobs", label: "Jobs", icon: ClipboardList },
    { href: "/portal/board", label: "Board", icon: Kanban },
    { href: "/portal/reports", label: "Reports", icon: FileBarChart },
    { href: "/portal/breakdown", label: "Breakdown", icon: BarChart3 },
    { href: "/portal/costing", label: "Costing", icon: DollarSign },
    { href: "/portal/materials", label: "Materials", icon: Package },
    { href: "/portal/customers", label: "All Customers", icon: Users },
    { href: "/portal/time", label: "My Clock", icon: Timer },
    ...(isManager
      ? [
          { href: "/portal/time/log", label: "Time Log", icon: CalendarClock },
          { href: "/portal/machines", label: "Maintenance", icon: Tractor },
          { href: "/portal/employees", label: "All Employees", icon: UserCog },
          { href: "/portal/upload", label: "Upload Data", icon: Upload },
          { href: "/portal/admin", label: "Current Admin", icon: Shield },
          { href: "/portal/settings", label: "Settings", icon: Settings },
        ]
      : []),
    ...(isAdmin
      ? [{ href: "/portal/change-requests", label: "Change Requests", icon: MessageSquarePlus }]
      : []),
  ];

  return (
    <div className="space-y-10">
      <div className="animate-fade-in">
        <p className="text-sm font-medium text-muted-foreground">
          Mike&apos;s Clean Cut &mdash; Employee Portal
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
          {firstName ? `Hey ${firstName}, what's the job?` : "What's the job?"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jobTypes.map((type, i) => (
          <Link
            key={type.href}
            href={type.href}
            className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg animate-fade-in"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center transition-transform group-hover:scale-105">
                <type.icon className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
            </div>
            <div className="mt-5 font-display text-4xl font-black tabular-nums text-foreground">
              {type.count}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">{type.countLabel}</div>
            <div className="mt-3 font-display text-lg font-bold text-foreground">{type.label}</div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Quick Links
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/40 hover:bg-secondary/40"
            >
              <link.icon className="w-5 h-5 text-brand shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
