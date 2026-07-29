import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { snowStormSchema } from "@/lib/schemas";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const storms = await prisma.snowStorm.findMany({
      orderBy: { eventStart: "desc" },
      include: {
        _count: { select: { siteServices: true } },
      },
    });

    return NextResponse.json(storms);
  } catch (err) {
    console.error("Storm list failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch storms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  try {
    const raw = await req.json();
    const result = snowStormSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const eventStart = new Date(result.data.eventStart);
    const eventEnd = new Date(result.data.eventEnd);

    const { storm, matchedCount } = await prisma.$transaction(async (tx) => {
      // Create the storm
      const storm = await tx.snowStorm.create({
        data: {
          description: result.data.description,
          eventStart,
          eventEnd,
        },
      });

      // Auto-associate unlinked services within the date range
      const matched = await tx.snowSiteService.updateMany({
        where: {
          stormId: null,
          startTime: { gte: eventStart, lte: eventEnd },
        },
        data: { stormId: storm.id },
      });

      // Sum costs from associated services
      if (matched.count > 0) {
        const services = await tx.snowSiteService.findMany({
          where: { stormId: storm.id },
        });

        const totals = services.reduce(
          (acc, s) => ({
            totalDirect: acc.totalDirect.add(s.totalDirect),
            totalIndirect: acc.totalIndirect.add(s.totalIndirect),
            employeeCost: acc.employeeCost.add(s.employeeCost),
            subCost: acc.subCost.add(s.subCost),
            fuelCost: acc.fuelCost.add(s.fuelCost),
          }),
          {
            totalDirect: new Decimal(0),
            totalIndirect: new Decimal(0),
            employeeCost: new Decimal(0),
            subCost: new Decimal(0),
            fuelCost: new Decimal(0),
          }
        );

        const totalCost = totals.totalDirect.add(totals.totalIndirect);
        await tx.snowStorm.update({
          where: { id: storm.id },
          data: {
            directCost: totals.totalDirect,
            indirectCost: totals.totalIndirect,
            totalCost,
            laborCost: totals.employeeCost,
            subCost: totals.subCost,
            fuelCost: totals.fuelCost,
          },
        });
      }

      return { storm, matchedCount: matched.count };
    });

    return NextResponse.json(
      { id: storm.id, matchedServices: matchedCount },
      { status: 201 }
    );
  } catch (err) {
    console.error("Storm creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create storm" },
      { status: 500 }
    );
  }
}
