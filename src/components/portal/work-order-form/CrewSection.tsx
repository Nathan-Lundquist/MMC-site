"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, Check, Pencil } from "lucide-react";
import type { CrewRow, MachineRow } from "./types";
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
    setCrewRows((p) => [...p, { date: todayLocal(), employeeIds: [], jobHours: "", setupHours: "", travelHours: "", unloadHours: "", deliveryHours: "" }]);
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

        {crewRows.length === 0 && <EmptyState text="Add an entry per day — select the crew and enter hours." />}

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

function crewRowTotalHrs(row: CrewRow) {
  return [row.jobHours, row.setupHours, row.travelHours, row.unloadHours, row.deliveryHours].reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
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
  const selectedNames = employees.filter((e) => row.employeeIds.includes(e.id)).map((e) => e.name);
  const totalHrs = crewRowTotalHrs(row);
  const peopleCount = row.employeeIds.length || 1;

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
          {selectedNames.length > 0 ? selectedNames.join(", ") : "No crew selected"}
        </span>
        {totalHrs > 0 && (
          <span className="text-[11px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded shrink-0">
            {(totalHrs * peopleCount).toFixed(1)} man-hrs
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
  const selectedNames = employees
    .filter((e) => row.employeeIds.includes(e.id))
    .map((e) => e.name);
  const totalHrs = crewRowTotalHrs(row);
  const peopleCount = row.employeeIds.length || 1;
  const available = employees.filter((e) => !row.employeeIds.includes(e.id));

  function addEmployee(empId: string) {
    setCrewRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, employeeIds: [...r.employeeIds, empId] } : r))
    );
  }

  function removeEmployee(empId: string) {
    setCrewRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, employeeIds: r.employeeIds.filter((id) => id !== empId) } : r
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
              {totalHrs.toFixed(1)}h each &times; {peopleCount} = {(totalHrs * peopleCount).toFixed(1)} man-hrs
            </span>
          )}
        </div>
        <RowDelete onClick={onDelete} />
      </div>

      <Field label="Date" action={<TodayBtn onClick={() => updateRow(setCrewRows, i, "date", todayLocal())} />}>
        <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setCrewRows, i, "date", e.target.value)} />
      </Field>

      <Field label="Employees">
        <div className="flex flex-wrap gap-1.5">
          {selectedNames.map((name, idx) => {
            const empId = row.employeeIds[idx];
            return (
              <span
                key={empId}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeEmployee(empId)}
                  className="p-0.5 rounded-full hover:bg-brand/20"
                  title={`Remove ${name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {available.length > 0 && (
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <MobileSelect value="" onChange={(v) => v && addEmployee(v)}>
                <option value="">+ Add employee...</option>
                {available.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </MobileSelect>
            </div>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Job Hrs">
          <MobileInput type="number" inputMode="decimal" step="0.25" value={row.jobHours} onChange={(e) => updateRow(setCrewRows, i, "jobHours", e.target.value)} />
        </Field>
        <Field label="Setup Hrs">
          <MobileInput type="number" inputMode="decimal" step="0.25" value={row.setupHours} onChange={(e) => updateRow(setCrewRows, i, "setupHours", e.target.value)} />
        </Field>
        <Field label="Travel Hrs">
          <MobileInput type="number" inputMode="decimal" step="0.25" value={row.travelHours} onChange={(e) => updateRow(setCrewRows, i, "travelHours", e.target.value)} />
        </Field>
        <Field label="Unload Hrs">
          <MobileInput type="number" inputMode="decimal" step="0.25" value={row.unloadHours} onChange={(e) => updateRow(setCrewRows, i, "unloadHours", e.target.value)} />
        </Field>
        <Field label="Delivery Hrs">
          <MobileInput type="number" inputMode="decimal" step="0.25" value={row.deliveryHours} onChange={(e) => updateRow(setCrewRows, i, "deliveryHours", e.target.value)} />
        </Field>
      </div>

      <Button type="button" variant="outline" onClick={onSave} className="w-full h-10 text-sm font-medium gap-2">
        <Check className="w-4 h-4" />
        Save Entry
      </Button>
    </div>
  );
}
