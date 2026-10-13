import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const MAX_RETRIES = 10;

/**
 * Generates the next sequential CW-NNNN work order number and creates a record with it,
 * retrying on a unique-constraint collision from a concurrent create. `create` receives
 * the candidate number and performs the actual prisma.workOrder.create.
 */
export async function createWorkOrderWithNumber<T>(
  create: (workOrderNumber: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Compare suffixes numerically rather than ordering the string column: "CW-9999" sorts
    // after "CW-10000" lexicographically, which would otherwise regenerate the same number
    // forever once the sequence passes 4 digits.
    const existingCW = await prisma.workOrder.findMany({
      where: { workOrderNumber: { startsWith: "CW-" } },
      select: { workOrderNumber: true },
    });

    let nextNum = 1;
    for (const { workOrderNumber } of existingCW) {
      const num = parseInt(workOrderNumber.replace("CW-", ""), 10);
      if (!isNaN(num) && num + 1 > nextNum) nextNum = num + 1;
    }
    const woNumber = `CW-${String(nextNum).padStart(4, "0")}`;

    try {
      return await create(woNumber);
    } catch (err) {
      const isCollision =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (isCollision && attempt < MAX_RETRIES - 1) continue;
      throw err;
    }
  }
  throw new Error("Failed to generate a unique work order number");
}
