"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { AddlWorkRow, AddlCrewRow, AddlMaterialRow, AddlOutsourcedRow } from "./types";
import { todayLocal, updateRow, removeRow } from "./helpers";
import {
  MobileInput,
  MobileSelect,
  Field,
  CollapsibleSection,
  RowDelete,
  EmptyState,
  GroupHeading,
} from "./form-ui";

interface Props {
  employees: { id: string; name: string }[];
  addlWorkRows: AddlWorkRow[];
  setAddlWorkRows: React.Dispatch<React.SetStateAction<AddlWorkRow[]>>;
  addlCrewRows: AddlCrewRow[];
  setAddlCrewRows: React.Dispatch<React.SetStateAction<AddlCrewRow[]>>;
  addlMaterialRows: AddlMaterialRow[];
  setAddlMaterialRows: React.Dispatch<React.SetStateAction<AddlMaterialRow[]>>;
  addlOutsourcedRows: AddlOutsourcedRow[];
  setAddlOutsourcedRows: React.Dispatch<React.SetStateAction<AddlOutsourcedRow[]>>;
}

export function AdditionalWorkSection({
  employees,
  addlWorkRows,
  setAddlWorkRows,
  addlCrewRows,
  setAddlCrewRows,
  addlMaterialRows,
  setAddlMaterialRows,
  addlOutsourcedRows,
  setAddlOutsourcedRows,
}: Props) {
  return (
    <>
      <GroupHeading>Approved / Additional Work</GroupHeading>

      <CollapsibleSection title="1/4 — Work Description" count={addlWorkRows.length}>
        <Button type="button" variant="outline" onClick={() =>
          setAddlWorkRows((p) => [...p, { number: "", date: todayLocal(), status: "", typeOfWork: "" }])
        } className="w-full h-10 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
        {addlWorkRows.length === 0 && <EmptyState text="No additional work." />}
        {addlWorkRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setAddlWorkRows, i)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Number">
                <MobileInput value={row.number} onChange={(e) => updateRow(setAddlWorkRows, i, "number", e.target.value)} />
              </Field>
              <Field label="Date">
                <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setAddlWorkRows, i, "date", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Status">
                <MobileInput value={row.status} onChange={(e) => updateRow(setAddlWorkRows, i, "status", e.target.value)} />
              </Field>
              <Field label="Type of Work">
                <MobileInput value={row.typeOfWork} onChange={(e) => updateRow(setAddlWorkRows, i, "typeOfWork", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="2/4 — Crew Details" count={addlCrewRows.length}>
        <Button type="button" variant="outline" onClick={() =>
          setAddlCrewRows((p) => [...p, { number: "", date: todayLocal(), employeeId: "", jobHours: "", deliveryHours: "" }])
        } className="w-full h-10 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
        {addlCrewRows.length === 0 && <EmptyState text="No crew entries." />}
        {addlCrewRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setAddlCrewRows, i)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Number">
                <MobileInput value={row.number} onChange={(e) => updateRow(setAddlCrewRows, i, "number", e.target.value)} />
              </Field>
              <Field label="Date">
                <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setAddlCrewRows, i, "date", e.target.value)} />
              </Field>
            </div>
            <Field label="Employee">
              <MobileSelect value={row.employeeId} onChange={(v) => updateRow(setAddlCrewRows, i, "employeeId", v)}>
                <option value="">Select...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </MobileSelect>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Job Hours">
                <MobileInput type="number" step="0.01" value={row.jobHours} onChange={(e) => updateRow(setAddlCrewRows, i, "jobHours", e.target.value)} />
              </Field>
              <Field label="Delivery Hrs">
                <MobileInput type="number" step="0.01" value={row.deliveryHours} onChange={(e) => updateRow(setAddlCrewRows, i, "deliveryHours", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="3/4 — MCC Materials" count={addlMaterialRows.length}>
        <Button type="button" variant="outline" onClick={() =>
          setAddlMaterialRows((p) => [...p, { material: "", qty: "", units: "" }])
        } className="w-full h-10 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
        {addlMaterialRows.length === 0 && <EmptyState text="No materials." />}
        {addlMaterialRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setAddlMaterialRows, i)} />
            </div>
            <Field label="Material">
              <MobileInput value={row.material} onChange={(e) => updateRow(setAddlMaterialRows, i, "material", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="QTY">
                <MobileInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setAddlMaterialRows, i, "qty", e.target.value)} />
              </Field>
              <Field label="Units">
                <MobileInput value={row.units} onChange={(e) => updateRow(setAddlMaterialRows, i, "units", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="4/4 — Outsourced Materials" count={addlOutsourcedRows.length}>
        <Button type="button" variant="outline" onClick={() =>
          setAddlOutsourcedRows((p) => [...p, { supplier: "", material: "", qty: "", units: "", cost: "", perUnitCost: "" }])
        } className="w-full h-10 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
        {addlOutsourcedRows.length === 0 && <EmptyState text="No outsourced materials." />}
        {addlOutsourcedRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setAddlOutsourcedRows, i)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Supplier">
                <MobileInput value={row.supplier} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "supplier", e.target.value)} />
              </Field>
              <Field label="Material">
                <MobileInput value={row.material} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "material", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="QTY">
                <MobileInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "qty", e.target.value)} />
              </Field>
              <Field label="Units">
                <MobileInput value={row.units} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "units", e.target.value)} />
              </Field>
              <Field label="Cost">
                <MobileInput type="number" step="0.01" value={row.cost} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "cost", e.target.value)} />
              </Field>
              <Field label="Per Unit">
                <MobileInput type="number" step="0.01" value={row.perUnitCost} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "perUnitCost", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </CollapsibleSection>
    </>
  );
}
