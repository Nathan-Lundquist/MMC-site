"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export function MobileSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base sm:text-sm sm:h-9"
    >
      {children}
    </select>
  );
}

export function CategorySelect({
  value,
  onChange,
  options,
  placeholder = "Select category...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <MobileSelect value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((cat) => (
        <option key={cat.value} value={cat.value}>
          {cat.label}
        </option>
      ))}
    </MobileSelect>
  );
}

export function MobileInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-11 text-base sm:h-9 sm:text-sm ${props.className || ""}`}
    />
  );
}

export function SectionHeader({
  title,
  onAdd,
  addLabel,
  count,
}: {
  title: string;
  onAdd: () => void;
  addLabel?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="font-display text-sm font-semibold text-foreground truncate">
          {title}
        </h3>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full shrink-0">
            {count}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="gap-1.5 text-xs shrink-0 h-9"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel || "Add"}
      </Button>
    </div>
  );
}

export function RowDelete({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors w-10 h-10 rounded-md shrink-0"
      title="Remove"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export function NowBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
    >
      <Clock className="w-3.5 h-3.5" />
      Now
    </Button>
  );
}

export function TodayBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
    >
      <CalendarDays className="w-3.5 h-3.5" />
      Today
    </Button>
  );
}

export function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-base font-bold text-foreground pt-2">
      {children}
    </h2>
  );
}

export function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(count > 0);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left active:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-display text-sm font-semibold text-foreground">
            {title}
          </span>
          {count > 0 && (
            <span className="text-[10px] font-medium bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </Card>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-1">{text}</p>;
}

// ── Dense desktop table primitives ──────────────────────────
// Zoho-style spreadsheet layout for repeatable rows: a flat table with
// borderless inline cells on sm:+ screens. Mobile keeps the card-based
// layout (rendered separately, hidden on sm:+) — the crew uses phones in
// the field, and a dense table doesn't work there.

export function DenseTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-secondary/60 border-b border-border">
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap"
              >
                {col}
              </th>
            ))}
            <th className="w-9" />
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-8 text-sm border-transparent bg-transparent px-1.5 rounded-sm hover:border-input focus-visible:border-input focus-visible:bg-background transition-colors ${props.className || ""}`}
    />
  );
}

export function TableSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 w-full rounded-sm border border-transparent bg-transparent px-1.5 text-sm text-foreground hover:border-input focus:border-input focus:bg-background transition-colors cursor-pointer ${className || ""}`}
    >
      {children}
    </select>
  );
}

export function TableRowDelete({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors w-8 h-8 rounded-sm"
      title="Remove"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

export function TableAddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline mt-1.5"
    >
      <Plus className="w-3 h-3" />
      {label}
    </button>
  );
}

export function Field({
  label,
  action,
  children,
  className,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {action}
      </div>
      {children}
    </div>
  );
}
