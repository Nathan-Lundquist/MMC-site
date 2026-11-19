"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { SPRING_SUMMER_CATEGORIES } from "@/lib/job-categories";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...SPRING_SUMMER_CATEGORIES,
];

interface LandscapeToolbarProps {
  years: number[];
  currentSearch: string;
  currentCategory: string;
  currentYear: string;
}

export default function LandscapeToolbar({
  years,
  currentSearch,
  currentCategory,
  currentYear,
}: LandscapeToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync search value when URL changes externally
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change, keep the active/closed tab
    params.delete("page");
    startTransition(() => {
      router.push(`/portal/landscape?${params.toString()}`);
    });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams("q", value.trim());
    }, 300);
  }

  function clearSearch() {
    setSearchValue("");
    updateParams("q", "");
    inputRef.current?.focus();
  }

  function clearAllFilters() {
    setSearchValue("");
    const params = new URLSearchParams();
    const tab = searchParams.get("tab");
    if (tab) params.set("tab", tab);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/portal/landscape${qs ? `?${qs}` : ""}`);
    });
  }

  const hasFilters = currentSearch || currentCategory || currentYear;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search by customer, WO #, or job type..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm"
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={currentCategory}
          onChange={(e) => updateParams("category", e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={currentYear}
          onChange={(e) => updateParams("year", e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {(hasFilters || isPending) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
