"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, CheckCircle } from "lucide-react";
import {
  MobileSelect,
  MobileInput,
  NowBtn,
  Field,
} from "@/components/portal/work-order-form/form-ui";

interface WorkOrderOption {
  id: string;
  workOrderNumber: string;
  jobType: string;
  customerName: string;
}

interface MaterialOption {
  id: string;
  name: string;
  unit: string;
}

interface Employee {
  id: string;
  name: string;
}

function toLocalDatetime(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function CrewWorkLogForm({
  workOrders,
  materials,
  employees,
  currentUser,
}: {
  workOrders: WorkOrderOption[];
  materials: MaterialOption[];
  employees: Employee[];
  currentUser: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Work order
  const [workOrderId, setWorkOrderId] = useState("");

  // Work type
  const [workType, setWorkType] = useState("");

  // Times
  const [startTime, setStartTime] = useState(() => toLocalDatetime(new Date()));
  const [endTime, setEndTime] = useState(() => toLocalDatetime(new Date()));

  // Crew
  const [selectedCrew, setSelectedCrew] = useState<string[]>(() => {
    const match = employees.find((e) => e.name === currentUser);
    return match ? [match.name] : [];
  });

  // Materials — track quantity per material
  const [materialQtys, setMaterialQtys] = useState<Record<string, string>>({});

  // Notes
  const [notes, setNotes] = useState("");

  function toggleCrew(name: string) {
    setSelectedCrew((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function updateMaterialQty(materialId: string, value: string) {
    setMaterialQtys((prev) => ({ ...prev, [materialId]: value }));
  }

  function resetForm() {
    setWorkOrderId("");
    setWorkType("");
    setStartTime(toLocalDatetime(new Date()));
    setEndTime(toLocalDatetime(new Date()));
    setMaterialQtys({});
    setNotes("");
    setError("");
    setSuccess(false);
    // Keep crew selection sticky
  }

  async function handleSubmit() {
    if (!workOrderId) {
      setError("Please select a work order");
      return;
    }
    if (!workType) {
      setError("Please select a work type");
      return;
    }
    if (selectedCrew.length === 0) {
      setError("Please select at least one crew member");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const materialsPayload = materials
        .map((m) => ({
          materialId: m.id,
          quantity: parseFloat(materialQtys[m.id] || "0") || 0,
        }))
        .filter((m) => m.quantity > 0);

      const res = await fetch("/api/landscape/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId,
          workType,
          startTime,
          endTime,
          crewMembers: selectedCrew,
          materials: materialsPayload,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-xl font-bold">Logged!</h2>
        <p className="text-muted-foreground text-sm">
          Work log saved successfully.
        </p>
        <Button onClick={resetForm} size="lg" className="h-12 px-8">
          Log Another
        </Button>
      </div>
    );
  }

  const jobCategories = [
    "LANDSCAPE",
    "FALL_CLEANUP",
    "SPRING_CLEANUP",
    "SUBCONTRACTOR",
    "IN_HOUSE_REPAIR",
    "BED_MAINTENANCE",
    "SPRINKLER",
    "LIGHTING",
    "HARDSCAPE",
    "OTHER",
  ];

  const formatCategory = (cat: string) =>
    cat
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="space-y-4">
      {/* Work Order Selection */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Work Order
        </h3>
        <MobileSelect value={workOrderId} onChange={setWorkOrderId}>
          <option value="">Select a work order...</option>
          {workOrders.map((wo) => (
            <option key={wo.id} value={wo.id}>
              {wo.customerName} - {wo.workOrderNumber} ({wo.jobType})
            </option>
          ))}
        </MobileSelect>
      </Card>

      {/* Work Type */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Work Type
        </h3>
        <MobileSelect value={workType} onChange={setWorkType}>
          <option value="">Select work type...</option>
          {jobCategories.map((cat) => (
            <option key={cat} value={cat}>
              {formatCategory(cat)}
            </option>
          ))}
        </MobileSelect>
      </Card>

      {/* Times */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Times
        </h3>
        <Field
          label="Start Time"
          action={
            <NowBtn
              onClick={() => setStartTime(toLocalDatetime(new Date()))}
            />
          }
        >
          <MobileInput
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </Field>
        <Field
          label="End Time"
          action={
            <NowBtn onClick={() => setEndTime(toLocalDatetime(new Date()))} />
          }
        >
          <MobileInput
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </Field>
      </Card>

      {/* Crew */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Crew ({selectedCrew.length})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {employees.map((emp) => {
            const selected = selectedCrew.includes(emp.name);
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => toggleCrew(emp.name)}
                className={`h-11 rounded-md border text-sm px-3 text-left transition-colors ${
                  selected
                    ? "border-brand bg-brand/10 text-brand font-medium"
                    : "border-input bg-background text-foreground active:bg-secondary"
                }`}
              >
                {emp.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Materials */}
      {materials.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Materials
          </h3>
          {materials.map((mat) => (
            <Field
              key={mat.id}
              label={`${mat.name}${mat.unit ? ` (${mat.unit})` : ""}`}
            >
              <MobileInput
                type="number"
                inputMode="decimal"
                step="0.25"
                placeholder="0"
                value={materialQtys[mat.id] || ""}
                onChange={(e) => updateMaterialQty(mat.id, e.target.value)}
              />
            </Field>
          ))}
        </Card>
      )}

      {/* Notes */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Notes
        </h3>
        <Textarea
          placeholder="Any notes about the work..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="text-base sm:text-sm"
        />
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Fixed bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t p-3 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:p-0">
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Work Log
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
