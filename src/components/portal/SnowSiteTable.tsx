"use client";

import { useState, useEffect } from "react";
import { Search, X, ChevronRight, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

export type SiteCost = {
  name: string;
  visits: number;
  labor: number;
  sub: number;
  fuel: number;
  bulkSalt: number;
  iceMelter: number;
  calcium: number;
  direct: number;
  indirect: number;
  total: number;
};

type Visit = {
  startTime: string;
  endTime: string;
  servicesPerformed: string;
  workerName: string | null;
  plowCount: number;
  saltLotCount: number;
  shovelCount: number;
  saltWalkCount: number;
  employeeCost: string;
  subCost: string;
  bulkSaltCost: string;
  iceMelterCost: string;
  calciumCost: string;
  fuelCost: string;
  totalDirect: string;
  totalIndirect: string;
  siteNotes: string | null;
  storm: { eventStart: string; description: string };
};

// ── Helpers ───────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
function $$(v: number | string | null | undefined) { return fmt.format(Number(v ?? 0)); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
}

function dur(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const min = Math.round((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

// ── Main Component ────────────────────────────────────────────────────────

export function SnowSiteTable({ siteCosts, season }: { siteCosts: SiteCost[]; season: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SiteCost | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = siteCosts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const grand = siteCosts.reduce(
    (acc, s) => ({
      visits: acc.visits + s.visits,
      labor: acc.labor + s.labor,
      sub: acc.sub + s.sub,
      fuel: acc.fuel + s.fuel,
      materials: acc.materials + s.bulkSalt + s.iceMelter + s.calcium,
      direct: acc.direct + s.direct,
      total: acc.total + s.total,
    }),
    { visits: 0, labor: 0, sub: 0, fuel: 0, materials: 0, direct: 0, total: 0 }
  );

  async function openSite(site: SiteCost) {
    setSelected(site);
    setLoading(true);
    setVisits([]);
    try {
      const res = await fetch(`/api/snow/site-visits?season=${encodeURIComponent(season)}&site=${encodeURIComponent(site.name)}`);
      if (res.ok) setVisits(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setSelected(null);
    setVisits([]);
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when panel open
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search sites…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-3 font-medium text-muted-foreground min-w-[160px]">Site</th>
              <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap">Visits</th>
              <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Labor</th>
              <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden md:table-cell">Sub</th>
              <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden lg:table-cell">Fuel</th>
              <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden lg:table-cell">Materials</th>
              <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden sm:table-cell">Direct</th>
              <th className="pb-2 font-medium text-muted-foreground text-right whitespace-nowrap">Total</th>
              <th className="pb-2 w-6" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                  No sites match &ldquo;{search}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.name}
                  onClick={() => openSite(s)}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                >
                  <td className="py-2 pr-3 font-medium text-brand group-hover:underline text-sm">{s.name}</td>
                  <td className="py-2 pr-3 text-right text-muted-foreground">{s.visits}</td>
                  <td className="py-2 pr-3 text-right tabular-nums hidden md:table-cell">{$$(s.labor)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums hidden md:table-cell">{$$(s.sub)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums hidden lg:table-cell">{$$(s.fuel)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums hidden lg:table-cell">{$$(s.bulkSalt + s.iceMelter + s.calcium)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums hidden sm:table-cell">{$$(s.direct)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums font-medium">{$$(s.total)}</td>
                  <td className="py-2 text-muted-foreground">
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-border font-semibold bg-secondary/30">
                <td className="pt-2.5 pr-3 text-foreground">
                  {search ? `${filtered.length} of ${siteCosts.length} sites` : "Total"}
                </td>
                <td className="pt-2.5 pr-3 text-right text-muted-foreground">
                  {filtered.reduce((a, s) => a + s.visits, 0)}
                </td>
                <td className="pt-2.5 pr-3 text-right tabular-nums hidden md:table-cell">
                  {$$(filtered.reduce((a, s) => a + s.labor, 0))}
                </td>
                <td className="pt-2.5 pr-3 text-right tabular-nums hidden md:table-cell">
                  {$$(filtered.reduce((a, s) => a + s.sub, 0))}
                </td>
                <td className="pt-2.5 pr-3 text-right tabular-nums hidden lg:table-cell">
                  {$$(filtered.reduce((a, s) => a + s.fuel, 0))}
                </td>
                <td className="pt-2.5 pr-3 text-right tabular-nums hidden lg:table-cell">
                  {$$(filtered.reduce((a, s) => a + s.bulkSalt + s.iceMelter + s.calcium, 0))}
                </td>
                <td className="pt-2.5 pr-3 text-right tabular-nums hidden sm:table-cell">
                  {$$(filtered.reduce((a, s) => a + s.direct, 0))}
                </td>
                <td className="pt-2.5 pr-3 text-right tabular-nums">
                  {$$(filtered.reduce((a, s) => a + s.total, 0))}
                </td>
                <td className="pt-2.5" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Backdrop */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <>
            {/* Panel header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-border shrink-0">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{season} Snow Season</p>
                <h2 className="font-display font-bold text-lg text-foreground leading-tight">{selected.name}</h2>
              </div>
              <button
                onClick={close}
                className="mt-0.5 p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-5 border-b border-border shrink-0">
              <MiniCard label="Visits" value={String(selected.visits)} />
              <MiniCard label="Total Cost" value={$$(selected.total)} highlight />
              <MiniCard label="Direct" value={$$(selected.direct)} />
              <MiniCard label="Labor" value={$$(selected.labor)} />
              <MiniCard label="Sub" value={$$(selected.sub)} />
              <MiniCard label="Fuel" value={$$(selected.fuel)} />
              <MiniCard label="Materials" value={$$(selected.bulkSalt + selected.iceMelter + selected.calcium)} />
              <MiniCard label="Indirect" value={$$(selected.indirect)} />
            </div>

            {/* Visits table */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading visits…</span>
                </div>
              ) : visits.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">No visits found</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    All Visits ({visits.length})
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                          <th className="pb-2 pr-3 font-medium text-muted-foreground">Storm</th>
                          <th className="pb-2 pr-3 font-medium text-muted-foreground hidden sm:table-cell">Services</th>
                          <th className="pb-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">Duration</th>
                          <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap">Labor</th>
                          <th className="pb-2 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap hidden sm:table-cell">Sub</th>
                          <th className="pb-2 font-medium text-muted-foreground text-right whitespace-nowrap">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {visits.map((v, i) => (
                          <tr key={i} className="hover:bg-secondary/20 transition-colors">
                            <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                              {fmtDate(v.startTime)}
                            </td>
                            <td className="py-2 pr-3 max-w-[120px] truncate text-foreground">
                              {v.storm.description}
                            </td>
                            <td className="py-2 pr-3 max-w-[160px] truncate text-muted-foreground hidden sm:table-cell">
                              {v.servicesPerformed}
                            </td>
                            <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                              {dur(v.startTime, v.endTime)}
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums">{$$(v.employeeCost)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums hidden sm:table-cell">{$$(v.subCost)}</td>
                            <td className="py-2 text-right tabular-nums font-medium">
                              {$$(Number(v.totalDirect) + Number(v.totalIndirect))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border font-semibold">
                          <td className="pt-2 pr-3 text-foreground" colSpan={4}>Total</td>
                          <td className="pt-2 pr-3 text-right tabular-nums">
                            {$$(visits.reduce((a, v) => a + Number(v.employeeCost), 0))}
                          </td>
                          <td className="pt-2 pr-3 text-right tabular-nums hidden sm:table-cell">
                            {$$(visits.reduce((a, v) => a + Number(v.subCost), 0))}
                          </td>
                          <td className="pt-2 text-right tabular-nums">
                            {$$(visits.reduce((a, v) => a + Number(v.totalDirect) + Number(v.totalIndirect), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Notes */}
                  {visits.some((v) => v.siteNotes) && (
                    <div className="mt-5 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</p>
                      {visits.filter((v) => v.siteNotes).map((v, i) => (
                        <div key={i} className="text-xs bg-secondary/50 rounded-lg p-3">
                          <span className="text-muted-foreground">{fmtDate(v.startTime)}: </span>
                          {v.siteNotes}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MiniCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums mt-0.5 ${highlight ? "text-foreground" : "text-foreground/80"}`}>
        {value}
      </div>
    </div>
  );
}
