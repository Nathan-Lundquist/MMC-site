import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { changeRequestStatusSchema } from "@/lib/schemas";
import { CHANGE_REQUEST_ROLES } from "@/lib/constants";

// PATCH /api/change-requests/[id] — ADMIN updates a change request's status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth([...CHANGE_REQUEST_ROLES]);
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

  try {
    const updated = await prisma.changeRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Change request not found" }, { status: 404 });
    }
    throw err;
  }
}
