import { NextResponse } from "next/server";

import { deny } from "@/features/auth/services/access";
import { getCurrentUser } from "@/features/auth/services/require-user";
import { buildGoogleConnect, googleStateCookie } from "@/features/ingestion/services/google-auth";

export async function GET(request: Request) {
  const here = new URL(request.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", here));
  if (deny(user, "sync")) return NextResponse.redirect(new URL("/campaigns?google=failed", here));

  const started = buildGoogleConnect();
  if (!started.ok) return NextResponse.redirect(new URL("/campaigns?google=failed", here));

  const response = NextResponse.redirect(started.url);
  response.cookies.set(googleStateCookie.name, started.state, googleStateCookie.options);
  return response;
}
