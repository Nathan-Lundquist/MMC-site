"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
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
          onClick={() =>
            setCrewRows((p) => [...p, { date: todayLocal(), employeeIds: [], jobHours: "", setupHours: "", travelHours: "", unloadHours: "", deliveryHours: "" }])
          }
          className="w-full h-12 text-sm font-medium gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Crew Entry
        </Button>

        {crewRows.length === 0 && <EmptyState text="Add an entry per day — select the crew and enter hours." />}

        {crewRows.map((row, i) => (
          <CrewRowCard key={i} index={i} row={row} employees={employees} setCrewRows={setCrewRows} />
        ))}
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

function CrewRowCard({
  index: i,
  row,
  employees,
  setCrewRows,
}: {
  index: number;
  row: CrewRow;
  employees: { id: string; name: string }[];
  setCrewRows: React.Dispatch<React.SetStateAction<CrewRow[]>>;
}) {
  const selectedNames = employees
    .filter((e) => row.employeeIds.includes(e.id))
    .map((e) => e.name);
  const totalHrs = [row.jobHours, row.setupHours, row.travelHours, row.unloadHours, row.deliveryHours]
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  function toggleEmployee(empId: string) {
    setCrewRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const ids = r.employeeIds.includes(empId)
          ? r.employeeIds.filter((id) => id !== empId)
          : [...r.employeeIds, empId];
        return { ...r, employeeIds: ids };
      })
    );
  }

  function selectAll() {
    setCrewRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, employeeIds: employees.map((e) => e.id) } : r
      )
    );
  }

  function selectNone() {
    setCrewRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, employeeIds: [] } : r
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
          {selectedNames.length > 0 && (
            <span className="text-[11px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
              {selectedNames.length} employee{selectedNames.length !== 1 && "s"}
            </span>
          )}
          {totalHrs > 0 && (
            <span className="text-[11px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {totalHrs.toFixed(1)}h each
            </span>
          )}
        </div>
        <RowDelete onClick={() => removeRow(setCrewRows, i)} />
      </div>

      <Field label="Date" action={<TodayBtn onClick={() => updateRow(setCrewRows, i, "date", todayLocal())} />}>
        <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setCrewRows, i, "date", e.target.value)} />
      </Field>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Employees</Label>
          <div className="flex gap-1">
            <button type="button" onClick={selectAll} className="text-[11px] text-brand hover:underline px-1">All</button>
            <span className="text-[11px] text-muted-foreground">/</span>
            <button type="button" onClick={selectNone} className="text-[11px] text-muted-foreground hover:underline px-1">None</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
          {employees.map((emp) => {
            const checked = row.employeeIds.includes(emp.id);
            return (
              <label
                key={emp.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors active:bg-secondary/60 ${
                  checked ? "bg-brand/5 border border-brand/20" : "bg-secondary/30 border border-transparent"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleEmployee(emp.id)}
                />
                <span className="text-sm">{emp.name}</span>
              </label>
            );
          })}
        </div>
        {selectedNames.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedNames.join(", ")}
          </p>
        )}
      </div>

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
    </div>
  );
}
