import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { sendMail, escapeHtml as esc } from "@/lib/mail";
import { changeRequestCreateSchema } from "@/lib/schemas";
import { CHANGE_REQUEST_ROLES } from "@/lib/constants";

// POST /api/change-requests — ADMIN submits a page-tagged change request
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth([...CHANGE_REQUEST_ROLES]);
  if (error) return error;

  const body = await req.json();
  const parsed = changeRequestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { note, page } = parsed.data;

  const changeRequest = await prisma.changeRequest.create({
    data: {
      employeeId: session.user.id,
      note,
      page,
    },
    include: {
      employee: { select: { name: true } },
    },
  });

  // Best-effort email notification, deferred until after the response is sent —
  // never blocks or fails the create above, and doesn't add mail-provider
  // latency to every submission.
  after(async () => {
    const notifyEmail = process.env.CHANGE_REQUEST_NOTIFY_EMAIL;
    if (!notifyEmail) {
      console.error("CHANGE_REQUEST_NOTIFY_EMAIL is not set — skipping notification", {
        changeRequestId: changeRequest.id,
      });
      return;
    }

    try {
      const html = `
<h2>New Change Request</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;">
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Submitted by</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(changeRequest.employee.name)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Page</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(page)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Submitted at</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(changeRequest.createdAt.toLocaleString("en-US"))}</td></tr>
<tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Note</td><td style="padding:8px;">${esc(note).replace(/\n/g, "<br>")}</td></tr>
</table>`;

      await sendMail({
        to: notifyEmail,
        subject: `Change Request: ${page.slice(0, 80)}`,
        html,
      });

      await prisma.changeRequest.update({
        where: { id: changeRequest.id },
        data: { notifiedAt: new Date() },
      });
    } catch (err) {
      console.error("Failed to send change-request notification email", {
        changeRequestId: changeRequest.id,
        error: err instanceof Error ? err.message : err,
      });
    }
  });

  return NextResponse.json(changeRequest, { status: 201 });
}
