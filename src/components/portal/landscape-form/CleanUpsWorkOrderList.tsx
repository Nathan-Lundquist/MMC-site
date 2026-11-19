"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PenLine, Pencil, ChevronRight } from "lucide-react";
import { CLEAN_UP_CATEGORIES } from "@/lib/job-categories";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { JobQuickCreate, type WorkOrderItem, type Customer } from "./JobQuickCreate";

export function CleanUpsWorkOrderList({
  workOrders: initialWOs,
  customers,
  tab = "active",
}: {
  workOrders: WorkOrderItem[];
  customers: Customer[];
  tab?: "active" | "closed";
}) {
  const [workOrders, setWorkOrders] = useState(initialWOs);
  const heading = tab === "closed" ? "Closed Clean-Up Jobs" : "Active Clean-Up Jobs";
  const emptyMessage = tab === "closed" ? "No closed clean-up jobs" : "No active clean-up jobs";

  return (
    <div className="space-y-4">
      {tab === "active" && (
        <JobQuickCreate
          customers={customers}
          categoryOptions={CLEAN_UP_CATEGORIES}
          onCreated={(job) => setWorkOrders((prev) => [job, ...prev])}
        />
      )}

      <div>
        <h2 className="font-display text-sm font-semibold text-foreground mb-2">
          {heading} ({workOrders.length})
        </h2>
        {workOrders.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              {emptyMessage}
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
                      <span>{wo.jobType}</span>
                      <span>·</span>
                      <StatusBadge status={wo.status} size="xs" />
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
                    href={`/portal/jobs/${wo.id}/edit`}
                    className="flex items-center gap-1 px-3 py-4 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border-l border-border"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Edit</span>
                  </Link>
                  {tab === "active" && (
                    <Link
                      href={`/portal/cleanups/log?wo=${wo.id}`}
                      className="flex items-center gap-1 px-3 py-4 text-brand hover:bg-brand/5 transition-colors border-l border-border"
                    >
                      <PenLine className="w-4 h-4" />
                      <span className="text-xs font-medium">Log</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
