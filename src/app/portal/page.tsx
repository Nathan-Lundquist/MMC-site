import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Sprout, Leaf, CloudSnow, ArrowUpRight } from "lucide-react";
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
    },
    {
      href: "/portal/cleanups",
      label: "Clean Ups",
      icon: Leaf,
      count: cleanUpActive,
      countLabel: cleanUpActive === 1 ? "active job" : "active jobs",
    },
    {
      href: "/portal/snow",
      label: "Winter",
      icon: CloudSnow,
      count: stormsThisSeason,
      countLabel: stormsThisSeason === 1 ? "storm this season" : "storms this season",
    },
  ];

  return (
    <div className="-m-4 lg:-m-6">
      <div className="relative overflow-hidden bg-[oklch(0.17_0.014_26)] min-h-[calc(100vh-3.5rem)] px-6 sm:px-10 lg:px-16 py-14 sm:py-20 flex flex-col">
        <div
          className="pointer-events-none absolute -top-48 -right-48 w-[620px] h-[620px] rounded-full bg-brand/25 blur-[140px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-brand/40 to-transparent"
          aria-hidden
        />

        <div className="relative animate-fade-in">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/45">
            Mike&apos;s Clean Cut &mdash; Dispatch
          </p>
          <h1 className="font-display mt-4 text-[clamp(2.75rem,7vw,5.75rem)] font-black leading-[0.95] tracking-tight text-white">
            {firstName ? (
              <>
                Hey {firstName}.
                <br />
                What&apos;s the job?
              </>
            ) : (
              "What's the job?"
            )}
          </h1>
        </div>

        <div className="relative mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10">
          {jobTypes.map((type, i) => (
            <Link
              key={type.href}
              href={type.href}
              className="group relative flex min-h-[260px] flex-col justify-between bg-[oklch(0.17_0.014_26)] p-8 transition-colors duration-300 hover:bg-brand sm:min-h-[320px] sm:p-10 animate-fade-in"
              style={{ animationDelay: `${i * 90}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-start justify-between">
                <type.icon
                  className="h-8 w-8 text-brand transition-colors duration-300 group-hover:text-white"
                  strokeWidth={1.5}
                />
                <ArrowUpRight className="h-6 w-6 text-white/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
              </div>

              <div>
                <div className="font-display text-6xl font-black leading-none tabular-nums text-white sm:text-7xl">
                  {type.count}
                </div>
                <div className="mt-2 text-sm text-white/55 transition-colors duration-300 group-hover:text-white/80">
                  {type.countLabel}
                </div>
                <div className="mt-5 font-display text-xl font-bold text-white sm:text-2xl">
                  {type.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
