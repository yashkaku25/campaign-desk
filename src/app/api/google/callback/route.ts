import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/require-user";
import { exchangeGoogleCode, googleRefreshCookie, takeGoogleState } from "@/features/ingestion/services/google-auth";
import { storeGoogleRefresh } from "@/features/ingestion/services/google-refresh-store";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", url));

  const stateOk = await takeGoogleState(url.searchParams.get("state"));
  const code = url.searchParams.get("code");
  if (!stateOk || !code) {
    return NextResponse.redirect(new URL("/campaigns?google=mismatch", url));
  }

  const exchanged = await exchangeGoogleCode(code);
  if ("problem" in exchanged) {
    return NextResponse.redirect(new URL("/campaigns?google=failed", url));
  }
  const jar = await cookies();
  jar.set(googleRefreshCookie.name, exchanged.refreshToken, googleRefreshCookie.options);
  if (!env.isProduction) await storeGoogleRefresh(user.id, exchanged.refreshToken);
  const response = NextResponse.redirect(new URL("/campaigns?google=connected", url));
  response.cookies.set(googleRefreshCookie.name, exchanged.refreshToken, googleRefreshCookie.options);
  return response;
}
