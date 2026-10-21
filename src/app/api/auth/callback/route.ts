import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    // Google or Supabase sent the person back with an error, for example an email the desk does not accept.
    const failed = url.searchParams.has("error") || url.searchParams.has("error_description");
    return NextResponse.redirect(new URL(failed ? "/login?error=google" : "/login", url));
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=google", url));
  return NextResponse.redirect(new URL("/", url));
}
