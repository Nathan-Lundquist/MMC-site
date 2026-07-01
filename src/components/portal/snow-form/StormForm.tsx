"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import {
  MobileInput,
  Field,
} from "@/components/portal/work-order-form/form-ui";

function toLocalDatetime(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function StormForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [description, setDescription] = useState("");
  const [eventStart, setEventStart] = useState(() =>
    toLocalDatetime(new Date())
  );
  const [eventEnd, setEventEnd] = useState(() =>
    toLocalDatetime(new Date())
  );

  async function handleSubmit() {
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/snow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, eventStart, eventEnd }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create storm");
      }

      const data = await res.json();
      const matchMsg =
        data.matchedServices > 0
          ? `${data.matchedServices} site service${data.matchedServices === 1 ? "" : "s"} auto-linked.`
          : "No matching site services found in that date range.";

      alert(`Storm created! ${matchMsg}`);
      router.push(`/portal/snow/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create storm");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <Field label="Description">
          <Textarea
            placeholder="e.g. Winter Storm Jan 15-16"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="text-base sm:text-sm"
          />
        </Field>
        <Field label="Event Start">
          <MobileInput
            type="datetime-local"
            value={eventStart}
            onChange={(e) => setEventStart(e.target.value)}
          />
        </Field>
        <Field label="Event End">
          <MobileInput
            type="datetime-local"
            value={eventEnd}
            onChange={(e) => setEventEnd(e.target.value)}
          />
        </Field>
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full h-12 text-base font-semibold gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Create Storm
          </>
        )}
      </Button>
    </div>
  );
}
