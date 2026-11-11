import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

// Always cache on globalThis, including production: on Vercel's serverless
// runtime a warm function instance reuses its module scope across
// invocations, so caching here is what keeps a warm instance from churning
// through Prisma clients (and their own connection pools against Neon's
// pooler) on every request. Previously this only cached in development,
// which is backwards for a serverless deploy target.
globalForPrisma.prisma = prisma;
