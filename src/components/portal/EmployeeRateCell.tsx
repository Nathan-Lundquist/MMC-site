"use client";

import { useState } from "react";

export function EmployeeRateCell({
  employeeId,
  initialRate,
  editable,
}: {
  employeeId: string;
  initialRate: number | null;
  editable: boolean;
}) {
  const [rate, setRate] = useState(initialRate != null ? String(initialRate) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const value = rate.trim() === "" ? null : parseFloat(rate);
    if (value !== null && isNaN(value)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setRate(data.hourlyRate != null ? String(data.hourlyRate) : "");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editable) {
    return (
      <span className="tabular-nums text-muted-foreground">
        {initialRate != null ? `$${initialRate.toFixed(2)}/hr` : "—"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <span className="text-muted-foreground">$</span>
      <input
        type="number"
        step="0.01"
        placeholder="0.00"
        value={rate}
        disabled={saving}
        onChange={(e) => setRate(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-20 h-7 px-1.5 rounded border border-input bg-background text-sm text-right tabular-nums"
      />
      <span className="text-muted-foreground">/hr</span>
    </div>
  );
}
