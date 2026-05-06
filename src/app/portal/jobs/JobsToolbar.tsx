"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";

const JOB_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "LANDSCAPE", label: "Landscape" },
  { value: "FALL_CLEANUP", label: "Fall Cleanup" },
  { value: "SPRING_CLEANUP", label: "Spring Cleanup" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "IN_HOUSE_REPAIR", label: "In-House Repair" },
  { value: "BED_MAINTENANCE", label: "Bed Maintenance" },
  { value: "SPRINKLER", label: "Sprinkler" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "HARDSCAPE", label: "Hardscape" },
  { value: "OTHER", label: "Other" },
] as const;

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

interface JobsToolbarProps {
  years: number[];
  currentSearch: string;
  currentCategory: string;
  currentStatus: string;
  currentYear: string;
}

export default function JobsToolbar({
  years,
  currentSearch,
  currentCategory,
  currentStatus,
  currentYear,
}: JobsToolbarProps) {
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
    // Reset to page 1 when filters change
    params.delete("page");
    startTransition(() => {
      router.push(`/portal/jobs?${params.toString()}`);
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
    startTransition(() => {
      router.push("/portal/jobs");
    });
  }

  const hasFilters = currentSearch || currentCategory || currentStatus || currentYear;

  return (
    <div className="space-y-3">
      {/* Search + Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
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

        {/* Category Filter */}
        <select
          value={currentCategory}
          onChange={(e) => updateParams("category", e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
        >
          {JOB_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateParams("status", e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Year Filter */}
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

      {/* Active filters indicator */}
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
