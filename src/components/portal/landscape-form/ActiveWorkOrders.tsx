"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, PenLine, ChevronRight } from "lucide-react";
import {
  MobileSelect,
  MobileInput,
  Field,
} from "@/components/portal/work-order-form/form-ui";

interface WorkOrderItem {
  id: string;
  workOrderNumber: string;
  jobType: string;
  status: string;
  customerName: string;
  startDate: string | null;
  logCount: number;
}

interface Customer {
  id: string;
  name: string;
}

const JOB_CATEGORIES = [
  "LANDSCAPE",
  "FALL_CLEANUP",
  "SPRING_CLEANUP",
  "SUBCONTRACTOR",
  "IN_HOUSE_REPAIR",
  "BED_MAINTENANCE",
  "SPRINKLER",
  "LIGHTING",
  "HARDSCAPE",
  "OTHER",
];

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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Quick create form state
  const [customerId, setCustomerId] = useState("");
  const [jobType, setJobType] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate() {
    if (!customerId || !jobType) {
      setError("Customer and job type are required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/landscape/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, jobType, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      const wo = await res.json();
      setWorkOrders((prev) => [
        {
          id: wo.id,
          workOrderNumber: wo.workOrderNumber,
          jobType: wo.jobType,
          status: wo.status,
          customerName: wo.customer.name,
          startDate: wo.projectStartDate,
          logCount: 0,
        },
        ...prev,
      ]);

      // Reset form
      setCustomerId("");
      setJobType("");
      setNotes("");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Create Toggle */}
      {!showCreate ? (
        <Button
          onClick={() => setShowCreate(true)}
          className="w-full h-12 text-base font-semibold gap-2"
          variant="outline"
        >
          <Plus className="w-5 h-5" />
          New Work Order
        </Button>
      ) : (
        <Card className="p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Quick Create Work Order
          </h3>
          <Field label="Customer">
            <MobileSelect value={customerId} onChange={setCustomerId}>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </MobileSelect>
          </Field>
          <Field label="Job Type">
            <MobileSelect value={jobType} onChange={setJobType}>
              <option value="">Select job type...</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat)}
                </option>
              ))}
            </MobileSelect>
          </Field>
          <Field label="Notes (optional)">
            <MobileInput
              placeholder="Brief description..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 h-11 gap-2"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setError("");
              }}
              className="h-11"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

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
