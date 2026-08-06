"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Wrench, CheckCircle2, AlertTriangle,
  XCircle, HelpCircle, ChevronDown, ChevronUp, X,
} from "lucide-react";

type MachineStatus = "RED" | "YELLOW" | "GREEN" | "UNTRACKED";

type Machine = {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  serviceIntervalHours: number | null;
  serviceIntervalDays: number | null;
  lastServiceDate: string | null;
  lastServiceHours: number | null;
  notes: string | null;
  totalHours: number;
  hoursSinceService: number;
  daysSinceService: number | null;
  status: MachineStatus;
  pct: number;
  recentService: { date: string; type: string | null; performedBy: string | null } | null;
};

const STATUS_CONFIG: Record<MachineStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  RED:       { label: "Overdue",   color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/30",    icon: <XCircle size={14} /> },
  YELLOW:    { label: "Due Soon",  color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30", icon: <AlertTriangle size={14} /> },
  GREEN:     { label: "OK",        color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: <CheckCircle2 size={14} /> },
  UNTRACKED: { label: "No intervals", color: "text-muted-foreground", bg: "bg-secondary", icon: <HelpCircle size={14} /> },
};

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: MachineStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function ProgressBar({ pct, status }: { pct: number; status: MachineStatus }) {
  const color = status === "RED" ? "bg-red-500" : status === "YELLOW" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function FleetView({ machines: initial }: { machines: Machine[] }) {
  const router = useRouter();
  const [machines, setMachines] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [servicingId, setServicingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add machine form state
  const [addForm, setAddForm] = useState({
    name: "", type: "", serialNumber: "",
    serviceIntervalHours: "", serviceIntervalDays: "", notes: "",
  });

  // Service form state
  const [svcForm, setSvcForm] = useState({
    serviceDate: new Date().toISOString().split("T")[0],
    serviceType: "", performedBy: "", notes: "",
  });

  const counts = {
    red: machines.filter((m) => m.status === "RED").length,
    yellow: machines.filter((m) => m.status === "YELLOW").length,
    green: machines.filter((m) => m.status === "GREEN").length,
  };

  async function handleAddMachine(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/machines/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          type: addForm.type,
          serialNumber: addForm.serialNumber || undefined,
          serviceIntervalHours: addForm.serviceIntervalHours ? Number(addForm.serviceIntervalHours) : undefined,
          serviceIntervalDays: addForm.serviceIntervalDays ? Number(addForm.serviceIntervalDays) : undefined,
          notes: addForm.notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setShowAdd(false);
      setAddForm({ name: "", type: "", serialNumber: "", serviceIntervalHours: "", serviceIntervalDays: "", notes: "" });
      router.refresh();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function handleLogService(e: React.FormEvent, machineId: string) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/machines/inventory/${machineId}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDate: svcForm.serviceDate,
          serviceType: svcForm.serviceType || undefined,
          performedBy: svcForm.performedBy || undefined,
          notes: svcForm.notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setServicingId(null);
      setSvcForm({ serviceDate: new Date().toISOString().split("T")[0], serviceType: "", performedBy: "", notes: "" });
      router.refresh();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Overdue", count: counts.red, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900" },
          { label: "Due Soon", count: counts.yellow, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900" },
          { label: "Good", count: counts.green, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900" },
        ].map((s) => (
          <Card key={s.label} className={`p-4 ${s.bg} ${s.border}`}>
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-foreground">
          {machines.length} machine{machines.length !== 1 ? "s" : ""}
        </h2>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)} variant={showAdd ? "secondary" : "default"}>
          {showAdd ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Machine</>}
        </Button>
      </div>

      {/* Add machine form */}
      {showAdd && (
        <Card className="p-5 border-brand/20 bg-brand/[0.02]">
          <h3 className="font-display text-sm font-semibold mb-4">New Machine</h3>
          <form onSubmit={handleAddMachine} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input placeholder="e.g. John Deere Z930" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type *</Label>
                <Input placeholder="e.g. Mower, Truck, Skid Steer" value={addForm.type} onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Serial #</Label>
                <Input placeholder="Optional" value={addForm.serialNumber} onChange={(e) => setAddForm((f) => ({ ...f, serialNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service every (hrs)</Label>
                <Input type="number" min="1" placeholder="e.g. 100" value={addForm.serviceIntervalHours} onChange={(e) => setAddForm((f) => ({ ...f, serviceIntervalHours: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service every (days)</Label>
                <Input type="number" min="1" placeholder="e.g. 90" value={addForm.serviceIntervalDays} onChange={(e) => setAddForm((f) => ({ ...f, serviceIntervalDays: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Optional" value={addForm.notes} onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} size="sm">{loading ? "Saving…" : "Add Machine"}</Button>
          </form>
        </Card>
      )}

      {/* Fleet table */}
      {machines.length === 0 ? (
        <Card className="p-10 text-center">
          <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No machines yet. Add your first one above.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {machines.map((m) => {
            const isServicing = servicingId === m.id;
            const isExpanded = expandedId === m.id;

            return (
              <Card key={m.id} className="overflow-hidden">
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.type}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.status !== "UNTRACKED" && (
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="flex-1 max-w-[200px]">
                          <ProgressBar pct={m.pct} status={m.status} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{m.pct}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground hidden sm:block shrink-0">
                    <div>Last: {fmtDate(m.lastServiceDate)}</div>
                    {m.serviceIntervalHours && (
                      <div>{m.hoursSinceService.toFixed(1)}h / {m.serviceIntervalHours}h</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); setServicingId(isServicing ? null : m.id); setExpandedId(null); }}
                    >
                      <Wrench size={13} /> Service
                    </Button>
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </div>

                {/* Log service form */}
                {isServicing && (
                  <div className="px-4 pb-4 pt-1 border-t border-border bg-secondary/20">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Log Service</p>
                    <form onSubmit={(e) => handleLogService(e, m.id)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Service Date *</Label>
                          <Input type="date" value={svcForm.serviceDate} onChange={(e) => setSvcForm((f) => ({ ...f, serviceDate: e.target.value }))} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Service Type</Label>
                          <Input placeholder="Oil change, full service…" value={svcForm.serviceType} onChange={(e) => setSvcForm((f) => ({ ...f, serviceType: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Performed By</Label>
                          <Input placeholder="Name" value={svcForm.performedBy} onChange={(e) => setSvcForm((f) => ({ ...f, performedBy: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Notes</Label>
                          <Input placeholder="Optional" value={svcForm.notes} onChange={(e) => setSvcForm((f) => ({ ...f, notes: e.target.value }))} />
                        </div>
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving…" : "Save Service"}</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setServicingId(null)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && !isServicing && (
                  <div className="px-4 pb-4 pt-1 border-t border-border text-sm text-muted-foreground grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5">Total Hours</p><p className="text-foreground">{m.totalHours.toFixed(1)}h</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5">Hours Since Service</p><p className="text-foreground">{m.hoursSinceService.toFixed(1)}h</p></div>
                    <div><p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5">Days Since Service</p><p className="text-foreground">{m.daysSinceService ?? "—"}</p></div>
                    {m.serialNumber && <div><p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5">Serial #</p><p className="text-foreground">{m.serialNumber}</p></div>}
                    {m.recentService && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5">Last Service</p>
                        <p className="text-foreground">
                          {fmtDate(m.recentService.date)}
                          {m.recentService.type && ` · ${m.recentService.type}`}
                          {m.recentService.performedBy && ` · ${m.recentService.performedBy}`}
                        </p>
                      </div>
                    )}
                    {m.notes && <div className="col-span-2"><p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5">Notes</p><p>{m.notes}</p></div>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
