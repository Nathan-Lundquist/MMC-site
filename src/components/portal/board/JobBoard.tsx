"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { BOARD_COLUMNS, BOARD_MOVE_ROLES } from "@/lib/constants";
import JobCard from "./JobCard";
import NewJobSheet from "./NewJobSheet";
import type { BoardJob, Option } from "./types";

const POLL_INTERVAL_MS = 60_000;
const POLL_FAILURE_THRESHOLD = 3;
type Status = (typeof BOARD_COLUMNS)[number]["status"];
const STATUS_ORDER: Status[] = BOARD_COLUMNS.map((c) => c.status);

export default function JobBoard({
  initialJobs,
  userRole,
  customers,
  foremen,
}: {
  initialJobs: BoardJob[];
  userRole: string;
  customers: Option[];
  foremen: Option[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pollFailures, setPollFailures] = useState(0);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdsRef = useRef(pendingIds);

  const canMove = (BOARD_MOVE_ROLES as readonly string[]).includes(userRole);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  useEffect(() => {
    pendingIdsRef.current = pendingIds;
  }, [pendingIds]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/board/jobs");
      if (!res.ok) throw new Error("refresh failed");
      const data: BoardJob[] = await res.json();
      // Keep the optimistic local state for any job with a move still in flight — otherwise a
      // poll/focus refresh landing mid-move overwrites it with the pre-move server state and
      // the card visibly snaps back before the PATCH response arrives.
      setJobs((prev) => {
        const pending = pendingIdsRef.current;
        if (pending.size === 0) return data;
        const pendingById = new Map(prev.filter((j) => pending.has(j.id)).map((j) => [j.id, j]));
        return data.map((j) => pendingById.get(j.id) ?? j);
      });
      setPollFailures(0);
    } catch {
      setPollFailures((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const moveJob = useCallback(
    async (jobId: string, fromStatus: Status, toStatus: Status) => {
      setPendingIds((prev) => new Set(prev).add(jobId));
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: toStatus } : j)));
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: toStatus, fromStatus }),
        });
        if (!res.ok) {
          if (res.status === 409) {
            showNotice("This job was already updated — refreshing the board.");
          } else if (res.status === 403) {
            showNotice("You don't have permission to move this job.");
          } else {
            showNotice("Failed to move this job.");
          }
          setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: fromStatus } : j)));
          refresh();
          return;
        }
      } catch {
        showNotice("Network error — the board will refresh shortly.");
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: fromStatus } : j)));
        refresh();
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }
    },
    [showNotice, refresh]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId) return;
      moveJob(draggableId, source.droppableId as Status, destination.droppableId as Status);
    },
    [moveJob]
  );

  const columns = useMemo(
    () =>
      BOARD_COLUMNS.map((col) => ({
        ...col,
        jobs: jobs.filter((j) => j.status === col.status),
      })),
    [jobs]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold text-foreground">Board</h1>
          {!canMove && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              View only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pollFailures >= POLL_FAILURE_THRESHOLD && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              Unable to refresh
            </span>
          )}
          {canMove && (
            <Button
              size="sm"
              className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2"
              onClick={() => setSheetOpen(true)}
            >
              <Plus className="w-4 h-4" />
              New Job
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertCircle size={14} /> {notice}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {columns.map((col) => (
            <Droppable key={col.status} droppableId={col.status} isDropDisabled={!canMove}>
              {(provided) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <h2 className="font-display text-sm font-semibold text-foreground">
                      {col.label}
                    </h2>
                    <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {col.jobs.length}
                    </span>
                  </div>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[60px]"
                  >
                    {col.jobs.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">
                        No jobs in {col.label}
                      </p>
                    ) : (
                      col.jobs.map((job, index) => (
                        <Draggable
                          key={job.id}
                          draggableId={job.id}
                          index={index}
                          isDragDisabled={!canMove || pendingIds.has(job.id)}
                        >
                          {(dragProvided) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                              <JobCard
                                job={job}
                                canMove={canMove}
                                isPending={pendingIds.has(job.id)}
                                canRevert={STATUS_ORDER.indexOf(job.status) > 0}
                                canAdvance={STATUS_ORDER.indexOf(job.status) < STATUS_ORDER.length - 1}
                                onAdvance={() => {
                                  const i = STATUS_ORDER.indexOf(job.status);
                                  moveJob(job.id, job.status, STATUS_ORDER[i + 1]);
                                }}
                                onRevert={() => {
                                  const i = STATUS_ORDER.indexOf(job.status);
                                  moveJob(job.id, job.status, STATUS_ORDER[i - 1]);
                                }}
                                dragHandleProps={dragProvided.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <NewJobSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        customers={customers}
        foremen={foremen}
        onCreated={(job) => setJobs((prev) => [job, ...prev])}
      />
    </div>
  );
}
