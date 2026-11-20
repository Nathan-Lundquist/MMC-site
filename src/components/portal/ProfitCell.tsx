import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function ProfitCell({
  profit,
  profitPct,
}: {
  profit: number | null;
  profitPct: number | null;
}) {
  if (profit === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isPositive = profit >= 0;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";

  return (
    <span className={cn("font-medium", colorClass)}>
      {formatCurrency(profit)}
      {profitPct !== null && (
        <span className="text-xs ml-1 opacity-70">
          ({profitPct.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}
