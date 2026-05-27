import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/**
 * Require authentication for an API route.
 * Optionally restrict to specific roles.
 */
export async function requireAuth(roles?: string[]): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (roles && !roles.includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}
