"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { MaterialRow, OutsourcedRow, MaterialCatalogItem } from "./types";
import { updateRow, removeRow } from "./helpers";
import { MobileInput, Field, SectionHeader, RowDelete, EmptyState, GroupHeading } from "./form-ui";

interface Props {
  materialRows: MaterialRow[];
  setMaterialRows: React.Dispatch<React.SetStateAction<MaterialRow[]>>;
  outsourcedRows: OutsourcedRow[];
  setOutsourcedRows: React.Dispatch<React.SetStateAction<OutsourcedRow[]>>;
  materialCatalog: MaterialCatalogItem[];
}

export function MaterialsSection({
  materialRows,
  setMaterialRows,
  outsourcedRows,
  setOutsourcedRows,
  materialCatalog,
}: Props) {
  const inHouseCatalog = materialCatalog.filter((m) => m.kind === "IN_HOUSE");
  const outsourcedCatalog = materialCatalog.filter((m) => m.kind === "OUTSOURCED");

  // When a material name matches a catalog item exactly and the price/units
  // fields are still empty, auto-fill them from the catalog's last-known
  // price — the tech can always overwrite it, which re-saves the catalog's
  // default on submit (see syncMaterialCatalogPrices in work-order-data.ts).
  function applyInHouseCatalogMatch(i: number, name: string) {
    const match = inHouseCatalog.find((m) => m.name.toLowerCase() === name.trim().toLowerCase());
    if (!match) return;
    setMaterialRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        return {
          ...r,
          units: r.units || match.unit || "",
          unitPrice: r.unitPrice || (match.defaultPrice != null ? String(match.defaultPrice) : ""),
        };
      })
    );
  }

  function applyOutsourcedCatalogMatch(i: number, name: string) {
    const match = outsourcedCatalog.find((m) => m.name.toLowerCase() === name.trim().toLowerCase());
    if (!match) return;
    setOutsourcedRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        return {
          ...r,
          unit: r.unit || match.unit || "",
          perUnitCost: r.perUnitCost || (match.defaultPrice != null ? String(match.defaultPrice) : ""),
        };
      })
    );
  }

  return (
    <>
      <GroupHeading>Materials</GroupHeading>

      <datalist id="in-house-material-names">
        {inHouseCatalog.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
      <datalist id="outsourced-material-names">
        {outsourcedCatalog.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>

      <Card className="p-4 space-y-3">
        <SectionHeader title="MCC Materials" count={materialRows.length} onAdd={() =>
          setMaterialRows((p) => [...p, { material: "", qty: "", units: "", unitPrice: "" }])
        } />
        {materialRows.length === 0 && <EmptyState text="No materials listed." />}
        {materialRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setMaterialRows, i)} />
            </div>
            <Field label="Material">
              <MobileInput
                list="in-house-material-names"
                value={row.material}
                onChange={(e) => updateRow(setMaterialRows, i, "material", e.target.value)}
                onBlur={(e) => applyInHouseCatalogMatch(i, e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="QTY">
                <MobileInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setMaterialRows, i, "qty", e.target.value)} />
              </Field>
              <Field label="Units">
                <MobileInput value={row.units} onChange={(e) => updateRow(setMaterialRows, i, "units", e.target.value)} />
              </Field>
              <Field label="Unit Price">
                <MobileInput type="number" step="0.01" value={row.unitPrice} onChange={(e) => updateRow(setMaterialRows, i, "unitPrice", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Outsourced Material" count={outsourcedRows.length} onAdd={() =>
          setOutsourcedRows((p) => [...p, { supplier: "", material: "", qty: "", unit: "", cost: "", perUnitCost: "", taxIncluded: false }])
        } />
        {outsourcedRows.length === 0 && <EmptyState text="No outsourced materials." />}
        {outsourcedRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Material #{i + 1}</span>
              <RowDelete onClick={() => removeRow(setOutsourcedRows, i)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Supplier">
                <MobileInput value={row.supplier} onChange={(e) => updateRow(setOutsourcedRows, i, "supplier", e.target.value)} />
              </Field>
              <Field label="Material">
                <MobileInput
                  list="outsourced-material-names"
                  value={row.material}
                  onChange={(e) => updateRow(setOutsourcedRows, i, "material", e.target.value)}
                  onBlur={(e) => applyOutsourcedCatalogMatch(i, e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="QTY">
                <MobileInput type="number" step="0.01" value={row.qty} onChange={(e) => updateRow(setOutsourcedRows, i, "qty", e.target.value)} />
              </Field>
              <Field label="Unit">
                <MobileInput value={row.unit} onChange={(e) => updateRow(setOutsourcedRows, i, "unit", e.target.value)} />
              </Field>
              <Field label="Cost">
                <MobileInput type="number" step="0.01" value={row.cost} onChange={(e) => updateRow(setOutsourcedRows, i, "cost", e.target.value)} />
              </Field>
              <Field label="Per Unit Cost">
                <MobileInput type="number" step="0.01" value={row.perUnitCost} onChange={(e) => updateRow(setOutsourcedRows, i, "perUnitCost", e.target.value)} />
              </Field>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2.5 h-11 sm:h-9">
                  <Checkbox
                    checked={row.taxIncluded}
                    onCheckedChange={(v) => updateRow(setOutsourcedRows, i, "taxIncluded", !!v)}
                  />
                  <span className="text-sm">Tax Included</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
