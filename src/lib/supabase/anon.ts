import "server-only";

import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/** Sends an invite email without replacing the admin's signed-in cookies. */
export function createSupabaseAnonClient() {
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        return undefined;
      },
    },
  });
}
