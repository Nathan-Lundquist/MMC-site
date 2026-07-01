"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, Loader2, Plus } from "lucide-react";
import {
  MobileInput,
  Field,
} from "@/components/portal/work-order-form/form-ui";

interface Site {
  id: string;
  name: string;
  active: boolean;
}

interface Rates {
  id: string;
  bulkSaltPerYard: string;
  iceMelterPerBag: string;
  calciumPerBag: string;
  employeePerHour: string;
  fuelPerHour: string;
  indirectMultiplier: string;
}

export function SnowSettings() {
  return (
    <div className="space-y-8">
      <SiteListSection />
      <RatesSection />
    </div>
  );
}

function SiteListSection() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSiteName, setNewSiteName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadSites = useCallback(async () => {
    try {
      // Fetch all sites (including inactive) for settings
      const res = await fetch("/api/snow/sites?all=true");
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  async function addSite() {
    if (!newSiteName.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/snow/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSiteName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add site");
      }

      const site = await res.json();
      setSites((prev) => [...prev, site].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSiteName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add site");
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(site: Site) {
    try {
      const res = await fetch(`/api/snow/sites/${site.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !site.active }),
      });

      if (res.ok) {
        setSites((prev) =>
          prev.map((s) =>
            s.id === site.id ? { ...s, active: !s.active } : s
          )
        );
      }
    } catch {
      // Silently fail for toggle
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading sites...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-display text-base font-bold text-foreground">
        Site List
      </h2>

      <div className="flex gap-2">
        <MobileInput
          placeholder="New site name..."
          value={newSiteName}
          onChange={(e) => setNewSiteName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSite()}
        />
        <Button
          onClick={addSite}
          disabled={adding || !newSiteName.trim()}
          size="sm"
          className="h-11 sm:h-9 gap-1 shrink-0"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="border border-border rounded-lg divide-y divide-border max-h-96 overflow-y-auto">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`flex items-center justify-between px-3 py-2.5 ${
              !site.active ? "opacity-50" : ""
            }`}
          >
            <span className="text-sm">{site.name}</span>
            <Button
              variant={site.active ? "outline" : "default"}
              size="sm"
              onClick={() => toggleActive(site)}
              className="h-7 text-xs"
            >
              {site.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ))}
        {sites.length === 0 && (
          <p className="text-sm text-muted-foreground p-3">No sites yet</p>
        )}
      </div>
    </Card>
  );
}

function RatesSection() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/snow/rates");
        if (res.ok) {
          const data = await res.json();
          setRates({
            id: data.id,
            bulkSaltPerYard: String(data.bulkSaltPerYard),
            iceMelterPerBag: String(data.iceMelterPerBag),
            calciumPerBag: String(data.calciumPerBag),
            employeePerHour: String(data.employeePerHour),
            fuelPerHour: String(data.fuelPerHour),
            indirectMultiplier: String(data.indirectMultiplier),
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveRates() {
    if (!rates) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/snow/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulkSaltPerYard: parseFloat(rates.bulkSaltPerYard) || 0,
          iceMelterPerBag: parseFloat(rates.iceMelterPerBag) || 0,
          calciumPerBag: parseFloat(rates.calciumPerBag) || 0,
          employeePerHour: parseFloat(rates.employeePerHour) || 0,
          fuelPerHour: parseFloat(rates.fuelPerHour) || 0,
          indirectMultiplier: parseFloat(rates.indirectMultiplier) || 0,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function updateRate(field: keyof Omit<Rates, "id">, value: string) {
    if (!rates) return;
    setRates({ ...rates, [field]: value });
  }

  if (loading || !rates) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading rates...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-display text-base font-bold text-foreground">
        Material & Labor Rates
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Bulk Salt ($/yard)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rates.bulkSaltPerYard}
            onChange={(e) => updateRate("bulkSaltPerYard", e.target.value)}
          />
        </Field>
        <Field label="Ice Melter ($/bag)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rates.iceMelterPerBag}
            onChange={(e) => updateRate("iceMelterPerBag", e.target.value)}
          />
        </Field>
        <Field label="Calcium Chloride ($/bag)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rates.calciumPerBag}
            onChange={(e) => updateRate("calciumPerBag", e.target.value)}
          />
        </Field>
        <Field label="Employee ($/hour)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rates.employeePerHour}
            onChange={(e) => updateRate("employeePerHour", e.target.value)}
          />
        </Field>
        <Field label="Fuel ($/hour)">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rates.fuelPerHour}
            onChange={(e) => updateRate("fuelPerHour", e.target.value)}
          />
        </Field>
        <Field label="Indirect Multiplier">
          <MobileInput
            type="number"
            inputMode="decimal"
            step="0.0001"
            value={rates.indirectMultiplier}
            onChange={(e) => updateRate("indirectMultiplier", e.target.value)}
          />
        </Field>
      </div>

      <Button
        onClick={saveRates}
        disabled={saving}
        className="w-full sm:w-auto h-11 gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          "Saved!"
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Rates
          </>
        )}
      </Button>
    </Card>
  );
}
