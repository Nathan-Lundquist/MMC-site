import type { TimeRow } from "./types";

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function summarizeDays(rows: TimeRow[]) {
  const dates = rows.map((r) => r.date).filter(Boolean);
  if (dates.length === 0) return null;
  const unique = [...new Set(dates)].sort();
  return { uniqueDays: unique.length, first: unique[0], last: unique[unique.length - 1] };
}

export function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function updateRow<T>(
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  i: number,
  field: keyof T,
  value: T[keyof T]
) {
  setter((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
}

export function removeRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number) {
  setter((prev) => prev.filter((_, idx) => idx !== i));
}
