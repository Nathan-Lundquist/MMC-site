import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(req: NextRequest) {
  // CSRF: reject mutating API requests from foreign origins
  if (
    req.nextUrl.pathname.startsWith("/api/") &&
    !req.nextUrl.pathname.startsWith("/api/auth") &&
    MUTATING_METHODS.has(req.method)
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "CSRF rejected" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "CSRF rejected" }, { status: 403 });
      }
    }
  }

  const token = await getToken({ req });

  if (!token) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/upload",
    "/api/((?!auth).*)",
  ],
};
