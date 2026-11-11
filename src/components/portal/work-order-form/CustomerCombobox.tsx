"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MobileInput } from "./form-ui";

interface Props {
  customers: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * Type-to-search customer picker — replaces a single giant <select> that
 * required scrolling through ~1000 alphabetical options. Typing filters the
 * list; a match only commits on click/Enter, so clicking away without
 * picking one just reverts the text to whatever was already selected
 * (never silently clears a valid selection).
 */
export function CustomerCombobox({ customers, value, onChange }: Props) {
  const selected = useMemo(() => customers.find((c) => c.id === value), [customers, value]);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the displayed text in sync when `value` changes from outside this
  // component (e.g. edit-mode initial load). Adjusting state during render
  // (React's documented pattern for this) rather than in an effect, so it
  // doesn't cost an extra render pass.
  const [syncedId, setSyncedId] = useState(value);
  if (value !== syncedId) {
    setSyncedId(value);
    setQuery(selected?.name ?? "");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q === "" ? customers : customers.filter((c) => c.name.toLowerCase().includes(q));
    return matches.slice(0, 50);
  }, [customers, query]);

  function select(c: { id: string; name: string }) {
    onChange(c.id);
    setQuery(c.name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const match = filtered[highlighted];
      if (match) select(match);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected?.name ?? "");
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <MobileInput
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type to search customers..."
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matching customers</p>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(c)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors",
                  i === highlighted && "bg-secondary",
                  c.id === value && "text-brand font-medium"
                )}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
