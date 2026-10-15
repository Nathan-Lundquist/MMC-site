"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import {
  MobileSelect,
  MobileInput,
  Field,
  CategorySelect,
} from "@/components/portal/work-order-form/form-ui";

export interface WorkOrderItem {
  id: string;
  workOrderNumber: string;
  jobType: string;
  status: string;
  customerName: string;
  startDate: string | null;
  logCount: number;
}

export interface Customer {
  id: string;
  name: string;
}

export interface CategoryOption {
  value: string;
  label: string;
}

export function JobQuickCreate({
  customers,
  categoryOptions,
  onCreated,
}: {
  customers: Customer[];
  categoryOptions: CategoryOption[];
  onCreated: (job: WorkOrderItem) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate() {
    if (!customerId || !jobCategory || !jobType) {
      setError("Customer, category, and description are required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/landscape/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, jobCategory, jobType, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      const wo = await res.json();
      onCreated({
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        jobType: wo.jobType,
        status: wo.status,
        customerName: wo.customer.name,
        startDate: wo.projectStartDate,
        logCount: 0,
      });

      setCustomerId("");
      setJobCategory("");
      setJobType("");
      setNotes("");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  if (!showCreate) {
    return (
      <Button
        onClick={() => setShowCreate(true)}
        className="w-full h-12 text-base font-semibold gap-2"
        variant="outline"
      >
        <Plus className="w-5 h-5" />
        New Work Order
      </Button>
    );
  }

  return (
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
      <Field label="Category">
        <CategorySelect value={jobCategory} onChange={setJobCategory} options={categoryOptions} />
      </Field>
      <Field label="Description">
        <MobileInput
          placeholder="e.g. Lawn Cut, Fall Cleanup"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        />
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
  );
}
