import "server-only";

import { env } from "@/lib/env";

export function avatarUrlFromPath(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  if (avatarPath === "local") return "/media/avatar";
  if (!env.supabaseUrl) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
}
