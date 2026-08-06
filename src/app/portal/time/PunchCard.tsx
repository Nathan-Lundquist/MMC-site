"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Timer, LogIn, LogOut, Plus, Briefcase,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";

type Extra = { id: string; type: string; hours: number; notes: string | null };

type ActivePunch = {
  id: string;
  punchIn: string;
  jobLabel: string | null;
  extras: Extra[];
};

type HistoryItem = {
  id: string;
  punchIn: string;
  punchOut: string;
  jobLabel: string | null;
  extras: Extra[];
};

type Job = {
  id: string;
  workOrderNumber: string;
  jobType: string;
  customerName: string;
};

const EXTRA_TYPES = [
  { value: "DELIVERY", label: "Delivery" },
  { value: "SETUP", label: "Setup" },
  { value: "UNLOAD", label: "Unload" },
  { value: "OTHER", label: "Other" },
];

function elapsed(from: string): string {
  const diff = Math.floor((Date.now() - new Date(from).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function duration(from: string, to: string): string {
  const diff = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function PunchCard({
  activePunch: initialPunch,
  todayPunches: initialHistory,
  jobs,
}: {
  activePunch: ActivePunch | null;
  todayPunches: HistoryItem[];
  jobs: Job[];
}) {
  const router = useRouter();
  const [punch, setPunch] = useState(initialPunch);
  const [history, setHistory] = useState(initialHistory);
  const [tick, setTick] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [extraType, setExtraType] = useState("DELIVERY");
  const [extraHours, setExtraHours] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [extraLoading, setExtraLoading] = useState(false);

  // Live ticker
  useEffect(() => {
    if (!punch) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [punch]);

  const handlePunchIn = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: selectedJobId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to punch in"); return; }
      setPunch({
        id: data.id,
        punchIn: data.punchIn,
        jobLabel: data.workOrder
          ? `${data.workOrder.workOrderNumber} — ${data.workOrder.customer.name}`
          : null,
        extras: [],
      });
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [selectedJobId]);

  const handlePunchOut = useCallback(async () => {
    if (!punch) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/punch/${punch.id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to punch out"); return; }
      setHistory((h) => [
        {
          id: punch.id,
          punchIn: punch.punchIn,
          punchOut: data.punchOut,
          jobLabel: punch.jobLabel,
          extras: punch.extras,
        },
        ...h,
      ]);
      setPunch(null);
      setShowExtra(false);
      router.refresh();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, [punch, router]);

  const handleAddExtra = useCallback(async () => {
    if (!punch || !extraHours || Number(extraHours) <= 0) return;
    setExtraLoading(true);
    try {
      const res = await fetch(`/api/punch/${punch.id}/extra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: extraType, hours: Number(extraHours), notes: extraNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add extra"); return; }
      setPunch((p) => p ? { ...p, extras: [...p.extras, { id: data.id, type: data.type, hours: Number(data.hours), notes: data.notes }] } : p);
      setExtraHours("");
      setExtraNotes("");
      setShowExtra(false);
    } catch { setError("Network error"); }
    finally { setExtraLoading(false); }
  }, [punch, extraType, extraHours, extraNotes]);

  return (
    <div className="space-y-4 max-w-xl">
      {/* Main punch card */}
      <Card className="overflow-hidden">
        {punch ? (
          /* ── Punched In State ── */
          <div>
            <div className="bg-brand/8 border-b border-brand/15 px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-foreground">Punched In</span>
              </div>
              <div className="font-mono text-4xl font-bold text-foreground tracking-tight tabular-nums">
                {elapsed(punch.punchIn)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Since {fmtTime(punch.punchIn)}
                {punch.jobLabel && (
                  <span className="ml-2 text-foreground/60">· {punch.jobLabel}</span>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Extras list */}
              {punch.extras.length > 0 && (
                <div className="space-y-1.5">
                  {punch.extras.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-sm px-3 py-1.5 bg-secondary rounded-lg">
                      <span className="text-muted-foreground capitalize">{e.type.toLowerCase()}</span>
                      <span className="font-medium">{e.hours}h</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add extra toggle */}
              <button
                onClick={() => setShowExtra((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showExtra ? <ChevronUp size={14} /> : <Plus size={14} />}
                Add extra hours
                {showExtra && <ChevronUp size={14} className="ml-auto" />}
              </button>

              {showExtra && (
                <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <select
                        value={extraType}
                        onChange={(e) => setExtraType(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {EXTRA_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Hours</Label>
                      <Input
                        type="number"
                        min="0.25"
                        step="0.25"
                        placeholder="e.g. 1.5"
                        value={extraHours}
                        onChange={(e) => setExtraHours(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes (optional)</Label>
                    <Input
                      placeholder="What did you do?"
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddExtra}
                    disabled={extraLoading || !extraHours}
                    className="w-full"
                  >
                    {extraLoading ? "Saving…" : "Save Extra Hours"}
                  </Button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <Button
                onClick={handlePunchOut}
                disabled={loading}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <LogOut size={16} />
                {loading ? "Punching out…" : "Punch Out"}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Not Punched In State ── */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <Timer size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Ready to start?</p>
                <p className="text-xs text-muted-foreground">Select a job (optional) and punch in</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Briefcase size={12} /> Job (optional)
              </Label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— No specific job —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.workOrderNumber} · {j.customerName} ({j.jobType})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button onClick={handlePunchIn} disabled={loading} className="w-full" size="lg">
              <LogIn size={16} />
              {loading ? "Punching in…" : "Punch In"}
            </Button>
          </div>
        )}
      </Card>

      {/* Today's history */}
      {history.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-2">Today&apos;s History</h2>
          <div className="space-y-2">
            {history.map((item) => (
              <Card key={item.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-foreground">{fmtTime(item.punchIn)} – {fmtTime(item.punchOut)}</span>
                    <span className="text-muted-foreground">({duration(item.punchIn, item.punchOut)})</span>
                  </div>
                  {item.jobLabel && (
                    <span className="text-xs text-muted-foreground truncate ml-2 max-w-[140px]">{item.jobLabel}</span>
                  )}
                </div>
                {item.extras.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.extras.map((e) => (
                      <span key={e.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {e.type.toLowerCase()} +{e.hours}h
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
