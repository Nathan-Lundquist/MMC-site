"use client";

import { useState } from "react";
import type { ChangeRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Loader2 } from "lucide-react";

export function ChangeRequestStatusToggle({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: ChangeRequestStatus;
}) {
  const [status, setStatus] = useState<ChangeRequestStatus>(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    const next: ChangeRequestStatus = status === "OPEN" ? "DONE" : "OPEN";
    const previous = status;

    setStatus(next);
    setPending(true);
    setError(false);

    try {
      const res = await fetch(`/api/change-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      setStatus(previous);
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={toggle}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : status === "OPEN" ? (
          "Mark Done"
        ) : (
          "Reopen"
        )}
      </Button>
      {error && <span className="text-xs text-destructive">Couldn&apos;t update</span>}
    </div>
  );
}
