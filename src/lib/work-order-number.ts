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
    const lastCW = await prisma.workOrder.findFirst({
      where: { workOrderNumber: { startsWith: "CW-" } },
      orderBy: { workOrderNumber: "desc" },
      select: { workOrderNumber: true },
    });

    let nextNum = 1;
    if (lastCW) {
      const num = parseInt(lastCW.workOrderNumber.replace("CW-", ""), 10);
      if (!isNaN(num)) nextNum = num + 1;
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
