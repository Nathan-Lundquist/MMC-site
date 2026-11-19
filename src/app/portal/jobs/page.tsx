import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Leaf, Sprout, CloudSnow, ChevronRight } from "lucide-react";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";

const ACTIVE_STATUSES = ["DRAFT", "IN_PROGRESS"] as const;

export default async function JobTypesPage() {
  const [cleanUpActive, landscapeActive, stormCount] = await Promise.all([
    prisma.workOrder.count({
      where: {
        jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] },
        status: { in: [...ACTIVE_STATUSES] },
      },
    }),
    prisma.workOrder.count({
      where: {
        jobCategory: { notIn: [...CLEAN_UP_CATEGORY_VALUES] },
        status: { in: [...ACTIVE_STATUSES] },
      },
    }),
    prisma.snowStorm.count(),
  ]);

  const jobTypes = [
    {
      href: "/portal/cleanups",
      label: "Seasonal Clean Up",
      icon: Leaf,
      count: cleanUpActive,
      countLabel: "active",
    },
    {
      href: "/portal/landscape",
      label: "Landscaping",
      icon: Sprout,
      count: landscapeActive,
      countLabel: "active",
    },
    {
      href: "/portal/snow",
      label: "Snow",
      icon: CloudSnow,
      count: stormCount,
      countLabel: "storms",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Jobs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a job type to see active and closed jobs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {jobTypes.map((type) => (
          <Link key={type.href} href={type.href}>
            <Card className="p-5 h-full hover:border-brand/30 hover:bg-secondary/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <type.icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <div className="font-display text-base font-semibold text-foreground">
                  {type.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {type.count.toLocaleString()} {type.countLabel}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
