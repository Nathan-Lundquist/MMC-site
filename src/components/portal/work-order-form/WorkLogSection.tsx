"use client";

import { Card } from "@/components/ui/card";
import type { DebrisRow, WeedingRow, HourlyRow } from "./types";
import { todayLocal, updateRow, removeRow } from "./helpers";
import {
  MobileInput,
  MobileSelect,
  Field,
  SectionHeader,
  TodayBtn,
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
  debrisRows: DebrisRow[];
  setDebrisRows: React.Dispatch<React.SetStateAction<DebrisRow[]>>;
  weedingRows: WeedingRow[];
  setWeedingRows: React.Dispatch<React.SetStateAction<WeedingRow[]>>;
  hourlyRows: HourlyRow[];
  setHourlyRows: React.Dispatch<React.SetStateAction<HourlyRow[]>>;
}

export function WorkLogSection({
  debrisRows,
  setDebrisRows,
  weedingRows,
  setWeedingRows,
  hourlyRows,
  setHourlyRows,
}: Props) {
  return (
    <>
      <GroupHeading>Work Log</GroupHeading>

      {/* Debris */}
      <Card className="p-4 space-y-3">
        <SectionHeader title="Debris" count={debrisRows.length} onAdd={() =>
          setDebrisRows((p) => [...p, { date: todayLocal(), amountYards: "", type: "" }])
        } />

        <div className="sm:hidden space-y-3">
          {debrisRows.length === 0 && <EmptyState text="No debris logged." />}
          {debrisRows.map((row, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-end">
                <RowDelete onClick={() => removeRow(setDebrisRows, i)} />
              </div>
              <Field label="Date" action={<TodayBtn onClick={() => updateRow(setDebrisRows, i, "date", todayLocal())} />}>
                <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setDebrisRows, i, "date", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (Yards)">
                  <MobileInput type="number" step="0.01" value={row.amountYards} onChange={(e) => updateRow(setDebrisRows, i, "amountYards", e.target.value)} />
                </Field>
                <Field label="Type">
                  <MobileInput value={row.type} onChange={(e) => updateRow(setDebrisRows, i, "type", e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div>
          <DenseTable columns={["Date", "Amount (Yards)", "Type"]}>
            {debrisRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 w-36">
                  <TableInput type="date" value={row.date} onChange={(e) => updateRow(setDebrisRows, i, "date", e.target.value)} />
                </td>
                <td className="p-0.5 w-28">
                  <TableInput type="number" step="0.01" value={row.amountYards} onChange={(e) => updateRow(setDebrisRows, i, "amountYards", e.target.value)} />
                </td>
                <td className="p-0.5">
                  <TableInput value={row.type} onChange={(e) => updateRow(setDebrisRows, i, "type", e.target.value)} />
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setDebrisRows, i)} />
                </td>
              </tr>
            ))}
            {debrisRows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-sm text-muted-foreground">
                  No debris logged.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow label="Add Debris" onClick={() => setDebrisRows((p) => [...p, { date: todayLocal(), amountYards: "", type: "" }])} />
        </div>
      </Card>

      {/* Weeding */}
      <Card className="p-4 space-y-3">
        <SectionHeader title="Weeding / Bed Maintenance" count={weedingRows.length} onAdd={() =>
          setWeedingRows((p) => [...p, { date: todayLocal(), numEmployees: "", timeValue: "", timeUnit: "HOURS" }])
        } />

        <div className="sm:hidden space-y-3">
          {weedingRows.length === 0 && <EmptyState text="No weeding entries." />}
          {weedingRows.map((row, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-end">
                <RowDelete onClick={() => removeRow(setWeedingRows, i)} />
              </div>
              <Field label="Date" action={<TodayBtn onClick={() => updateRow(setWeedingRows, i, "date", todayLocal())} />}>
                <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setWeedingRows, i, "date", e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="# Employees">
                  <MobileInput type="number" value={row.numEmployees} onChange={(e) => updateRow(setWeedingRows, i, "numEmployees", e.target.value)} />
                </Field>
                <Field label="Time">
                  <MobileInput type="number" step="0.01" value={row.timeValue} onChange={(e) => updateRow(setWeedingRows, i, "timeValue", e.target.value)} />
                </Field>
                <Field label="Unit">
                  <MobileSelect value={row.timeUnit} onChange={(v) => updateRow(setWeedingRows, i, "timeUnit", v as "HOURS" | "MINUTES")}>
                    <option value="HOURS">Hrs</option>
                    <option value="MINUTES">Min</option>
                  </MobileSelect>
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div>
          <DenseTable columns={["Date", "# Employees", "Time", "Unit"]}>
            {weedingRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 w-36">
                  <TableInput type="date" value={row.date} onChange={(e) => updateRow(setWeedingRows, i, "date", e.target.value)} />
                </td>
                <td className="p-0.5 w-24">
                  <TableInput type="number" value={row.numEmployees} onChange={(e) => updateRow(setWeedingRows, i, "numEmployees", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableInput type="number" step="0.01" value={row.timeValue} onChange={(e) => updateRow(setWeedingRows, i, "timeValue", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableSelect value={row.timeUnit} onChange={(v) => updateRow(setWeedingRows, i, "timeUnit", v as "HOURS" | "MINUTES")}>
                    <option value="HOURS">Hrs</option>
                    <option value="MINUTES">Min</option>
                  </TableSelect>
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setWeedingRows, i)} />
                </td>
              </tr>
            ))}
            {weedingRows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-sm text-muted-foreground">
                  No weeding entries.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow
            label="Add Entry"
            onClick={() => setWeedingRows((p) => [...p, { date: todayLocal(), numEmployees: "", timeValue: "", timeUnit: "HOURS" }])}
          />
        </div>
      </Card>

      {/* Hourly Work */}
      <Card className="p-4 space-y-3">
        <SectionHeader title="Hourly Work" count={hourlyRows.length} onAdd={() =>
          setHourlyRows((p) => [...p, { date: todayLocal(), typeOfWork: "", numEmployees: "", timeValue: "", timeUnit: "HOURS" }])
        } />

        <div className="sm:hidden space-y-3">
          {hourlyRows.length === 0 && <EmptyState text="No hourly work entries." />}
          {hourlyRows.map((row, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-end">
                <RowDelete onClick={() => removeRow(setHourlyRows, i)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date" action={<TodayBtn onClick={() => updateRow(setHourlyRows, i, "date", todayLocal())} />}>
                  <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setHourlyRows, i, "date", e.target.value)} />
                </Field>
                <Field label="Type of Work">
                  <MobileInput value={row.typeOfWork} onChange={(e) => updateRow(setHourlyRows, i, "typeOfWork", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="# Employees">
                  <MobileInput type="number" value={row.numEmployees} onChange={(e) => updateRow(setHourlyRows, i, "numEmployees", e.target.value)} />
                </Field>
                <Field label="Time">
                  <MobileInput type="number" step="0.01" value={row.timeValue} onChange={(e) => updateRow(setHourlyRows, i, "timeValue", e.target.value)} />
                </Field>
                <Field label="Unit">
                  <MobileSelect value={row.timeUnit} onChange={(v) => updateRow(setHourlyRows, i, "timeUnit", v as "HOURS" | "MINUTES")}>
                    <option value="HOURS">Hrs</option>
                    <option value="MINUTES">Min</option>
                  </MobileSelect>
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div>
          <DenseTable columns={["Date", "Type of Work", "# Employees", "Time", "Unit"]}>
            {hourlyRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 w-36">
                  <TableInput type="date" value={row.date} onChange={(e) => updateRow(setHourlyRows, i, "date", e.target.value)} />
                </td>
                <td className="p-0.5 min-w-[140px]">
                  <TableInput value={row.typeOfWork} onChange={(e) => updateRow(setHourlyRows, i, "typeOfWork", e.target.value)} />
                </td>
                <td className="p-0.5 w-24">
                  <TableInput type="number" value={row.numEmployees} onChange={(e) => updateRow(setHourlyRows, i, "numEmployees", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableInput type="number" step="0.01" value={row.timeValue} onChange={(e) => updateRow(setHourlyRows, i, "timeValue", e.target.value)} />
                </td>
                <td className="p-0.5 w-20">
                  <TableSelect value={row.timeUnit} onChange={(v) => updateRow(setHourlyRows, i, "timeUnit", v as "HOURS" | "MINUTES")}>
                    <option value="HOURS">Hrs</option>
                    <option value="MINUTES">Min</option>
                  </TableSelect>
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setHourlyRows, i)} />
                </td>
              </tr>
            ))}
            {hourlyRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-sm text-muted-foreground">
                  No hourly work entries.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow
            label="Add Entry"
            onClick={() => setHourlyRows((p) => [...p, { date: todayLocal(), typeOfWork: "", numEmployees: "", timeValue: "", timeUnit: "HOURS" }])}
          />
        </div>
      </Card>
    </>
  );
}
