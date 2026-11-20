"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, Check, Pencil } from "lucide-react";
import type { CrewRow, CrewEmployeeHours, MachineRow } from "./types";
import { todayLocal, fmtDate, updateRow, removeRow } from "./helpers";
import {
  MobileInput,
  MobileSelect,
  Field,
  SectionHeader,
  TodayBtn,
  RowDelete,
  EmptyState,
  GroupHeading,
} from "./form-ui";

interface Props {
  employees: { id: string; name: string }[];
  crewRows: CrewRow[];
  setCrewRows: React.Dispatch<React.SetStateAction<CrewRow[]>>;
  machineRows: MachineRow[];
  setMachineRows: React.Dispatch<React.SetStateAction<MachineRow[]>>;
}

function employeeTotalHrs(emp: CrewEmployeeHours) {
  return [emp.jobHours, emp.setupHours, emp.travelHours, emp.unloadHours, emp.deliveryHours].reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
}

function entryTotalHrs(row: CrewRow) {
  return row.employees.reduce((sum, emp) => sum + employeeTotalHrs(emp), 0);
}

export function CrewSection({
  employees,
  crewRows,
  setCrewRows,
  machineRows,
  setMachineRows,
}: Props) {
  // Rows start expanded; "Save" on a row collapses it to a compact summary
  // line so a long crew list doesn't require scrolling past a wall of open
  // cards to add the next entry.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  function addRow() {
    setCrewRows((p) => [...p, { date: todayLocal(), employees: [] }]);
  }

  function collapse(i: number) {
    setCollapsed((prev) => new Set(prev).add(i));
  }

  function expand(i: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  }

  function deleteRow(i: number) {
    removeRow(setCrewRows, i);
    // Index-based collapse state can't be remapped reliably across a
    // delete, so just reset it — every remaining row re-expands.
    setCollapsed(new Set());
  }

  return (
    <>
      <GroupHeading>Crew &amp; Equipment</GroupHeading>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Crew Details</h3>
            {crewRows.length > 0 && (
              <span className="text-[10px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
                {crewRows.length}
              </span>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="w-full h-12 text-sm font-medium gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Crew Entry
        </Button>

        {crewRows.length === 0 && <EmptyState text="Add an entry per day — add each crew member and their own hours." />}

        {crewRows.map((row, i) =>
          collapsed.has(i) ? (
            <CrewRowSummary key={i} row={row} employees={employees} onEdit={() => expand(i)} onDelete={() => deleteRow(i)} />
          ) : (
            <CrewRowCard
              key={i}
              index={i}
              row={row}
              employees={employees}
              setCrewRows={setCrewRows}
              onSave={() => collapse(i)}
              onDelete={() => deleteRow(i)}
            />
          )
        )}

        <EmployeeHoursTotals crewRows={crewRows} employees={employees} />
      </Card>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Machines" count={machineRows.length} onAdd={() =>
          setMachineRows((p) => [...p, { vehicleInfo: "", hours: "" }])
        } />
        {machineRows.length === 0 && <EmptyState text="No machines logged." />}
        {machineRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setMachineRows, i)} />
            </div>
            <Field label="Vehicle / Machine">
              <MobileInput value={row.vehicleInfo} onChange={(e) => updateRow(setMachineRows, i, "vehicleInfo", e.target.value)} />
            </Field>
            <Field label="Hours">
              <MobileInput type="number" step="0.01" value={row.hours} onChange={(e) => updateRow(setMachineRows, i, "hours", e.target.value)} />
            </Field>
          </div>
        ))}
      </Card>
    </>
  );
}

/** Live running total of hours per employee, across every crew entry on this job. */
function EmployeeHoursTotals({
  crewRows,
  employees,
}: {
  crewRows: CrewRow[];
  employees: { id: string; name: string }[];
}) {
  const totals = new Map<string, number>();
  for (const row of crewRows) {
    for (const emp of row.employees) {
      if (!emp.employeeId) continue;
      totals.set(emp.employeeId, (totals.get(emp.employeeId) || 0) + employeeTotalHrs(emp));
    }
  }

  if (totals.size === 0) return null;

  const sorted = [...totals.entries()]
    .map(([employeeId, hours]) => ({
      name: employees.find((e) => e.id === employeeId)?.name || "Unknown",
      hours,
    }))
    .sort((a, b) => b.hours - a.hours);

  return (
    <div className="pt-1 border-t border-border">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-2">
        Hours by Employee
      </h4>
      <div className="space-y-1">
        {sorted.map((e) => (
          <div key={e.name} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{e.name}</span>
            <span className="font-medium tabular-nums text-foreground">{e.hours.toFixed(2)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact read-only line shown once a crew entry is saved/collapsed. */
function CrewRowSummary({
  row,
  employees,
  onEdit,
  onDelete,
}: {
  row: CrewRow;
  employees: { id: string; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const names = row.employees.map(
    (emp) => employees.find((e) => e.id === emp.employeeId)?.name || "—"
  );
  const totalHrs = entryTotalHrs(row);

  return (
    <div className="w-full flex items-center justify-between gap-2 p-3 border border-border rounded-lg hover:bg-secondary/30 transition-colors">
      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 flex items-center gap-2 flex-wrap text-left"
      >
        <span className="text-sm font-medium text-foreground">
          {row.date ? fmtDate(row.date) : "No date"}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {names.length > 0 ? names.join(", ") : "No crew selected"}
        </span>
        {totalHrs > 0 && (
          <span className="text-[11px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded shrink-0">
            {totalHrs.toFixed(1)} man-hrs
          </span>
        )}
      </button>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={onEdit} title="Edit" className="p-2 text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <RowDelete onClick={onDelete} />
      </div>
    </div>
  );
}

const BLANK_HOURS = { jobHours: "", setupHours: "", travelHours: "", unloadHours: "", deliveryHours: "" };

function CrewRowCard({
  index: i,
  row,
  employees,
  setCrewRows,
  onSave,
  onDelete,
}: {
  index: number;
  row: CrewRow;
  employees: { id: string; name: string }[];
  setCrewRows: React.Dispatch<React.SetStateAction<CrewRow[]>>;
  onSave: () => void;
  onDelete: () => void;
}) {
  const totalHrs = entryTotalHrs(row);
  const selectedIds = row.employees.map((e) => e.employeeId);
  const available = employees.filter((e) => !selectedIds.includes(e.id));

  function addEmployee(empId: string) {
    setCrewRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, employees: [...r.employees, { employeeId: empId, ...BLANK_HOURS }] } : r
      )
    );
  }

  function removeEmployee(empIdx: number) {
    setCrewRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, employees: r.employees.filter((_, eIdx) => eIdx !== empIdx) } : r
      )
    );
  }

  function updateEmployeeHours(empIdx: number, field: keyof CrewEmployeeHours, value: string) {
    setCrewRows((prev) =>
      prev.map((r, idx) =>
        idx === i
          ? {
              ...r,
              employees: r.employees.map((emp, eIdx) =>
                eIdx === empIdx ? { ...emp, [field]: value } : emp
              ),
            }
          : r
      )
    );
  }

  return (
    <div className="p-3 border border-border rounded-lg space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {row.date ? fmtDate(row.date) : `Entry ${i + 1}`}
          </span>
          {totalHrs > 0 && (
            <span className="text-[11px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {totalHrs.toFixed(1)} man-hrs
            </span>
          )}
        </div>
        <RowDelete onClick={onDelete} />
      </div>

      <Field label="Date" action={<TodayBtn onClick={() => updateRow(setCrewRows, i, "date", todayLocal())} />}>
        <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setCrewRows, i, "date", e.target.value)} />
      </Field>

      <div className="space-y-2">
        {row.employees.map((emp, eIdx) => {
          const name = employees.find((e) => e.id === emp.employeeId)?.name || "Unknown";
          const empTotal = employeeTotalHrs(emp);
          return (
            <div key={eIdx} className="p-2.5 border border-border rounded-md bg-secondary/20 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{name}</span>
                <div className="flex items-center gap-2">
                  {empTotal > 0 && (
                    <span className="text-[11px] text-muted-foreground">{empTotal.toFixed(2)}h</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeEmployee(eIdx)}
                    className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title={`Remove ${name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <Field label="Job">
                  <MobileInput
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    value={emp.jobHours}
                    onChange={(e) => updateEmployeeHours(eIdx, "jobHours", e.target.value)}
                  />
                </Field>
                <Field label="Setup">
                  <MobileInput
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    value={emp.setupHours}
                    onChange={(e) => updateEmployeeHours(eIdx, "setupHours", e.target.value)}
                  />
                </Field>
                <Field label="Travel">
                  <MobileInput
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    value={emp.travelHours}
                    onChange={(e) => updateEmployeeHours(eIdx, "travelHours", e.target.value)}
                  />
                </Field>
                <Field label="Unload">
                  <MobileInput
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    value={emp.unloadHours}
                    onChange={(e) => updateEmployeeHours(eIdx, "unloadHours", e.target.value)}
                  />
                </Field>
                <Field label="Delivery">
                  <MobileInput
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    value={emp.deliveryHours}
                    onChange={(e) => updateEmployeeHours(eIdx, "deliveryHours", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      {available.length > 0 && (
        <MobileSelect value="" onChange={(v) => v && addEmployee(v)}>
          <option value="">+ Add employee...</option>
          {available.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </MobileSelect>
      )}

      <Button type="button" variant="outline" onClick={onSave} className="w-full h-10 text-sm font-medium gap-2">
        <Check className="w-4 h-4" />
        Save Entry
      </Button>
    </div>
  );
}
