import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
        size === "xs" ? "text-[10px]" : "text-xs",
        STATUS_COLORS[status] || STATUS_COLORS.DRAFT
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
