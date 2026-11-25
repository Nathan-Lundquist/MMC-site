"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ClipboardList, CalendarDays, Users, Package, CreditCard, FileText } from "lucide-react";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";
import { FormTabs } from "./form-ui";

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

type TabKey = "info" | "time" | "crew" | "materials" | "payments" | "notes";

export function WorkOrderForm({ customers, employees, materialCatalog, initialData }: FormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [jobCategory, setJobCategory] = useState(initialData?.jobCategory || "");
  const [jobType, setJobType] = useState(initialData?.jobType || "");
  const [foremanId, setForemanId] = useState(initialData?.foremanId || "");
  const [woNumber, setWoNumber] = useState(initialData?.woNumber || "");
  const [estimateNumber, setEstimateNumber] = useState(initialData?.estimateNumber || "");
  const [pctComplete, setPctComplete] = useState(initialData?.pctComplete || "0");
  const [totalHours, setTotalHours] = useState(initialData?.totalHours || "0");
  const [estimatedHours, setEstimatedHours] = useState(initialData?.estimatedHours || "");

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

  const tabCounts = {
    time: timeRows.length + debrisRows.length + weedingRows.length + hourlyRows.length,
    crew: crewRows.flatMap((r) => r.employees).length + machineRows.length,
    materials: materialRows.length + outsourcedRows.length + addlWorkRows.length,
    payments: paymentRows.length,
  };

  const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: "info", label: "Info", icon: ClipboardList },
    { key: "time", label: "Time", icon: CalendarDays, count: tabCounts.time },
    { key: "crew", label: "Crew", icon: Users, count: tabCounts.crew },
    { key: "materials", label: "Materials", icon: Package, count: tabCounts.materials },
    { key: "payments", label: "Payments", icon: CreditCard, count: tabCounts.payments },
    { key: "notes", label: "Notes", icon: FileText },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || (isEdit && !woNumber)) {
      setError("Customer and Work Order Number are required.");
      setActiveTab("info");
      return;
    }
    if (!jobCategory) {
      setError("Category is required.");
      setActiveTab("info");
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
          jobCategory,
          jobType: jobType || "General",
          foremanId,
          startDate: daySummary?.first || null,
          endDate: daySummary?.last || null,
          woNumber,
          estimateNumber,
          pctComplete: parseFloat(pctComplete) || 0,
          totalHours: parseFloat(totalHours) || 0,
          estimatedHours: estimatedHours.trim() ? parseFloat(estimatedHours) : null,
          notes,
          materialsNotUsed,
          timeEntries: timeRows.map((t) => ({
            startTime: t.date && t.startTime ? `${t.date}T${t.startTime}` : "",
            endTime: t.date && t.endTime ? `${t.date}T${t.endTime}` : "",
          })),
          payments: paymentRows,
          machines: machineRows,
          crewDetails: crewRows.flatMap((row) =>
            row.employees.map((emp) => ({
              date: row.date,
              employeeId: emp.employeeId,
              jobHours: emp.jobHours,
              setupHours: emp.setupHours,
              travelHours: emp.travelHours,
              unloadHours: emp.unloadHours,
              deliveryHours: emp.deliveryHours,
            }))
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

      if (isEdit) {
        router.push(`/portal/jobs/${initialData!.id}`);
      } else {
        const isCleanUp = (CLEAN_UP_CATEGORY_VALUES as readonly string[]).includes(jobCategory);
        router.push(isCleanUp ? "/portal/cleanups" : "/portal/landscape");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      <FormTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className={activeTab === "info" ? "space-y-4" : "hidden"}>
        <JobInfoSection
          customers={customers}
          employees={employees}
          customerId={customerId}
          setCustomerId={setCustomerId}
          jobCategory={jobCategory}
          setJobCategory={setJobCategory}
          jobType={jobType}
          setJobType={setJobType}
          foremanId={foremanId}
          setForemanId={setForemanId}
          woNumber={woNumber}
          setWoNumber={setWoNumber}
          isEdit={isEdit}
          estimateNumber={estimateNumber}
          setEstimateNumber={setEstimateNumber}
          pctComplete={pctComplete}
          setPctComplete={setPctComplete}
          totalHours={totalHours}
          setTotalHours={setTotalHours}
          estimatedHours={estimatedHours}
          setEstimatedHours={setEstimatedHours}
        />
      </div>

      <div className={activeTab === "time" ? "space-y-4" : "hidden"}>
        <ProjectDaysSection timeRows={timeRows} setTimeRows={setTimeRows} />

        <WorkLogSection
          debrisRows={debrisRows}
          setDebrisRows={setDebrisRows}
          weedingRows={weedingRows}
          setWeedingRows={setWeedingRows}
          hourlyRows={hourlyRows}
          setHourlyRows={setHourlyRows}
        />
      </div>

      <div className={activeTab === "crew" ? "space-y-4" : "hidden"}>
        <CrewSection
          employees={employees}
          crewRows={crewRows}
          setCrewRows={setCrewRows}
          machineRows={machineRows}
          setMachineRows={setMachineRows}
        />
      </div>

      <div className={activeTab === "materials" ? "space-y-4" : "hidden"}>
        <MaterialsSection
          materialRows={materialRows}
          setMaterialRows={setMaterialRows}
          outsourcedRows={outsourcedRows}
          setOutsourcedRows={setOutsourcedRows}
          materialCatalog={materialCatalog || []}
        />

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
      </div>

      <div className={activeTab === "payments" ? "space-y-4" : "hidden"}>
        <PaymentsSection paymentRows={paymentRows} setPaymentRows={setPaymentRows} />
      </div>

      <div className={activeTab === "notes" ? "space-y-4" : "hidden"}>
        <NotesSection
          notes={notes}
          setNotes={setNotes}
          materialsNotUsed={materialsNotUsed}
          setMaterialsNotUsed={setMaterialsNotUsed}
        />
      </div>

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
          onClick={() => {
            if (isEdit) {
              router.push(`/portal/jobs/${initialData!.id}`);
              return;
            }
            const isCleanUp = (CLEAN_UP_CATEGORY_VALUES as readonly string[]).includes(jobCategory);
            router.push(isCleanUp ? "/portal/cleanups" : "/portal/landscape");
          }}
          className="h-12 sm:h-10 px-6 text-base sm:text-sm"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
