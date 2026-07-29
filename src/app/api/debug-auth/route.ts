import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({ session, hasUser: !!session?.user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, type: e?.constructor?.name }, { status: 500 });
  }
}
