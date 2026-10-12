import type { Receipt, Employee } from "@prisma/client";

type ReceiptWithUploader = Receipt & { uploadedBy: Pick<Employee, "name"> };

/** Serialize a Prisma Receipt (with uploader name included) for client components / API responses. */
export function toReceiptDTO(receipt: ReceiptWithUploader) {
  return {
    id: receipt.id,
    url: receipt.url,
    type: receipt.type,
    amount: Number(receipt.amount),
    uploadedBy: receipt.uploadedBy.name,
    createdAt: receipt.createdAt.toISOString(),
  };
}
