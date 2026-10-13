"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Field, MobileSelect, MobileInput } from "@/components/portal/work-order-form/form-ui";
import { AlertCircle } from "lucide-react";
import type { BoardJob } from "./types";

type Option = { id: string; name: string };

export default function NewJobSheet({
  open,
  onOpenChange,
  customers,
  foremen,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Option[];
  foremen: Option[];
  onCreated: (job: BoardJob) => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [jobType, setJobType] = useState("");
  const [foremanId, setForemanId] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = Boolean(customerId) && Boolean(jobType.trim());

  function resetForm() {
    setCustomerId("");
    setJobType("");
    setForemanId("");
    setProjectStartDate("");
    setError("");
  }

  async function handleSubmit() {
    if (loading || !isValid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/board/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobType: jobType.trim(),
          foremanId: foremanId || undefined,
          projectStartDate: projectStartDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create job");
        return;
      }
      onCreated(data as BoardJob);
      resetForm();
      onOpenChange(false);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>New Job</SheetTitle>
        </SheetHeader>
        <div className="px-4 space-y-4">
          <Field label="Customer">
            <MobileSelect value={customerId} onChange={setCustomerId}>
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </MobileSelect>
          </Field>
          <Field label="Job Type">
            <MobileInput
              placeholder="e.g. Lawn Cut, Fall Cleanup"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            />
          </Field>
          <Field label="Foreman (optional)">
            <MobileSelect value={foremanId} onChange={setForemanId}>
              <option value="">Unassigned</option>
              {foremen.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </MobileSelect>
          </Field>
          <Field label="Scheduled Date (optional)">
            <MobileInput
              type="date"
              value={projectStartDate}
              onChange={(e) => setProjectStartDate(e.target.value)}
            />
          </Field>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={loading || !isValid} className="w-full">
            {loading ? "Creating…" : "Create Job"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
