"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PenLine, ChevronRight } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/job-categories";
import { JobQuickCreate, type WorkOrderItem, type Customer } from "./JobQuickCreate";

// Season-scoped: picking Fall/Spring Clean Up here would make the job
// immediately vanish from this view (it belongs under Clean Ups instead).
const SPRING_SUMMER_CATEGORIES = JOB_CATEGORIES.filter(
  (c) => c.value !== "FALL_CLEANUP" && c.value !== "SPRING_CLEANUP"
);

const formatCategory = (cat: string) =>
  cat
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");

export function ActiveWorkOrders({
  workOrders: initialWOs,
  customers,
}: {
  workOrders: WorkOrderItem[];
  customers: Customer[];
}) {
  const [workOrders, setWorkOrders] = useState(initialWOs);

  return (
    <div className="space-y-4">
      <JobQuickCreate
        customers={customers}
        categoryOptions={SPRING_SUMMER_CATEGORIES}
        onCreated={(job) => setWorkOrders((prev) => [job, ...prev])}
      />

      {/* Active Work Orders List */}
      <div>
        <h2 className="font-display text-sm font-semibold text-foreground mb-2">
          Active Work Orders ({workOrders.length})
        </h2>
        {workOrders.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              No active work orders
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {workOrders.map((wo) => (
              <Card key={wo.id} className="p-0 overflow-hidden">
                <div className="flex items-center">
                  <div className="flex-1 min-w-0 p-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">
                        {wo.customerName}
                      </span>
                      <span className="text-[10px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full shrink-0">
                        {wo.workOrderNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCategory(wo.jobType)}</span>
                      <span>·</span>
                      <span
                        className={
                          wo.status === "IN_PROGRESS"
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {wo.status === "IN_PROGRESS"
                          ? "In Progress"
                          : "Draft"}
                      </span>
                      {wo.logCount > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {wo.logCount} log{wo.logCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/portal/landscape/log?wo=${wo.id}`}
                    className="flex items-center gap-1 px-3 py-4 text-brand hover:bg-brand/5 transition-colors border-l border-border"
                  >
                    <PenLine className="w-4 h-4" />
                    <span className="text-xs font-medium">Log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
