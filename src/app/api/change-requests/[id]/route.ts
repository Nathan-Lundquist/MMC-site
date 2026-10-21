import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { changeRequestStatusSchema } from "@/lib/schemas";

// PATCH /api/change-requests/[id] — ADMIN updates a change request's status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;

  const body = await req.json();
  const parsed = changeRequestStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.changeRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Change request not found" }, { status: 404 });
  }

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
