"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import {
  MobileInput,
  MobileSelect,
  Field,
} from "@/components/portal/work-order-form/form-ui";

type Kind = "IN_HOUSE" | "OUTSOURCED";

interface Material {
  id: string;
  name: string;
  unit: string;
  kind: Kind;
  defaultPrice: number | string | null;
  active: boolean;
}

export function MaterialSettings({ editable = true }: { editable?: boolean }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newKind, setNewKind] = useState<Kind>("IN_HOUSE");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const loadMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/landscape/materials?all=true");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  async function addMaterial() {
    if (!newName.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/landscape/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          unit: newUnit.trim(),
          kind: newKind,
          defaultPrice: newPrice.trim() ? parseFloat(newPrice) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add material");
      }

      const material = await res.json();
      setMaterials((prev) =>
        [...prev, material].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewName("");
      setNewUnit("");
      setNewPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add material");
    } finally {
      setAdding(false);
    }
  }

  async function updateMaterial(id: string, data: Partial<Pick<Material, "active" | "defaultPrice">>) {
    try {
      const res = await fetch(`/api/landscape/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
      }
    } catch {
      // Silently fail
    }
  }

  function toggleActive(material: Material) {
    updateMaterial(material.id, { active: !material.active });
  }

  function savePrice(material: Material) {
    const raw = priceDrafts[material.id];
    if (raw === undefined) return;
    const price = raw.trim() === "" ? null : parseFloat(raw);
    if (price !== null && isNaN(price)) return;
    updateMaterial(material.id, { defaultPrice: price });
    setPriceDrafts((prev) => {
      const next = { ...prev };
      delete next[material.id];
      return next;
    });
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading materials...
        </div>
      </Card>
    );
  }

  const inHouse = materials.filter((m) => m.kind === "IN_HOUSE");
  const outsourced = materials.filter((m) => m.kind === "OUTSOURCED");

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-display text-base font-bold text-foreground">
        Materials List
      </h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Prices entered here are the default that pre-fills on a job sheet. They
        also update automatically whenever a different price is entered on a job.
      </p>

      {editable && <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[140px]">
          <Field label="Name">
            <MobileInput
              placeholder="Material name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
            />
          </Field>
        </div>
        <div className="w-24 shrink-0">
          <Field label="Unit">
            <MobileInput
              placeholder="e.g. yards"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
            />
          </Field>
        </div>
        <div className="w-28 shrink-0">
          <Field label="Price">
            <MobileInput
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
            />
          </Field>
        </div>
        <div className="w-32 shrink-0">
          <Field label="Type">
            <MobileSelect value={newKind} onChange={(v) => setNewKind(v as Kind)}>
              <option value="IN_HOUSE">In House</option>
              <option value="OUTSOURCED">Outsourced</option>
            </MobileSelect>
          </Field>
        </div>
        <div className="shrink-0 flex items-end">
          <Button
            onClick={addMaterial}
            disabled={adding || !newName.trim()}
            size="sm"
            className="h-11 sm:h-9 gap-1"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </Button>
        </div>
      </div>}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <MaterialKindList
        title="In House"
        materials={inHouse}
        priceDrafts={priceDrafts}
        setPriceDrafts={setPriceDrafts}
        savePrice={savePrice}
        toggleActive={toggleActive}
        editable={editable}
      />
      <MaterialKindList
        title="Outsourced"
        materials={outsourced}
        priceDrafts={priceDrafts}
        setPriceDrafts={setPriceDrafts}
        savePrice={savePrice}
        toggleActive={toggleActive}
        editable={editable}
      />
    </Card>
  );
}

function MaterialKindList({
  title,
  materials,
  priceDrafts,
  setPriceDrafts,
  savePrice,
  toggleActive,
  editable,
}: {
  title: string;
  materials: Material[];
  priceDrafts: Record<string, string>;
  setPriceDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  savePrice: (material: Material) => void;
  toggleActive: (material: Material) => void;
  editable: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title} ({materials.length})
      </h3>
      <div className="border border-border rounded-lg divide-y divide-border max-h-96 overflow-y-auto">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 ${
              !mat.active ? "opacity-50" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm">{mat.name}</span>
              {mat.unit && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({mat.unit})
                </span>
              )}
            </div>
            <div className="w-24 shrink-0">
              {editable ? (
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={
                    priceDrafts[mat.id] ??
                    (mat.defaultPrice != null ? String(Number(mat.defaultPrice)) : "")
                  }
                  onChange={(e) =>
                    setPriceDrafts((prev) => ({ ...prev, [mat.id]: e.target.value }))
                  }
                  onBlur={() => savePrice(mat)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right tabular-nums"
                />
              ) : (
                <span className="text-sm text-muted-foreground tabular-nums block text-right">
                  {mat.defaultPrice != null ? `$${Number(mat.defaultPrice).toFixed(2)}` : "—"}
                </span>
              )}
            </div>
            {editable && (
              <Button
                variant={mat.active ? "outline" : "default"}
                size="sm"
                onClick={() => toggleActive(mat)}
                className="h-7 text-xs shrink-0"
              >
                {mat.active ? "Deactivate" : "Activate"}
              </Button>
            )}
          </div>
        ))}
        {materials.length === 0 && (
          <p className="text-sm text-muted-foreground p-3">
            No materials yet
          </p>
        )}
      </div>
    </div>
  );
}
