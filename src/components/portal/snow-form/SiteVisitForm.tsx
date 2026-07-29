"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, CheckCircle, Plus, Minus } from "lucide-react";
import {
  MobileSelect,
  MobileInput,
  NowBtn,
  Field,
} from "@/components/portal/work-order-form/form-ui";

interface Site {
  id: string;
  name: string;
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

function CountInput({
  label,
  value,
  onChange,
  enabled,
  onToggle,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={enabled}
        onCheckedChange={(v) => onToggle(!!v)}
        className="h-5 w-5"
      />
      <span className="text-sm flex-1 min-w-0">{label}</span>
      {enabled && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-input text-muted-foreground active:bg-secondary"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(value + 1)}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-input text-muted-foreground active:bg-secondary"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteVisitForm({
  sites,
  employees,
  currentUser,
}: {
  sites: Site[];
  employees: Employee[];
  currentUser: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Site
  const [siteId, setSiteId] = useState("");

  // Services
  const [plowEnabled, setPlowEnabled] = useState(false);
  const [plowCount, setPlowCount] = useState(1);
  const [saltLotEnabled, setSaltLotEnabled] = useState(false);
  const [saltLotCount, setSaltLotCount] = useState(1);
  const [shovelEnabled, setShovelEnabled] = useState(false);
  const [shovelCount, setShovelCount] = useState(1);
  const [saltWalkEnabled, setSaltWalkEnabled] = useState(false);
  const [saltWalkCount, setSaltWalkCount] = useState(1);

  // Materials
  const [bulkSaltYards, setBulkSaltYards] = useState("");
  const [iceMelterBags, setIceMelterBags] = useState("");
  const [calciumChlorideBags, setCalciumChlorideBags] = useState("");

  // Crew
  const [selectedCrew, setSelectedCrew] = useState<string[]>(() => {
    const match = employees.find((e) => e.name === currentUser);
    return match ? [match.name] : [];
  });

  // Times
  const [startTime, setStartTime] = useState(() => toLocalDatetime(new Date()));
  const [endTime, setEndTime] = useState(() => toLocalDatetime(new Date()));

  // Notes
  const [servicesPerformed, setServicesPerformed] = useState("");
  const [siteNotes, setSiteNotes] = useState("");
  const [additionalWork, setAdditionalWork] = useState(false);
  const [additionalWorkDesc, setAdditionalWorkDesc] = useState("");

  function toggleCrew(name: string) {
    setSelectedCrew((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  }

  function resetForm() {
    setSiteId("");
    setPlowEnabled(false);
    setPlowCount(1);
    setSaltLotEnabled(false);
    setSaltLotCount(1);
    setShovelEnabled(false);
    setShovelCount(1);
    setSaltWalkEnabled(false);
    setSaltWalkCount(1);
    setBulkSaltYards("");
    setIceMelterBags("");
    setCalciumChlorideBags("");
    setStartTime(toLocalDatetime(new Date()));
    setEndTime(toLocalDatetime(new Date()));
    setServicesPerformed("");
    setSiteNotes("");
    setAdditionalWork(false);
    setAdditionalWorkDesc("");
    setError("");
    setSuccess(false);
    // Keep crew selection sticky for chaining
  }

  async function handleSubmit() {
    if (!siteId) {
      setError("Please select a site");
      return;
    }
    if (selectedCrew.length === 0) {
      setError("Please select at least one crew member");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/snow/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          startTime,
          endTime,
          servicesPerformed,
          plowCount: plowEnabled ? plowCount : 0,
          saltLotCount: saltLotEnabled ? saltLotCount : 0,
          shovelCount: shovelEnabled ? shovelCount : 0,
          saltWalkCount: saltWalkEnabled ? saltWalkCount : 0,
          bulkSaltYards: parseFloat(bulkSaltYards) || 0,
          iceMelterBags: parseFloat(iceMelterBags) || 0,
          calciumChlorideBags: parseFloat(calciumChlorideBags) || 0,
          crewMembers: selectedCrew,
          additionalWorkRequested: additionalWork,
          additionalWorkDesc,
          siteNotes,
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
        <p className="text-muted-foreground text-sm">Site visit saved successfully.</p>
        <Button onClick={resetForm} size="lg" className="h-12 px-8">
          Log Another
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Site Selection */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Site
        </h3>
        <MobileSelect value={siteId} onChange={setSiteId}>
          <option value="">Select a site...</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </MobileSelect>
      </Card>

      {/* Services */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Services
        </h3>
        <div className="space-y-3">
          <CountInput
            label="Plow"
            value={plowCount}
            onChange={setPlowCount}
            enabled={plowEnabled}
            onToggle={setPlowEnabled}
          />
          <CountInput
            label="Salt Lot"
            value={saltLotCount}
            onChange={setSaltLotCount}
            enabled={saltLotEnabled}
            onToggle={setSaltLotEnabled}
          />
          <CountInput
            label="Shovel"
            value={shovelCount}
            onChange={setShovelCount}
            enabled={shovelEnabled}
            onToggle={setShovelEnabled}
          />
          <CountInput
            label="Salt Walk"
            value={saltWalkCount}
            onChange={setSaltWalkCount}
            enabled={saltWalkEnabled}
            onToggle={setSaltWalkEnabled}
          />
        </div>
      </Card>

      {/* Materials */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Materials
        </h3>
        <Field label="Bulk Salt (yards)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.25"
            placeholder="0"
            value={bulkSaltYards}
            onChange={(e) => setBulkSaltYards(e.target.value)}
          />
        </Field>
        <Field label="Ice Melter (bags)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="1"
            placeholder="0"
            value={iceMelterBags}
            onChange={(e) => setIceMelterBags(e.target.value)}
          />
        </Field>
        <Field label="Calcium Chloride (bags)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="1"
            placeholder="0"
            value={calciumChlorideBags}
            onChange={(e) => setCalciumChlorideBags(e.target.value)}
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

      {/* Times */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Times
        </h3>
        <Field
          label="Start Time"
          action={
            <NowBtn onClick={() => setStartTime(toLocalDatetime(new Date()))} />
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

      {/* Notes */}
      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Notes
        </h3>
        <Field label="Services Performed">
          <Textarea
            placeholder="Describe services performed..."
            value={servicesPerformed}
            onChange={(e) => setServicesPerformed(e.target.value)}
            rows={2}
            className="text-base sm:text-sm"
          />
        </Field>
        <Field label="Site Notes">
          <Textarea
            placeholder="Any notes about the site..."
            value={siteNotes}
            onChange={(e) => setSiteNotes(e.target.value)}
            rows={2}
            className="text-base sm:text-sm"
          />
        </Field>
        <div className="flex items-center gap-3">
          <Checkbox
            checked={additionalWork}
            onCheckedChange={(v) => setAdditionalWork(!!v)}
            className="h-5 w-5"
          />
          <span className="text-sm">Additional work requested</span>
        </div>
        {additionalWork && (
          <Textarea
            placeholder="Describe additional work..."
            value={additionalWorkDesc}
            onChange={(e) => setAdditionalWorkDesc(e.target.value)}
            rows={2}
            className="text-base sm:text-sm"
          />
        )}
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
              Save Site Visit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
