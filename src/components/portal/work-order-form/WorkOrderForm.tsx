"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

import type {
  FormProps,
  TimeRow,
  PaymentRow,
  MachineRow,
  CrewRow,
  DebrisRow,
  WeedingRow,
  HourlyRow,
  MaterialRow,
  OutsourcedRow,
  AddlWorkRow,
  AddlCrewRow,
  AddlMaterialRow,
  AddlOutsourcedRow,
} from "./types";
import { summarizeDays } from "./helpers";
import { JobInfoSection } from "./JobInfoSection";
import { ProjectDaysSection } from "./ProjectDaysSection";
import { CrewSection } from "./CrewSection";
import { WorkLogSection } from "./WorkLogSection";
import { MaterialsSection } from "./MaterialsSection";
import { PaymentsSection } from "./PaymentsSection";
import { AdditionalWorkSection } from "./AdditionalWorkSection";
import { NotesSection } from "./NotesSection";

export function WorkOrderForm({ customers, employees, initialData }: FormProps) {
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

  const daySummary = useMemo(() => summarizeDays(timeRows), [timeRows]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !woNumber) {
      setError("Customer and Work Order Number are required.");
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
      <JobInfoSection
        customers={customers}
        employees={employees}
        customerId={customerId}
        setCustomerId={setCustomerId}
        jobType={jobType}
        setJobType={setJobType}
        foremanId={foremanId}
        setForemanId={setForemanId}
        woNumber={woNumber}
        setWoNumber={setWoNumber}
        pctComplete={pctComplete}
        setPctComplete={setPctComplete}
        totalHours={totalHours}
        setTotalHours={setTotalHours}
      />

      <ProjectDaysSection timeRows={timeRows} setTimeRows={setTimeRows} />

      <CrewSection
        employees={employees}
        crewRows={crewRows}
        setCrewRows={setCrewRows}
        machineRows={machineRows}
        setMachineRows={setMachineRows}
      />

      <WorkLogSection
        debrisRows={debrisRows}
        setDebrisRows={setDebrisRows}
        weedingRows={weedingRows}
        setWeedingRows={setWeedingRows}
        hourlyRows={hourlyRows}
        setHourlyRows={setHourlyRows}
      />

      <MaterialsSection
        materialRows={materialRows}
        setMaterialRows={setMaterialRows}
        outsourcedRows={outsourcedRows}
        setOutsourcedRows={setOutsourcedRows}
      />

      <PaymentsSection paymentRows={paymentRows} setPaymentRows={setPaymentRows} />

      <AdditionalWorkSection
        employees={employees}
        addlWorkRows={addlWorkRows}
        setAddlWorkRows={setAddlWorkRows}
        addlCrewRows={addlCrewRows}
        setAddlCrewRows={setAddlCrewRows}
        addlMaterialRows={addlMaterialRows}
        setAddlMaterialRows={setAddlMaterialRows}
        addlOutsourcedRows={addlOutsourcedRows}
        setAddlOutsourcedRows={setAddlOutsourcedRows}
      />

      <NotesSection
        notes={notes}
        setNotes={setNotes}
        materialsNotUsed={materialsNotUsed}
        setMaterialsNotUsed={setMaterialsNotUsed}
      />

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
