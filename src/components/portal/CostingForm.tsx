"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

/* ── Types ──────────────────────────────────────────────── */

export interface CostingWorkOrder {
  id: string;
  workOrderNumber: string;
  jobType: string;
  status: string;
  projectStartDate: string | null;
  customerName: string;
  totalManHours: number;
  // Existing costing data
  invoiceNumber: string | null;
  invoiceAmount: number | null;
  estCrewWage: number | null;
  estHours: number | null;
  estCrewTotal: number | null;
  crewWage: number | null;
  actualHours: number | null;
  crewTotal: number | null;
  materialCost: number | null;
  subCost: number | null;
  dumpCost: number | null;
  fuelCost: number | null;
  totalDirectExpense: number | null;
  totalIndirectExpense: number | null;
  profit: number | null;
  profitPercent: number | null;
  amountPaid: number | null;
  datePaid: string | null;
  amountOwed: number | null;
}

/* ── Helpers ────────────────────────────────────────────── */

function n(v: string): number {
  const parsed = parseFloat(v);
  return isNaN(parsed) ? 0 : parsed;
}

function fmt(v: number): string {
  return v.toFixed(2);
}

function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  id: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
        $
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || "0.00"}
        readOnly={readOnly}
        className={`pl-7 ${readOnly ? "bg-muted/50 cursor-default" : ""}`}
      />
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

export function CostingForm({ workOrder }: { workOrder: CostingWorkOrder }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invoice
  const [invoiceNumber, setInvoiceNumber] = useState(
    workOrder.invoiceNumber || ""
  );
  const [invoiceAmount, setInvoiceAmount] = useState(
    workOrder.invoiceAmount != null ? String(workOrder.invoiceAmount) : ""
  );

  // Estimates
  const [estCrewWage, setEstCrewWage] = useState(
    workOrder.estCrewWage != null ? String(workOrder.estCrewWage) : ""
  );
  const [estHours, setEstHours] = useState(
    workOrder.estHours != null ? String(workOrder.estHours) : ""
  );

  // Actuals
  const [crewWage, setCrewWage] = useState(
    workOrder.crewWage != null ? String(workOrder.crewWage) : ""
  );
  const [actualHours, setActualHours] = useState(
    workOrder.actualHours != null ? String(workOrder.actualHours) : ""
  );
  const [materialCost, setMaterialCost] = useState(
    workOrder.materialCost != null ? String(workOrder.materialCost) : ""
  );
  const [subCost, setSubCost] = useState(
    workOrder.subCost != null ? String(workOrder.subCost) : ""
  );
  const [dumpCost, setDumpCost] = useState(
    workOrder.dumpCost != null ? String(workOrder.dumpCost) : ""
  );
  const [fuelCost, setFuelCost] = useState(
    workOrder.fuelCost != null ? String(workOrder.fuelCost) : ""
  );
  const [totalIndirectExpense, setTotalIndirectExpense] = useState(
    workOrder.totalIndirectExpense != null
      ? String(workOrder.totalIndirectExpense)
      : ""
  );

  // Payment
  const [amountPaid, setAmountPaid] = useState(
    workOrder.amountPaid != null ? String(workOrder.amountPaid) : ""
  );
  const [datePaid, setDatePaid] = useState(workOrder.datePaid || "");

  /* ── Auto-calculations ─────────────────────────────────── */

  const estCrewTotal = useMemo(
    () => n(estCrewWage) * n(estHours),
    [estCrewWage, estHours]
  );

  const crewTotal = useMemo(
    () => n(crewWage) * n(actualHours),
    [crewWage, actualHours]
  );

  const totalDirectExpense = useMemo(
    () =>
      crewTotal + n(materialCost) + n(subCost) + n(dumpCost) + n(fuelCost),
    [crewTotal, materialCost, subCost, dumpCost, fuelCost]
  );

  const invoiceVal = useMemo(() => n(invoiceAmount), [invoiceAmount]);
  const indirectVal = useMemo(
    () => n(totalIndirectExpense),
    [totalIndirectExpense]
  );
  const profit = useMemo(
    () => invoiceVal - totalDirectExpense - indirectVal,
    [invoiceVal, totalDirectExpense, indirectVal]
  );
  const profitPercent = useMemo(
    () => (invoiceVal > 0 ? (profit / invoiceVal) * 100 : 0),
    [profit, invoiceVal]
  );

  const amountOwed = useMemo(
    () => invoiceVal - n(amountPaid),
    [invoiceVal, amountPaid]
  );

  /* ── Status colors ─────────────────────────────────────── */

  const statusColors: Record<string, string> = {
    DRAFT: "bg-secondary text-secondary-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-brand/10 text-brand",
    PAID: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-destructive/10 text-destructive",
  };

  /* ── Submit ────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        invoiceNumber: invoiceNumber || null,
        invoiceAmount: invoiceAmount ? parseFloat(invoiceAmount) : null,
        estCrewWage: estCrewWage ? parseFloat(estCrewWage) : null,
        estHours: estHours ? parseFloat(estHours) : null,
        estCrewTotal: estCrewTotal || null,
        crewWage: crewWage ? parseFloat(crewWage) : null,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        crewTotal: crewTotal || null,
        materialCost: materialCost ? parseFloat(materialCost) : null,
        subCost: subCost ? parseFloat(subCost) : null,
        dumpCost: dumpCost ? parseFloat(dumpCost) : null,
        fuelCost: fuelCost ? parseFloat(fuelCost) : null,
        totalDirectExpense: totalDirectExpense || null,
        totalIndirectExpense: totalIndirectExpense
          ? parseFloat(totalIndirectExpense)
          : null,
        profit: profit || null,
        profitPercent: profitPercent || null,
        amountPaid: amountPaid ? parseFloat(amountPaid) : null,
        datePaid: datePaid || null,
        amountOwed: amountOwed || null,
      };

      const res = await fetch(`/api/jobs/${workOrder.id}/costing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save costing data");
      }

      router.push(`/portal/jobs/${workOrder.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Job Header (read-only) ─────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Job Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">WO #</div>
            <div className="font-medium">{workOrder.workOrderNumber}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Customer</div>
            <div className="font-medium">{workOrder.customerName}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Job Type</div>
            <div className="font-medium">{workOrder.jobType}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Date</div>
            <div className="font-medium">
              {workOrder.projectStartDate
                ? new Date(workOrder.projectStartDate).toLocaleDateString()
                : "--"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Status</div>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[workOrder.status] || statusColors.DRAFT}`}
            >
              {workOrder.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Total Man Hours</div>
            <div className="font-medium">{workOrder.totalManHours}</div>
          </div>
        </div>
      </Card>

      {/* ── Invoice Section ────────────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Invoice
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceAmount">Invoice Amount</Label>
            <CurrencyInput
              id="invoiceAmount"
              value={invoiceAmount}
              onChange={setInvoiceAmount}
            />
          </div>
        </div>
      </Card>

      {/* ── Estimates Section ──────────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Estimates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estCrewWage">Est. Crew Wage ($/hr)</Label>
            <CurrencyInput
              id="estCrewWage"
              value={estCrewWage}
              onChange={setEstCrewWage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estHours">Est. Hours</Label>
            <Input
              id="estHours"
              type="text"
              inputMode="decimal"
              value={estHours}
              onChange={(e) => setEstHours(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estCrewTotal">Est. Crew Total</Label>
            <CurrencyInput
              id="estCrewTotal"
              value={estCrewTotal ? fmt(estCrewTotal) : ""}
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* ── Actual Costs Section ───────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Actual Costs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crewWage">Crew Wage ($/hr)</Label>
            <CurrencyInput
              id="crewWage"
              value={crewWage}
              onChange={setCrewWage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actualHours">Actual Hours</Label>
            <Input
              id="actualHours"
              type="text"
              inputMode="decimal"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crewTotal">Crew Total</Label>
            <CurrencyInput
              id="crewTotal"
              value={crewTotal ? fmt(crewTotal) : ""}
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="materialCost">Material Cost</Label>
            <CurrencyInput
              id="materialCost"
              value={materialCost}
              onChange={setMaterialCost}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subCost">Subcontractor Cost</Label>
            <CurrencyInput
              id="subCost"
              value={subCost}
              onChange={setSubCost}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dumpCost">Dump Cost</Label>
            <CurrencyInput
              id="dumpCost"
              value={dumpCost}
              onChange={setDumpCost}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelCost">Fuel Cost</Label>
            <CurrencyInput
              id="fuelCost"
              value={fuelCost}
              onChange={setFuelCost}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label htmlFor="totalDirectExpense">Total Direct Expense</Label>
            <CurrencyInput
              id="totalDirectExpense"
              value={totalDirectExpense ? fmt(totalDirectExpense) : ""}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalIndirectExpense">
              Total Indirect Expense (Overhead)
            </Label>
            <CurrencyInput
              id="totalIndirectExpense"
              value={totalIndirectExpense}
              onChange={setTotalIndirectExpense}
            />
          </div>
        </div>
      </Card>

      {/* ── Profit Summary (read-only) ─────────────────────── */}
      <Card
        className={`p-4 ${
          invoiceVal > 0
            ? profit >= 0
              ? "ring-green-500/30"
              : "ring-red-500/30"
            : ""
        }`}
      >
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Profit Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Profit</div>
            <div
              className={`text-2xl font-bold ${
                invoiceVal > 0
                  ? profit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {invoiceVal > 0 ? `$${fmt(profit)}` : "--"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Profit %</div>
            <div
              className={`text-2xl font-bold ${
                invoiceVal > 0
                  ? profitPercent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {invoiceVal > 0 ? `${profitPercent.toFixed(1)}%` : "--"}
            </div>
          </div>
        </div>
        {invoiceVal > 0 && (
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            Invoice ${fmt(invoiceVal)} &minus; Direct ${fmt(totalDirectExpense)}{" "}
            &minus; Indirect ${fmt(indirectVal)} = Profit ${fmt(profit)}
          </div>
        )}
      </Card>

      {/* ── Payment Section ────────────────────────────────── */}
      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">
          Payment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <CurrencyInput
              id="amountPaid"
              value={amountPaid}
              onChange={setAmountPaid}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="datePaid">Date Paid</Label>
            <Input
              id="datePaid"
              type="date"
              value={datePaid}
              onChange={(e) => setDatePaid(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amountOwed">Amount Owed</Label>
            <CurrencyInput
              id="amountOwed"
              value={invoiceVal > 0 ? fmt(amountOwed) : ""}
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link href={`/portal/jobs/${workOrder.id}`}>
          <Button type="button" variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={saving}
          className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Costing"}
        </Button>
      </div>
    </form>
  );
}
