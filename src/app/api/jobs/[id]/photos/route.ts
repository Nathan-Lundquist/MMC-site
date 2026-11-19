import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { fileTypeFromBuffer } from "file-type";
import { PhotoType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";
import { toPhotoDTO } from "@/lib/photos";

export const maxDuration = 60;

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic"]);
const VALID_PHOTO_TYPES = new Set<string>(Object.values(PhotoType));

// POST /api/jobs/[id]/photos — upload a before/after job photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: workOrderId } = await params;

  const [workOrder, formData] = await Promise.all([
    prisma.workOrder.findUnique({ where: { id: workOrderId } }),
    req.formData(),
  ]);
  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or HEIC images are accepted" },
      { status: 400 }
    );
  }
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const detectedType = await fileTypeFromBuffer(fileBuffer);
  if (!detectedType || !ACCEPTED_MIME_TYPES.has(detectedType.mime)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or HEIC images are accepted" },
      { status: 400 }
    );
  }
  if (!type || !VALID_PHOTO_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid photo type" }, { status: 400 });
  }

  let blobUrl: string | undefined;
  try {
    const blob = await put(`job-photos/${workOrderId}/${Date.now()}_${file.name}`, fileBuffer, {
      access: "public",
      contentType: detectedType.mime,
    });
    blobUrl = blob.url;

    const photo = await prisma.photo.create({
      data: {
        workOrderId,
        type: type as PhotoType,
        imagePath: blob.url,
      },
    });

    return NextResponse.json(toPhotoDTO(photo), { status: 201 });
  } catch (err) {
    console.error("Photo upload failed:", err);
    if (blobUrl) {
      await del(blobUrl).catch((delErr) => {
        console.error("Failed to clean up orphaned photo blob:", blobUrl, delErr);
      });
    }
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
