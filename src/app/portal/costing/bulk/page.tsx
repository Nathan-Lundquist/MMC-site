"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageNumbersButton as PageNumbers, PaginationButton } from "@/components/portal/PageNumbers";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Save,
  ArrowLeft,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface WorkOrderRow {
  id: string;
  workOrderNumber: string;
  jobType: string;
  jobCategory: string;
  projectStartDate: string | null;
  status: string;
  invoiceNumber: string | null;
  invoiceAmount: string | number | null;
  estCrewTotal: string | number | null;
  crewTotal: string | number | null;
  materialCost: string | number | null;
  subCost: string | number | null;
  dumpCost: string | number | null;
  fuelCost: string | number | null;
  totalDirectExpense: string | number | null;
  totalIndirectExpense: string | number | null;
  profit: string | number | null;
  profitPercent: string | number | null;
  amountPaid: string | number | null;
  customer: { id: string; name: string };
}

interface ApiResponse {
  workOrders: WorkOrderRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  availableYears: number[];
}

interface EditableFields {
  invoiceNumber: string;
  invoiceAmount: string;
  estCrewTotal: string;
  crewTotal: string;
  materialCost: string;
  subCost: string;
  dumpCost: string;
  fuelCost: string;
  totalIndirectExpense: string;
  amountPaid: string;
}

const JOB_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "LANDSCAPE", label: "Landscape" },
  { value: "FALL_CLEANUP", label: "Fall Cleanup" },
  { value: "SPRING_CLEANUP", label: "Spring Cleanup" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "IN_HOUSE_REPAIR", label: "In House Repair" },
  { value: "BED_MAINTENANCE", label: "Bed Maintenance" },
  { value: "SPRINKLER", label: "Sprinkler" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "HARDSCAPE", label: "Hardscape" },
  { value: "OTHER", label: "Other" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
];

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

function toEditStr(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n) || n === 0) return "";
  return n.toString();
}

function fmtCurrency(v: number): string {
  if (v === 0) return "$0";
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return v < 0 ? `-$${formatted}` : `$${formatted}`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function categoryLabel(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function BulkCostingPage() {
  // ── State ──
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filters
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [uncostedOnly, setUncostedOnly] = useState(true);
  const [page, setPage] = useState(1);

  // Edits: keyed by workOrder id
  const [edits, setEdits] = useState<Record<string, Partial<EditableFields>>>(
    {}
  );
  // Original values snapshot for dirty detection
  const [originals, setOriginals] = useState<Record<string, EditableFields>>(
    {}
  );

  const tableRef = useRef<HTMLDivElement>(null);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setSaveResult(null);
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      params.set("uncosted", uncostedOnly ? "true" : "false");
      params.set("page", String(page));
      params.set("pageSize", "50");

      const res = await fetch(`/api/jobs/bulk-costing?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setData(json);

      // Build originals snapshot
      const origs: Record<string, EditableFields> = {};
      for (const wo of json.workOrders) {
        origs[wo.id] = {
          invoiceNumber: wo.invoiceNumber || "",
          invoiceAmount: toEditStr(wo.invoiceAmount),
          estCrewTotal: toEditStr(wo.estCrewTotal),
          crewTotal: toEditStr(wo.crewTotal),
          materialCost: toEditStr(wo.materialCost),
          subCost: toEditStr(wo.subCost),
          dumpCost: toEditStr(wo.dumpCost),
          fuelCost: toEditStr(wo.fuelCost),
          totalIndirectExpense: toEditStr(wo.totalIndirectExpense),
          amountPaid: toEditStr(wo.amountPaid),
        };
      }
      setOriginals(origs);
      setEdits({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, category, status, uncostedOnly, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Edit handling ──
  function getFieldValue(woId: string, field: keyof EditableFields): string {
    if (edits[woId] && field in edits[woId]) {
      return edits[woId][field] ?? "";
    }
    return originals[woId]?.[field] ?? "";
  }

  function setFieldValue(
    woId: string,
    field: keyof EditableFields,
    value: string
  ) {
    setEdits((prev) => ({
      ...prev,
      [woId]: {
        ...prev[woId],
        [field]: value,
      },
    }));
    // Clear save result when editing
    if (saveResult) setSaveResult(null);
  }

  // ── Dirty detection ──
  const dirtyRows = useMemo(() => {
    const dirty: Set<string> = new Set();
    for (const [woId, changes] of Object.entries(edits)) {
      const orig = originals[woId];
      if (!orig) continue;
      for (const [key, val] of Object.entries(changes)) {
        if (val !== orig[key as keyof EditableFields]) {
          dirty.add(woId);
          break;
        }
      }
    }
    return dirty;
  }, [edits, originals]);

  const dirtyCount = dirtyRows.size;

  // ── Computed values per row ──
  function getRowComputedValues(woId: string) {
    const invoiceAmount = toNum(getFieldValue(woId, "invoiceAmount"));
    const crewTotal = toNum(getFieldValue(woId, "crewTotal"));
    const materialCost = toNum(getFieldValue(woId, "materialCost"));
    const subCost = toNum(getFieldValue(woId, "subCost"));
    const dumpCost = toNum(getFieldValue(woId, "dumpCost"));
    const fuelCost = toNum(getFieldValue(woId, "fuelCost"));
    const totalIndirectExpense = toNum(
      getFieldValue(woId, "totalIndirectExpense")
    );

    const totalDirect = crewTotal + materialCost + subCost + dumpCost + fuelCost;
    const totalExpense = totalDirect + totalIndirectExpense;
    const profit = invoiceAmount - totalExpense;
    const profitPercent = invoiceAmount > 0 ? (profit / invoiceAmount) * 100 : 0;

    return { totalDirect, profit, profitPercent };
  }

  // ── Save ──
  async function handleSave() {
    if (dirtyCount === 0) return;

    setSaving(true);
    setSaveResult(null);

    try {
      // Use explicit empty-string check — `|| null` erases valid zero values
      const numOrNull = (woId: string, field: keyof EditableFields): number | null => {
        const raw = getFieldValue(woId, field);
        return raw === "" ? null : toNum(raw);
      };

      const updates = Array.from(dirtyRows).map((woId) => ({
        id: woId,
        invoiceNumber: getFieldValue(woId, "invoiceNumber") || null,
        invoiceAmount: numOrNull(woId, "invoiceAmount"),
        estCrewTotal: numOrNull(woId, "estCrewTotal"),
        crewTotal: numOrNull(woId, "crewTotal"),
        materialCost: numOrNull(woId, "materialCost"),
        subCost: numOrNull(woId, "subCost"),
        dumpCost: numOrNull(woId, "dumpCost"),
        fuelCost: numOrNull(woId, "fuelCost"),
        totalIndirectExpense: numOrNull(woId, "totalIndirectExpense"),
        amountPaid: numOrNull(woId, "amountPaid"),
      }));

      const res = await fetch("/api/jobs/bulk-costing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const result = await res.json();
      setSaveResult({
        type: "success",
        message: `Saved ${result.updatedCount} job${result.updatedCount === 1 ? "" : "s"} successfully.`,
      });

      // Re-fetch to get fresh data
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes";
      setSaveResult({ type: "error", message });
    } finally {
      setSaving(false);
    }
  }

  // ── Filter change handlers (reset page) ──
  function handleYearChange(v: string) {
    setYear(v);
    setPage(1);
  }
  function handleCategoryChange(v: string) {
    setCategory(v);
    setPage(1);
  }
  function handleStatusChange(v: string) {
    setStatus(v);
    setPage(1);
  }
  function handleUncostedToggle() {
    setUncostedOnly((p) => !p);
    setPage(1);
  }

  // ── Render ──
  const workOrders = data?.workOrders ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const availableYears = data?.availableYears ?? [];

  const startItem = totalCount > 0 ? (page - 1) * 50 + 1 : 0;
  const endItem = Math.min(page * 50, totalCount);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/portal/costing">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Bulk Job Costing
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount.toLocaleString()} job{totalCount !== 1 && "s"}
              {uncostedOnly && " without costing data"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dirtyCount > 0 && (
            <span className="text-sm font-medium text-amber-600">
              {dirtyCount} row{dirtyCount !== 1 && "s"} modified
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={dirtyCount === 0 || saving}
            className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* ── Save result toast ── */}
      {saveResult && (
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium",
            saveResult.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          <span>{saveResult.message}</span>
          <button
            onClick={() => setSaveResult(null)}
            className="p-0.5 hover:opacity-70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

        {/* Year */}
        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className="h-8 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          <option value="">All Years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="h-8 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          {JOB_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-8 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Uncosted toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={uncostedOnly}
            onClick={handleUncostedToggle}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
              uncostedOnly ? "bg-brand" : "bg-secondary"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                uncostedOnly ? "translate-x-[18px]" : "translate-x-[3px]"
              )}
            />
          </button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Uncosted only
          </span>
        </label>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : workOrders.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {year || category || status || uncostedOnly
              ? "No jobs match your filters."
              : "No jobs found."}
          </p>
          {(year || category || status || uncostedOnly) && (
            <button
              onClick={() => {
                setYear("");
                setCategory("");
                setStatus("");
                setUncostedOnly(false);
                setPage(1);
              }}
              className="mt-2 text-sm text-brand hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            ref={tableRef}
            className="border border-border rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1600px]">
                <thead>
                  <tr className="bg-secondary/50 text-left">
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-secondary/50 z-10 border-r border-border">
                      WO #
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                      Customer
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                      Type
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-center">
                      Invoice #
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Invoice Amt
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Est. Crew
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Crew Total
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Material
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Sub
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Dump
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Fuel
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right bg-secondary/80">
                      Direct
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Indirect
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right bg-secondary/80">
                      Profit
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right bg-secondary/80">
                      %
                    </th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workOrders.map((wo) => {
                    const isDirty = dirtyRows.has(wo.id);
                    const computed = getRowComputedValues(wo.id);

                    return (
                      <tr
                        key={wo.id}
                        className={cn(
                          "hover:bg-secondary/20 transition-colors",
                          isDirty && "border-l-[3px] border-l-amber-400"
                        )}
                      >
                        {/* WO # - sticky */}
                        <td className="px-2 py-0.5 sticky left-0 bg-card z-10 border-r border-border">
                          <Link
                            href={`/portal/jobs/${wo.id}`}
                            className="font-medium text-brand hover:underline whitespace-nowrap"
                          >
                            {wo.workOrderNumber}
                          </Link>
                        </td>

                        {/* Customer */}
                        <td className="px-2 py-0.5 max-w-[140px] truncate text-foreground">
                          {wo.customer.name}
                        </td>

                        {/* Type */}
                        <td className="px-2 py-0.5 text-muted-foreground max-w-[100px] truncate">
                          {categoryLabel(wo.jobCategory)}
                        </td>

                        {/* Date */}
                        <td className="px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                          {fmtDate(wo.projectStartDate)}
                        </td>

                        {/* Invoice # */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "invoiceNumber")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "invoiceNumber", v)
                            }
                            align="center"
                          />
                        </td>

                        {/* Invoice Amount */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "invoiceAmount")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "invoiceAmount", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Est Crew Total */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "estCrewTotal")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "estCrewTotal", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Crew Total */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "crewTotal")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "crewTotal", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Material Cost */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "materialCost")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "materialCost", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Sub Cost */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "subCost")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "subCost", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Dump */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "dumpCost")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "dumpCost", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Fuel */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "fuelCost")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "fuelCost", v)
                            }
                            type="number"
                          />
                        </td>

                        {/* Total Direct (calc) */}
                        <td className="px-2 py-0.5 text-right tabular-nums font-medium text-foreground bg-secondary/30 whitespace-nowrap">
                          {computed.totalDirect > 0
                            ? fmtCurrency(computed.totalDirect)
                            : "--"}
                        </td>

                        {/* Indirect */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(
                              wo.id,
                              "totalIndirectExpense"
                            )}
                            onChange={(v) =>
                              setFieldValue(
                                wo.id,
                                "totalIndirectExpense",
                                v
                              )
                            }
                            type="number"
                          />
                        </td>

                        {/* Profit (calc) */}
                        <td
                          className={cn(
                            "px-2 py-0.5 text-right tabular-nums font-medium bg-secondary/30 whitespace-nowrap",
                            computed.profit > 0
                              ? "text-green-600"
                              : computed.profit < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {toNum(getFieldValue(wo.id, "invoiceAmount")) > 0
                            ? fmtCurrency(computed.profit)
                            : "--"}
                        </td>

                        {/* Profit % (calc) */}
                        <td
                          className={cn(
                            "px-2 py-0.5 text-right tabular-nums font-medium bg-secondary/30 whitespace-nowrap",
                            computed.profitPercent > 0
                              ? "text-green-600"
                              : computed.profitPercent < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {toNum(getFieldValue(wo.id, "invoiceAmount")) > 0
                            ? `${computed.profitPercent.toFixed(1)}%`
                            : "--"}
                        </td>

                        {/* Paid */}
                        <td className="px-0.5 py-0.5">
                          <CellInput
                            value={getFieldValue(wo.id, "amountPaid")}
                            onChange={(v) =>
                              setFieldValue(wo.id, "amountPaid", v)
                            }
                            type="number"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="text-muted-foreground whitespace-nowrap">
              {startItem}--{endItem} of {totalCount.toLocaleString()}
            </p>

            <div className="flex items-center gap-1">
              <PaginationButton
                onClick={() => setPage(1)}
                disabled={page <= 1}
                label="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </PaginationButton>
              <PaginationButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </PaginationButton>

              <PageNumbers
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />

              <PaginationButton
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </PaginationButton>
              <PaginationButton
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                label="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </PaginationButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CellInput — compact spreadsheet-style input
   ───────────────────────────────────────────────────────── */

function CellInput({
  value,
  onChange,
  type = "text",
  align = "right",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <input
      type={type === "number" ? "text" : "text"}
      inputMode={type === "number" ? "decimal" : "text"}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (type === "number") {
          // Allow empty, digits, one decimal, optional leading minus
          if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
            onChange(v);
          }
        } else {
          onChange(v);
        }
      }}
      className={cn(
        "w-full h-7 px-1.5 rounded border border-transparent bg-transparent text-xs tabular-nums text-foreground",
        "hover:border-border focus:border-brand focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand/30",
        "transition-colors placeholder:text-muted-foreground/40",
        alignClass
      )}
      placeholder={type === "number" ? "0" : ""}
    />
  );
}

