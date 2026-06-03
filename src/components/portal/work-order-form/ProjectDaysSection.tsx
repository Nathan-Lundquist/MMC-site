"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, CalendarDays } from "lucide-react";
import type { TimeRow } from "./types";
import { todayLocal, timeNow, summarizeDays, fmtDate, updateRow, removeRow } from "./helpers";
import { MobileInput, Field, NowBtn, TodayBtn, RowDelete, EmptyState, GroupHeading } from "./form-ui";

interface Props {
  timeRows: TimeRow[];
  setTimeRows: React.Dispatch<React.SetStateAction<TimeRow[]>>;
}

export function ProjectDaysSection({ timeRows, setTimeRows }: Props) {
  const daySummary = useMemo(() => summarizeDays(timeRows), [timeRows]);

  return (
    <>
      <GroupHeading>Project Days</GroupHeading>
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Daily Log
            </h3>
            {daySummary && (
              <>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                  <CalendarDays className="w-3 h-3" />
                  {daySummary.uniqueDays} day{daySummary.uniqueDays !== 1 && "s"}
                </span>
                {daySummary.uniqueDays > 1 && (
                  <span className="text-[11px] text-muted-foreground">
                    {fmtDate(daySummary.first)} &ndash; {fmtDate(daySummary.last)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setTimeRows((p) => [
              ...p,
              { date: todayLocal(), startTime: timeNow(), endTime: "" },
            ])
          }
          className="w-full h-12 text-sm font-medium gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Today
        </Button>

        {timeRows.length === 0 && (
          <EmptyState text="No days logged yet. Tap Log Today each day the crew is on site." />
        )}

        {timeRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Day {i + 1}
                {row.date && ` — ${fmtDate(row.date)}`}
              </span>
              <RowDelete onClick={() => removeRow(setTimeRows, i)} />
            </div>
            <Field label="Date" action={<TodayBtn onClick={() => updateRow(setTimeRows, i, "date", todayLocal())} />}>
              <MobileInput
                type="date"
                value={row.date}
                onChange={(e) => updateRow(setTimeRows, i, "date", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" action={<NowBtn onClick={() => updateRow(setTimeRows, i, "startTime", timeNow())} />}>
                <MobileInput
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateRow(setTimeRows, i, "startTime", e.target.value)}
                />
              </Field>
              <Field label="End" action={<NowBtn onClick={() => updateRow(setTimeRows, i, "endTime", timeNow())} />}>
                <MobileInput
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateRow(setTimeRows, i, "endTime", e.target.value)}
                />
              </Field>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
