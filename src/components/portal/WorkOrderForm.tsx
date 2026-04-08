"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────── */

interface TimeRow {
  date: string;
  startTime: string;
  endTime: string;
}
interface PaymentRow {
  date: string;
  checkNumber: string;
  amount: string;
}
interface MachineRow {
  vehicleInfo: string;
  hours: string;
}
interface CrewRow {
  date: string;
  employeeIds: string[];
  jobHours: string;
  setupHours: string;
  travelHours: string;
  unloadHours: string;
  deliveryHours: string;
}
interface DebrisRow {
  date: string;
  amountYards: string;
  type: string;
}
interface WeedingRow {
  date: string;
  numEmployees: string;
  timeValue: string;
  timeUnit: "HOURS" | "MINUTES";
}
interface HourlyRow {
  date: string;
  typeOfWork: string;
  numEmployees: string;
  timeValue: string;
  timeUnit: "HOURS" | "MINUTES";
}
interface MaterialRow {
  material: string;
  qty: string;
  units: string;
}
interface OutsourcedRow {
  supplier: string;
  material: string;
  qty: string;
  unit: string;
  cost: string;
  perUnitCost: string;
  taxIncluded: boolean;
}
interface AddlWorkRow {
  number: string;
  date: string;
  status: string;
  typeOfWork: string;
}
interface AddlCrewRow {
  number: string;
  date: string;
  employeeId: string;
  jobHours: string;
  deliveryHours: string;
}
interface AddlMaterialRow {
  material: string;
  qty: string;
  units: string;
}
interface AddlOutsourcedRow {
  supplier: string;
  material: string;
  qty: string;
  units: string;
  cost: string;
  perUnitCost: string;
}

export interface WorkOrderInitialData {
  id: string;
  customerId: string;
  jobType: string;
  foremanId: string | null;
  woNumber: string;
  pctComplete: string;
  totalHours: string;
  notes: string;
  materialsNotUsed: string;
  timeRows: TimeRow[];
  paymentRows: PaymentRow[];
  machineRows: MachineRow[];
  crewRows: CrewRow[];
  debrisRows: DebrisRow[];
  weedingRows: WeedingRow[];
  hourlyRows: HourlyRow[];
  materialRows: MaterialRow[];
  outsourcedRows: OutsourcedRow[];
  addlWorkRows: AddlWorkRow[];
  addlCrewRows: AddlCrewRow[];
  addlMaterialRows: AddlMaterialRow[];
  addlOutsourcedRows: AddlOutsourcedRow[];
}

interface Props {
  customers: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  initialData?: WorkOrderInitialData;
}

/* ── Helpers ──────────────────────────────────────────── */

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function summarizeDays(rows: TimeRow[]) {
  const dates = rows.map((r) => r.date).filter(Boolean);
  if (dates.length === 0) return null;
  const unique = [...new Set(dates)].sort();
  return { uniqueDays: unique.length, first: unique[0], last: unique[unique.length - 1] };
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Reusable mobile-first UI ─────────────────────────── */

/** Full-width select with proper mobile sizing */
function MobileSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base sm:text-sm sm:h-9"
    >
      {children}
    </select>
  );
}

/** Mobile-friendly input — taller on phone */
function MobileInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-11 text-base sm:h-9 sm:text-sm ${props.className || ""}`}
    />
  );
}

function SectionHeader({
  title,
  onAdd,
  addLabel,
  count,
}: {
  title: string;
  onAdd: () => void;
  addLabel?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="font-display text-sm font-semibold text-foreground truncate">
          {title}
        </h3>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full shrink-0">
            {count}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="gap-1.5 text-xs shrink-0 h-9"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel || "Add"}
      </Button>
    </div>
  );
}

function RowDelete({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors w-10 h-10 rounded-md shrink-0"
      title="Remove"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function NowBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
    >
      <Clock className="w-3.5 h-3.5" />
      Now
    </Button>
  );
}

function TodayBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
    >
      <CalendarDays className="w-3.5 h-3.5" />
      Today
    </Button>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-base font-bold text-foreground pt-2">
      {children}
    </h2>
  );
}

function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(count > 0);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left active:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-display text-sm font-semibold text-foreground">
            {title}
          </span>
          {count > 0 && (
            <span className="text-[10px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-1">{text}</p>;
}

/** Field wrapper */
function Field({
  label,
  action,
  children,
  className,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN FORM
   ═══════════════════════════════════════════════════════ */

export function WorkOrderForm({ customers, employees, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [jobType, setJobType] = useState(initialData?.jobType || "");
  const [foremanId, setForemanId] = useState(initialData?.foremanId || "");
  const [woNumber, setWoNumber] = useState(initialData?.woNumber || "");
  const [pctComplete, setPctComplete] = useState(initialData?.pctComplete || "0");
  const [totalHours, setTotalHours] = useState(initialData?.totalHours || "0");

  const [timeRows, setTimeRows] = useState<TimeRow[]>(initialData?.timeRows || []);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(initialData?.paymentRows || []);
  const [machineRows, setMachineRows] = useState<MachineRow[]>(initialData?.machineRows || []);
  const [crewRows, setCrewRows] = useState<CrewRow[]>(initialData?.crewRows || []);
  const [debrisRows, setDebrisRows] = useState<DebrisRow[]>(initialData?.debrisRows || []);
  const [weedingRows, setWeedingRows] = useState<WeedingRow[]>(initialData?.weedingRows || []);
  const [hourlyRows, setHourlyRows] = useState<HourlyRow[]>(initialData?.hourlyRows || []);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>(initialData?.materialRows || []);
  const [outsourcedRows, setOutsourcedRows] = useState<OutsourcedRow[]>(initialData?.outsourcedRows || []);

  const [addlWorkRows, setAddlWorkRows] = useState<AddlWorkRow[]>(initialData?.addlWorkRows || []);
  const [addlCrewRows, setAddlCrewRows] = useState<AddlCrewRow[]>(initialData?.addlCrewRows || []);
  const [addlMaterialRows, setAddlMaterialRows] = useState<AddlMaterialRow[]>(initialData?.addlMaterialRows || []);
  const [addlOutsourcedRows, setAddlOutsourcedRows] = useState<AddlOutsourcedRow[]>(initialData?.addlOutsourcedRows || []);

  const [notes, setNotes] = useState(initialData?.notes || "");
  const [materialsNotUsed, setMaterialsNotUsed] = useState(initialData?.materialsNotUsed || "");

  function updateRow<T>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    i: number,
    field: keyof T,
    value: T[keyof T]
  ) {
    setter((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function removeRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number) {
    setter((prev) => prev.filter((_, idx) => idx !== i));
  }

  const daySummary = useMemo(() => summarizeDays(timeRows), [timeRows]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !foremanId || !woNumber) {
      setError("Customer, Foreman, and Work Order Number are required.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const url = isEdit ? `/api/jobs/${initialData!.id}` : "/api/jobs";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          jobType: jobType || "General",
          foremanId,
          startDate: daySummary?.first || null,
          endDate: daySummary?.last || null,
          woNumber,
          pctComplete: parseFloat(pctComplete) || 0,
          totalHours: parseFloat(totalHours) || 0,
          notes,
          materialsNotUsed,
          timeEntries: timeRows.map((t) => ({
            startTime: t.date && t.startTime ? `${t.date}T${t.startTime}` : "",
            endTime: t.date && t.endTime ? `${t.date}T${t.endTime}` : "",
          })),
          payments: paymentRows,
          machines: machineRows,
          crewDetails: crewRows.flatMap((row) =>
            row.employeeIds.length > 0
              ? row.employeeIds.map((eid) => ({
                  date: row.date,
                  employeeId: eid,
                  jobHours: row.jobHours,
                  setupHours: row.setupHours,
                  travelHours: row.travelHours,
                  unloadHours: row.unloadHours,
                  deliveryHours: row.deliveryHours,
                }))
              : [{ date: row.date, employeeId: "", jobHours: row.jobHours, setupHours: row.setupHours, travelHours: row.travelHours, unloadHours: row.unloadHours, deliveryHours: row.deliveryHours }]
          ),
          debris: debrisRows,
          weeding: weedingRows,
          hourlyWork: hourlyRows,
          materials: materialRows,
          outsourcedMaterials: outsourcedRows,
          additionalWork: addlWorkRows,
          additionalCrewDetails: addlCrewRows,
          additionalMaterials: addlMaterialRows,
          additionalOutsourced: addlOutsourcedRows,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push(isEdit ? `/portal/jobs/${initialData!.id}` : "/portal/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      {/* ── JOB INFO ──────────────────────────────────── */}
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

      {/* ── PROJECT DAYS ──────────────────────────────── */}
      <GroupHeading>Project Days</GroupHeading>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Daily Log
            </h3>
            {daySummary && (
              <>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                  <CalendarDays className="w-3 h-3" />
                  {daySummary.uniqueDays} day{daySummary.uniqueDays !== 1 && "s"}
                </span>
                {daySummary.uniqueDays > 1 && (
                  <span className="text-[11px] text-muted-foreground">
                    {fmtDate(daySummary.first)} &ndash; {fmtDate(daySummary.last)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Big "Log Today" button — primary action for field workers */}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setTimeRows((p) => [
              ...p,
              { date: todayLocal(), startTime: timeNow(), endTime: "" },
            ])
          }
          className="w-full h-12 text-sm font-medium gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Today
        </Button>

        {timeRows.length === 0 && (
          <EmptyState text="No days logged yet. Tap Log Today each day the crew is on site." />
        )}

        {timeRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Day {i + 1}
                {row.date && ` — ${fmtDate(row.date)}`}
              </span>
              <RowDelete onClick={() => removeRow(setTimeRows, i)} />
            </div>
            <Field label="Date" action={<TodayBtn onClick={() => updateRow(setTimeRows, i, "date", todayLocal())} />}>
              <MobileInput
                type="date"
                value={row.date}
                onChange={(e) => updateRow(setTimeRows, i, "date", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" action={<NowBtn onClick={() => updateRow(setTimeRows, i, "startTime", timeNow())} />}>
                <MobileInput
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateRow(setTimeRows, i, "startTime", e.target.value)}
                />
              </Field>
              <Field label="End" action={<NowBtn onClick={() => updateRow(setTimeRows, i, "endTime", timeNow())} />}>
                <MobileInput
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateRow(setTimeRows, i, "endTime", e.target.value)}
                />
              </Field>
            </div>
          </div>
        ))}
      </Card>

      {/* ── CREW & EQUIPMENT ──────────────────────────── */}
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

        {crewRows.map((row, i) => {
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
            <div key={i} className="p-3 border border-border rounded-lg space-y-3">
              {/* Header */}
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

              {/* Date */}
              <Field label="Date" action={<TodayBtn onClick={() => updateRow(setCrewRows, i, "date", todayLocal())} />}>
                <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setCrewRows, i, "date", e.target.value)} />
              </Field>

              {/* Employee multi-select */}
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

              {/* Hours */}
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
        })}
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

      {/* ── WORK LOG ──────────────────────────────────── */}
      <GroupHeading>Work Log</GroupHeading>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Debris" count={debrisRows.length} onAdd={() =>
          setDebrisRows((p) => [...p, { date: todayLocal(), amountYards: "", type: "" }])
        } />
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
      </Card>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Weeding / Bed Maintenance" count={weedingRows.length} onAdd={() =>
          setWeedingRows((p) => [...p, { date: todayLocal(), numEmployees: "", timeValue: "", timeUnit: "HOURS" }])
        } />
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
      </Card>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Hourly Work" count={hourlyRows.length} onAdd={() =>
          setHourlyRows((p) => [...p, { date: todayLocal(), typeOfWork: "", numEmployees: "", timeValue: "", timeUnit: "HOURS" }])
        } />
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
      </Card>

      {/* ── MATERIALS ─────────────────────────────────── */}
      <GroupHeading>Materials</GroupHeading>

      <Card className="p-4 space-y-3">
        <SectionHeader title="MCC Materials" count={materialRows.length} onAdd={() =>
          setMaterialRows((p) => [...p, { material: "", qty: "", units: "" }])
        } />
        {materialRows.length === 0 && <EmptyState text="No materials listed." />}
        {materialRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setMaterialRows, i)} />
            </div>
            <Field label="Material">
              <MobileInput value={row.material} onChange={(e) => updateRow(setMaterialRows, i, "material", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="QTY">
                <MobileInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setMaterialRows, i, "qty", e.target.value)} />
              </Field>
              <Field label="Units">
                <MobileInput value={row.units} onChange={(e) => updateRow(setMaterialRows, i, "units", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Outsourced Material" count={outsourcedRows.length} onAdd={() =>
          setOutsourcedRows((p) => [...p, { supplier: "", material: "", qty: "", unit: "", cost: "", perUnitCost: "", taxIncluded: false }])
        } />
        {outsourcedRows.length === 0 && <EmptyState text="No outsourced materials." />}
        {outsourcedRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Material #{i + 1}</span>
              <RowDelete onClick={() => removeRow(setOutsourcedRows, i)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Supplier">
                <MobileInput value={row.supplier} onChange={(e) => updateRow(setOutsourcedRows, i, "supplier", e.target.value)} />
              </Field>
              <Field label="Material">
                <MobileInput value={row.material} onChange={(e) => updateRow(setOutsourcedRows, i, "material", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="QTY">
                <MobileInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setOutsourcedRows, i, "qty", e.target.value)} />
              </Field>
              <Field label="Unit">
                <MobileInput value={row.unit} onChange={(e) => updateRow(setOutsourcedRows, i, "unit", e.target.value)} />
              </Field>
              <Field label="Cost">
                <MobileInput type="number" step="0.01" value={row.cost} onChange={(e) => updateRow(setOutsourcedRows, i, "cost", e.target.value)} />
              </Field>
              <Field label="Per Unit Cost">
                <MobileInput type="number" step="0.01" value={row.perUnitCost} onChange={(e) => updateRow(setOutsourcedRows, i, "perUnitCost", e.target.value)} />
              </Field>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2.5 h-11 sm:h-9">
                  <Checkbox
                    checked={row.taxIncluded}
                    onCheckedChange={(v) => updateRow(setOutsourcedRows, i, "taxIncluded", !!v)}
                  />
                  <span className="text-sm">Tax Included</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* ── PAYMENTS & PHOTOS ─────────────────────────── */}
      <GroupHeading>Payments &amp; Photos</GroupHeading>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Payment or Deposit" count={paymentRows.length} onAdd={() =>
          setPaymentRows((p) => [...p, { date: todayLocal(), checkNumber: "", amount: "" }])
        } />
        {paymentRows.length === 0 && <EmptyState text="No payments recorded." />}
        {paymentRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setPaymentRows, i)} />
            </div>
            <Field label="Date" action={<TodayBtn onClick={() => updateRow(setPaymentRows, i, "date", todayLocal())} />}>
              <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setPaymentRows, i, "date", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check Number">
                <MobileInput value={row.checkNumber} onChange={(e) => updateRow(setPaymentRows, i, "checkNumber", e.target.value)} />
              </Field>
              <Field label="Amount">
                <MobileInput type="number" step="0.01" value={row.amount} onChange={(e) => updateRow(setPaymentRows, i, "amount", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Photos</h3>
        <Field label="Before Pictures">
          <MobileInput type="file" accept="image/*" multiple />
        </Field>
        <Field label="After Pictures">
          <MobileInput type="file" accept="image/*" multiple />
        </Field>
        <p className="text-xs text-muted-foreground">Upload happens on save.</p>
      </Card>

      {/* ── ADDITIONAL WORK ───────────────────────────── */}
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

      {/* ── NOTES ─────────────────────────────────────── */}
      <Card className="p-4 space-y-4">
        <h3 className="font-display text-sm font-semibold text-foreground">Notes</h3>
        <Field label="Additional Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-base sm:text-sm" />
        </Field>
        <Field label="Material/Services not used or performed">
          <Textarea value={materialsNotUsed} onChange={(e) => setMaterialsNotUsed(e.target.value)} rows={3} className="text-base sm:text-sm" />
        </Field>
      </Card>

      {/* ── STICKY SAVE BAR ───────────────────────────── */}
      {error && (
        <p className="text-sm text-destructive font-medium px-1">{error}</p>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 flex gap-3 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:z-auto">
        <Button
          type="submit"
          disabled={saving}
          className="flex-1 sm:flex-none h-12 sm:h-10 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 text-base sm:text-sm font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : isEdit ? "Update Job" : "Save Job"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/portal/jobs")}
          className="h-12 sm:h-10 px-6 text-base sm:text-sm"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
