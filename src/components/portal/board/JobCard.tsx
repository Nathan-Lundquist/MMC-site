"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { BoardJob } from "./types";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

export default function JobCard({
  job,
  canMove,
  isPending,
  canRevert,
  canAdvance,
  onAdvance,
  onRevert,
  dragHandleProps,
}: {
  job: BoardJob;
  canMove: boolean;
  isPending: boolean;
  canRevert: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
  onRevert: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-3 space-y-2 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {canMove && (
          <span
            {...dragHandleProps}
            className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to move"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        )}
        <Link href={`/portal/jobs/${job.id}`} className="flex-1 min-w-0 group">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground group-hover:text-brand transition-colors truncate">
              {job.customerName}
            </span>
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {job.workOrderNumber} &middot; {job.jobType}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
            <span>{job.foreman?.name || "Unassigned"}</span>
            <span>{job.projectStartDate ? formatDate(job.projectStartDate) : "Unscheduled"}</span>
          </div>
        </Link>
      </div>
      {canMove && (
        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50 sm:hidden">
          <button
            type="button"
            onClick={onRevert}
            disabled={!canRevert || isPending}
            className="p-1.5 rounded text-muted-foreground disabled:opacity-30 hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Move back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onAdvance}
            disabled={!canAdvance || isPending}
            className="p-1.5 rounded text-muted-foreground disabled:opacity-30 hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Advance"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
