/**
 * Format a number as USD currency string.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format a date string or Date object as a short locale date (MM/DD/YYYY).
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a status enum value for display (replace underscores with spaces).
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}
