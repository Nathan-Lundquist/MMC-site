import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { ChangeRequestStatusToggle } from "@/components/portal/change-requests/ChangeRequestStatusToggle";
import { MessageSquarePlus, MailWarning } from "lucide-react";

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ChangeRequestsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/portal");
  }

  const requests = await prisma.changeRequest.findMany({
    include: { employee: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const open = requests.filter((r) => r.status === "OPEN");
  const done = requests.filter((r) => r.status === "DONE");

  function renderRow(r: (typeof requests)[number]) {
    return (
      <div key={r.id} className="px-4 py-3 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-foreground whitespace-pre-wrap">{r.note}</p>
          <ChangeRequestStatusToggle id={r.id} initialStatus={r.status} />
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{r.page}</span>
          <span>·</span>
          <span>{r.employee.name}</span>
          <span>·</span>
          <span>{formatTimestamp(r.createdAt)}</span>
          {!r.notifiedAt && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <MailWarning className="w-3 h-3" />
              Notification failed
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Change Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Page-tagged notes submitted from the portal
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquarePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No change requests yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Open
            </h2>
            <Card className="overflow-hidden">
              {open.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">
                  No open items — nice work.
                </p>
              ) : (
                <div className="divide-y divide-border">{open.map(renderRow)}</div>
              )}
            </Card>
          </div>

          {done.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Done
              </h2>
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">{done.map(renderRow)}</div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
