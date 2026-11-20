import { MaterialCategory } from "@prisma/client";

export const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: "BULK_MATERIAL_SOD", label: "Bulk Material / Sod" },
  { value: "SEED_FERTILIZER", label: "Seed / Fertilizer" },
  { value: "EDGING_FABRIC_PINS", label: "Edging / Fabric / Pins / Etc" },
  { value: "DRAINAGE_SUPPLIES", label: "Drainage Supplies" },
  { value: "SPRINKLER_SUPPLIES", label: "Sprinkler Supplies" },
  { value: "HARDSCAPE_OTHER_SUPPLIES", label: "Hardscape / Other Supplies" },
];

export function materialCategoryLabel(category: string | null | undefined) {
  if (!category) return null;
  return MATERIAL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
