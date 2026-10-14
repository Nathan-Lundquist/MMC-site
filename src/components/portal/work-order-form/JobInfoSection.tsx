"use client";

import { Card } from "@/components/ui/card";
import { MobileSelect, MobileInput, Field } from "./form-ui";
import { JOB_CATEGORIES } from "@/lib/job-categories";

interface Props {
  customers: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  customerId: string;
  setCustomerId: (v: string) => void;
  jobCategory: string;
  setJobCategory: (v: string) => void;
  jobType: string;
  setJobType: (v: string) => void;
  foremanId: string;
  setForemanId: (v: string) => void;
  woNumber: string;
  setWoNumber: (v: string) => void;
  pctComplete: string;
  setPctComplete: (v: string) => void;
  totalHours: string;
  setTotalHours: (v: string) => void;
}

export function JobInfoSection({
  customers,
  employees,
  customerId,
  setCustomerId,
  jobCategory,
  setJobCategory,
  jobType,
  setJobType,
  foremanId,
  setForemanId,
  woNumber,
  setWoNumber,
  pctComplete,
  setPctComplete,
  totalHours,
  setTotalHours,
}: Props) {
  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Customer *">
          <MobileSelect value={customerId} onChange={setCustomerId}>
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </MobileSelect>
        </Field>

        <Field label="Category *">
          <MobileSelect value={jobCategory} onChange={setJobCategory}>
            <option value="">Select category...</option>
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </MobileSelect>
        </Field>

        <Field label="Type of Job">
          <MobileInput
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            placeholder="e.g. Fall Clean Up, Landscaping..."
          />
        </Field>

        <Field label="Foreman *">
          <MobileSelect value={foremanId} onChange={setForemanId}>
            <option value="">Select foreman...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </MobileSelect>
        </Field>

        <Field label="Work Order # *">
          <MobileInput
            value={woNumber}
            onChange={(e) => setWoNumber(e.target.value)}
            placeholder="25-32038"
            required
          />
        </Field>

        <Field label="% Completed">
          <MobileInput
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={pctComplete}
            onChange={(e) => setPctComplete(e.target.value)}
          />
        </Field>

        <Field label="Total Man Hours">
          <MobileInput
            type="number"
            min="0"
            step="0.01"
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
          />
        </Field>
      </div>
    </Card>
  );
}
