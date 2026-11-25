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
  DenseTable,
  TableInput,
  TableSelect,
  TableRowDelete,
  TableAddRow,
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
        <div className="sm:hidden space-y-3">
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
        </div>

        <div>
          <DenseTable columns={["Number", "Date", "Status", "Type of Work"]}>
            {addlWorkRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 w-20">
                  <TableInput value={row.number} onChange={(e) => updateRow(setAddlWorkRows, i, "number", e.target.value)} />
                </td>
                <td className="p-0.5 w-36">
                  <TableInput type="date" value={row.date} onChange={(e) => updateRow(setAddlWorkRows, i, "date", e.target.value)} />
                </td>
                <td className="p-0.5 w-28">
                  <TableInput value={row.status} onChange={(e) => updateRow(setAddlWorkRows, i, "status", e.target.value)} />
                </td>
                <td className="p-0.5 min-w-[140px]">
                  <TableInput value={row.typeOfWork} onChange={(e) => updateRow(setAddlWorkRows, i, "typeOfWork", e.target.value)} />
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setAddlWorkRows, i)} />
                </td>
              </tr>
            ))}
            {addlWorkRows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-sm text-muted-foreground">
                  No additional work.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow
            label="Add"
            onClick={() => setAddlWorkRows((p) => [...p, { number: "", date: todayLocal(), status: "", typeOfWork: "" }])}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="2/4 — Crew Details" count={addlCrewRows.length}>
        <div className="sm:hidden space-y-3">
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
        </div>

        <div>
          <DenseTable columns={["Number", "Date", "Employee", "Job Hours", "Delivery Hrs"]}>
            {addlCrewRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 w-20">
                  <TableInput value={row.number} onChange={(e) => updateRow(setAddlCrewRows, i, "number", e.target.value)} />
                </td>
                <td className="p-0.5 w-36">
                  <TableInput type="date" value={row.date} onChange={(e) => updateRow(setAddlCrewRows, i, "date", e.target.value)} />
                </td>
                <td className="p-0.5 min-w-[140px]">
                  <TableSelect value={row.employeeId} onChange={(v) => updateRow(setAddlCrewRows, i, "employeeId", v)}>
                    <option value="">Select...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </TableSelect>
                </td>
                <td className="p-0.5 w-24">
                  <TableInput type="number" step="0.01" value={row.jobHours} onChange={(e) => updateRow(setAddlCrewRows, i, "jobHours", e.target.value)} />
                </td>
                <td className="p-0.5 w-24">
                  <TableInput type="number" step="0.01" value={row.deliveryHours} onChange={(e) => updateRow(setAddlCrewRows, i, "deliveryHours", e.target.value)} />
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setAddlCrewRows, i)} />
                </td>
              </tr>
            ))}
            {addlCrewRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-sm text-muted-foreground">
                  No crew entries.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow
            label="Add"
            onClick={() => setAddlCrewRows((p) => [...p, { number: "", date: todayLocal(), employeeId: "", jobHours: "", deliveryHours: "" }])}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="3/4 — MCC Materials" count={addlMaterialRows.length}>
        <div className="sm:hidden space-y-3">
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
        </div>

        <div>
          <DenseTable columns={["Material", "QTY", "Units"]}>
            {addlMaterialRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 min-w-[160px]">
                  <TableInput value={row.material} onChange={(e) => updateRow(setAddlMaterialRows, i, "material", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setAddlMaterialRows, i, "qty", e.target.value)} />
                </td>
                <td className="p-0.5 w-24">
                  <TableInput value={row.units} onChange={(e) => updateRow(setAddlMaterialRows, i, "units", e.target.value)} />
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setAddlMaterialRows, i)} />
                </td>
              </tr>
            ))}
            {addlMaterialRows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-sm text-muted-foreground">
                  No materials.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow label="Add" onClick={() => setAddlMaterialRows((p) => [...p, { material: "", qty: "", units: "" }])} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="4/4 — Outsourced Materials" count={addlOutsourcedRows.length}>
        <div className="sm:hidden space-y-3">
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
        </div>

        <div>
          <DenseTable columns={["Supplier", "Material", "QTY", "Units", "Cost", "Per Unit"]}>
            {addlOutsourcedRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 min-w-[120px]">
                  <TableInput value={row.supplier} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "supplier", e.target.value)} />
                </td>
                <td className="p-0.5 min-w-[140px]">
                  <TableInput value={row.material} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "material", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "qty", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableInput value={row.units} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "units", e.target.value)} />
                </td>
                <td className="p-0.5 w-24">
                  <TableInput type="number" step="0.01" value={row.cost} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "cost", e.target.value)} />
                </td>
                <td className="p-0.5 w-24">
                  <TableInput type="number" step="0.01" value={row.perUnitCost} onChange={(e) => updateRow(setAddlOutsourcedRows, i, "perUnitCost", e.target.value)} />
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setAddlOutsourcedRows, i)} />
                </td>
              </tr>
            ))}
            {addlOutsourcedRows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-sm text-muted-foreground">
                  No outsourced materials.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow
            label="Add"
            onClick={() =>
              setAddlOutsourcedRows((p) => [...p, { supplier: "", material: "", qty: "", units: "", cost: "", perUnitCost: "" }])
            }
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
