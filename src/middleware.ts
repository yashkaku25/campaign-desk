import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "campaign_desk_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const backend = process.env.DATA_BACKEND ?? "local";
  const signedIn =
    backend === "supabase"
      ? request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"))
      : request.cookies.has(SESSION_COOKIE);
  const isPrivate =
    pathname === "/" ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/settings");

  if (isPrivate && !signedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/campaigns/:path*", "/audit", "/settings"],
};
