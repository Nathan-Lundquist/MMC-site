"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import {
  MobileInput,
  Field,
} from "@/components/portal/work-order-form/form-ui";

interface Material {
  id: string;
  name: string;
  unit: string;
  active: boolean;
}

export function MaterialSettings() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ name: newName.trim(), unit: newUnit.trim() }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add material");
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(material: Material) {
    try {
      const res = await fetch(`/api/landscape/materials/${material.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !material.active }),
      });

      if (res.ok) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === material.id ? { ...m, active: !m.active } : m
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
          Loading materials...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-display text-base font-bold text-foreground">
        Materials List
      </h2>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Field label="Name">
            <MobileInput
              placeholder="Material name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
            />
          </Field>
        </div>
        <div className="w-28 shrink-0">
          <Field label="Unit">
            <MobileInput
              placeholder="e.g. yards"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
            />
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
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="border border-border rounded-lg divide-y divide-border max-h-96 overflow-y-auto">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className={`flex items-center justify-between px-3 py-2.5 ${
              !mat.active ? "opacity-50" : ""
            }`}
          >
            <div className="min-w-0">
              <span className="text-sm">{mat.name}</span>
              {mat.unit && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({mat.unit})
                </span>
              )}
            </div>
            <Button
              variant={mat.active ? "outline" : "default"}
              size="sm"
              onClick={() => toggleActive(mat)}
              className="h-7 text-xs"
            >
              {mat.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ))}
        {materials.length === 0 && (
          <p className="text-sm text-muted-foreground p-3">
            No materials yet
          </p>
        )}
      </div>
    </Card>
  );
}
