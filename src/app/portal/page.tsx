import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Sprout, Leaf, CloudSnow, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";

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

  const jobTypes = [
    {
      href: "/portal/landscape",
      label: "Landscape",
      icon: Sprout,
      count: landscapeActive,
      countLabel: landscapeActive === 1 ? "active job" : "active jobs",
      accent: "emerald",
    },
    {
      href: "/portal/cleanups",
      label: "Clean Ups",
      icon: Leaf,
      count: cleanUpActive,
      countLabel: cleanUpActive === 1 ? "active job" : "active jobs",
      accent: "amber",
    },
    {
      href: "/portal/snow",
      label: "Winter",
      icon: CloudSnow,
      count: stormsThisSeason,
      countLabel: stormsThisSeason === 1 ? "storm this season" : "storms this season",
      accent: "sky",
    },
  ] as const;

  const ACCENTS: Record<
    (typeof jobTypes)[number]["accent"],
    { icon: string; glow: string; ring: string }
  > = {
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-600",
      glow: "bg-emerald-500",
      ring: "group-hover:ring-emerald-500/25",
    },
    amber: {
      icon: "bg-amber-500/10 text-amber-600",
      glow: "bg-amber-500",
      ring: "group-hover:ring-amber-500/25",
    },
    sky: {
      icon: "bg-sky-500/10 text-sky-600",
      glow: "bg-sky-500",
      ring: "group-hover:ring-sky-500/25",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] text-center px-4">
      <div className="animate-fade-in">
        <p className="text-sm font-medium text-muted-foreground">
          Mike&apos;s Clean Cut &mdash; Employee Portal
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
          {firstName ? `Hey ${firstName}, what's the job?` : "What's the job?"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 w-full max-w-4xl">
        {jobTypes.map((type, i) => {
          const accent = ACCENTS[type.accent];
          return (
            <Link
              key={type.href}
              href={type.href}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border bg-card p-7 sm:p-8",
                "flex flex-col items-center text-center",
                "ring-1 ring-transparent transition-all duration-200",
                "hover:-translate-y-1 hover:shadow-xl hover:border-transparent",
                accent.ring,
                "animate-fade-in"
              )}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              <div
                className={cn(
                  "absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.16]",
                  accent.glow
                )}
                aria-hidden
              />

              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  accent.icon
                )}
              >
                <type.icon className="w-8 h-8" />
              </div>

              <div className="mt-5 font-display text-lg font-bold text-foreground">
                {type.label}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {type.count.toLocaleString()} {type.countLabel}
              </div>

              <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Open
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
