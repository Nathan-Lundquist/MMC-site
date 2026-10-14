"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PenLine, ChevronRight } from "lucide-react";
import { CLEAN_UP_CATEGORIES } from "@/lib/job-categories";
import { JobQuickCreate, type WorkOrderItem, type Customer } from "./JobQuickCreate";

const formatCategory = (cat: string) =>
  cat
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");

export function CleanUpsWorkOrderList({
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
        categoryOptions={CLEAN_UP_CATEGORIES}
        onCreated={(job) => setWorkOrders((prev) => [job, ...prev])}
      />

      <div>
        <h2 className="font-display text-sm font-semibold text-foreground mb-2">
          Active Clean-Up Jobs ({workOrders.length})
        </h2>
        {workOrders.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              No active clean-up jobs
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
                    href={`/portal/cleanups/log?wo=${wo.id}`}
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
