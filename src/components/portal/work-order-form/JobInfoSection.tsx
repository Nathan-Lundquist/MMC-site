"use client";

import { Card } from "@/components/ui/card";
import { MobileSelect, MobileInput, Field, CategorySelect } from "./form-ui";
import { CustomerCombobox } from "./CustomerCombobox";
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
  isEdit: boolean;
  estimateNumber: string;
  setEstimateNumber: (v: string) => void;
  pctComplete: string;
  setPctComplete: (v: string) => void;
  totalHours: string;
  setTotalHours: (v: string) => void;
  estimatedHours: string;
  setEstimatedHours: (v: string) => void;
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
  isEdit,
  estimateNumber,
  setEstimateNumber,
  pctComplete,
  setPctComplete,
  totalHours,
  setTotalHours,
  estimatedHours,
  setEstimatedHours,
}: Props) {
  return (
    <Card className="p-4">
      {/* Mobile: stacked label-above-input cards */}
      <div className="sm:hidden grid grid-cols-1 gap-4">
        <Field label="Customer *">
          <CustomerCombobox customers={customers} value={customerId} onChange={setCustomerId} />
        </Field>

        <Field label="Category *">
          <CategorySelect value={jobCategory} onChange={setJobCategory} options={JOB_CATEGORIES} />
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

        {isEdit ? (
          <Field label="Work Order # *">
            <MobileInput
              value={woNumber}
              onChange={(e) => setWoNumber(e.target.value)}
              placeholder="25-32038"
              required
            />
          </Field>
        ) : (
          <Field label="Work Order #">
            <div className="h-11 flex items-center px-3 rounded-md border border-dashed border-input bg-secondary/30 text-sm text-muted-foreground">
              Assigned automatically on save
            </div>
          </Field>
        )}

        <Field label="Estimate #">
          <MobileInput
            value={estimateNumber}
            onChange={(e) => setEstimateNumber(e.target.value)}
            placeholder="Optional"
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

        <Field label="Estimated Hours">
          <MobileInput
            type="number"
            min="0"
            step="0.01"
            placeholder="Budgeted crew hours"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
          />
        </Field>
      </div>

      {/* Desktop: dense label-left job-sheet grid */}
      <div className="hidden sm:block rounded-md border border-border overflow-hidden">
        <div className="grid grid-cols-2">
          <InfoRow label="Customer *">
            <CustomerCombobox customers={customers} value={customerId} onChange={setCustomerId} />
          </InfoRow>
          <InfoRow label="Category *" border="l">
            <CategorySelect value={jobCategory} onChange={setJobCategory} options={JOB_CATEGORIES} />
          </InfoRow>

          <InfoRow label="Type of Job">
            <MobileInput
              className="h-8 text-sm"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              placeholder="e.g. Fall Clean Up, Landscaping..."
            />
          </InfoRow>
          <InfoRow label="Foreman *" border="l">
            <MobileSelect value={foremanId} onChange={setForemanId}>
              <option value="">Select foreman...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </MobileSelect>
          </InfoRow>

          <InfoRow label="Work Order #">
            {isEdit ? (
              <MobileInput
                className="h-8 text-sm"
                value={woNumber}
                onChange={(e) => setWoNumber(e.target.value)}
                placeholder="25-32038"
                required
              />
            ) : (
              <span className="text-sm text-muted-foreground italic">Assigned automatically on save</span>
            )}
          </InfoRow>
          <InfoRow label="Estimate #" border="l">
            <MobileInput
              className="h-8 text-sm"
              value={estimateNumber}
              onChange={(e) => setEstimateNumber(e.target.value)}
              placeholder="Optional"
            />
          </InfoRow>

          <InfoRow label="% Completed">
            <MobileInput
              className="h-8 text-sm"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={pctComplete}
              onChange={(e) => setPctComplete(e.target.value)}
            />
          </InfoRow>
          <InfoRow label="Total Man Hours" border="l">
            <MobileInput
              className="h-8 text-sm"
              type="number"
              min="0"
              step="0.01"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
            />
          </InfoRow>

          <InfoRow label="Estimated Hours" lastRow>
            <MobileInput
              className="h-8 text-sm"
              type="number"
              min="0"
              step="0.01"
              placeholder="Budgeted crew hours"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
          </InfoRow>
          <div className="border-l border-border" />
        </div>
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  children,
  border,
  lastRow,
}: {
  label: string;
  children: React.ReactNode;
  border?: "l";
  lastRow?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 ${!lastRow ? "border-b border-border" : ""} ${
        border === "l" ? "border-l border-border" : ""
      }`}
    >
      <span className="w-36 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
