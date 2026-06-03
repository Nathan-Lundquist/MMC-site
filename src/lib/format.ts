/**
 * Format a number (or Prisma Decimal) as USD currency string.
 * Returns "—" for null/undefined/NaN.
 */
export function formatCurrency(value: number | { toNumber?: () => number } | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a date string or Date object as a short locale date.
 * Returns "—" for null/undefined.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a status enum value for display (replace underscores with spaces).
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}
