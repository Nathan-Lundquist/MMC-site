"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PenLine, Pencil, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { CLEAN_UP_CATEGORIES } from "@/lib/job-categories";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { ProfitCell } from "@/components/portal/ProfitCell";
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

      {workOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </Card>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-secondary/60 text-center border-b border-border">
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                    WO #
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                    Job Type
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap hidden md:table-cell">
                    Foreman
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                    Invoice
                  </th>
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap hidden xl:table-cell">
                    Profit
                  </th>
                  {tab === "active" && (
                    <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                      Log
                    </th>
                  )}
                  <th className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo, i) => {
                  const detailHref = `/portal/jobs/${wo.id}`;
                  return (
                    <tr
                      key={wo.id}
                      className={cn(
                        "border-b border-border last:border-b-0 hover:bg-brand/5",
                        i % 2 === 1 && "bg-secondary/45"
                      )}
                    >
                      <td className="p-0">
                        <Link href={detailHref} className="block px-3 py-2 text-center font-semibold text-brand">
                          {wo.workOrderNumber}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={detailHref} className="block px-3 py-2 text-center max-w-48 truncate mx-auto text-foreground">
                          {wo.customerName}
                        </Link>
                      </td>
                      <td className="p-0 hidden sm:table-cell">
                        <Link href={detailHref} className="block px-3 py-2 text-center text-muted-foreground">
                          {wo.jobType}
                        </Link>
                      </td>
                      <td className="p-0 hidden md:table-cell">
                        <Link href={detailHref} className="block px-3 py-2 text-center text-muted-foreground">
                          {wo.foremanName || "—"}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={detailHref} className="flex items-center justify-center px-3 py-2">
                          <StatusBadge status={wo.status} />
                        </Link>
                      </td>
                      <td className="p-0 hidden lg:table-cell">
                        <Link href={detailHref} className="block px-3 py-2 text-center text-muted-foreground whitespace-nowrap">
                          {formatDate(wo.startDate)}
                        </Link>
                      </td>
                      <td className="p-0 hidden lg:table-cell">
                        <Link href={detailHref} className="block px-3 py-2 text-center tabular-nums whitespace-nowrap">
                          {formatCurrency(wo.invoiceAmount)}
                        </Link>
                      </td>
                      <td className="p-0 hidden xl:table-cell">
                        <Link href={detailHref} className="block px-3 py-2 text-center tabular-nums whitespace-nowrap">
                          <ProfitCell profit={wo.profit} profitPct={wo.profitPercent} />
                        </Link>
                      </td>
                      {tab === "active" && (
                        <td className="p-0">
                          <Link
                            href={`/portal/cleanups/log?wo=${wo.id}`}
                            className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-brand hover:bg-brand/5 transition-colors"
                          >
                            <PenLine className="w-3 h-3" />
                            Log
                            {wo.logCount > 0 && (
                              <span className="text-[10px] text-muted-foreground">({wo.logCount})</span>
                            )}
                          </Link>
                        </td>
                      )}
                      <td className="p-0">
                        <Link
                          href={`/portal/jobs/${wo.id}/edit`}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
