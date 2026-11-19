import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { PHOTO_DELETE_ROLES } from "@/lib/constants";

// DELETE /api/photos/[id] — remove a before/after job photo (ADMIN/MANAGER only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth([...PHOTO_DELETE_ROLES]);
  if (authError) return authError;

  const { id } = await params;

  try {
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Blob delete must succeed before the DB row is removed — a failed blob
    // delete leaves the row intact rather than orphaning a deleted blob with
    // a dangling DB reference.
    await del(photo.imagePath);

    try {
      await prisma.photo.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        // Already deleted by a concurrent request — the blob is gone either way.
        return new NextResponse(null, { status: 204 });
      }
      console.error(
        `Photo ${id}: blob deleted but DB row delete failed — row is now orphaned, pointing at a removed blob:`,
        err
      );
      return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Photo delete failed:", err);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
