"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function CostingTabs({
  active,
  guard,
}: {
  active: "summary" | "bulk";
  /** Return false to block the navigation (e.g. unsaved edits). */
  guard?: () => boolean;
}) {
  const router = useRouter();

  function go(href: string) {
    if (guard && !guard()) return;
    router.push(href);
  }

  return (
    <div className="flex gap-1 border-b border-border">
      {(
        [
          { key: "summary", label: "Summary", href: "/portal/costing" },
          { key: "bulk", label: "Bulk Edit", href: "/portal/costing?tab=bulk" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.key}
          onClick={() => go(tab.href)}
          className={cn(
            "px-3.5 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors",
            active === tab.key
              ? "border-brand text-brand bg-brand/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
