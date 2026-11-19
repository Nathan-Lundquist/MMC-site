import type { Photo } from "@prisma/client";

/** Serialize a Prisma Photo for client components / API responses. */
export function toPhotoDTO(photo: Photo) {
  return {
    id: photo.id,
    url: photo.imagePath,
    type: photo.type,
    uploadedAt: photo.uploadedAt.toISOString(),
  };
}
