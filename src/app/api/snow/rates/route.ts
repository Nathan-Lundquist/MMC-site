import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { snowRateSchema } from "@/lib/schemas";

async function getOrCreateRates() {
  let rates = await prisma.snowRate.findFirst();
  if (!rates) {
    rates = await prisma.snowRate.create({ data: {} });
  }
  return rates;
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const rates = await getOrCreateRates();
    return NextResponse.json(rates);
  } catch (err) {
    console.error("Snow rates fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "MANAGER"]);
  if (error) return error;

  try {
    const raw = await req.json();
    const result = snowRateSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const existing = await getOrCreateRates();
    const rates = await prisma.snowRate.update({
      where: { id: existing.id },
      data: result.data,
    });

    return NextResponse.json(rates);
  } catch (err) {
    console.error("Snow rates update failed:", err);
    return NextResponse.json(
      { error: "Failed to update rates" },
      { status: 500 }
    );
  }
}
