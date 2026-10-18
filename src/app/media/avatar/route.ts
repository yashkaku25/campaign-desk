import { readFile } from "node:fs/promises";
import path from "node:path";

import { getCurrentUser } from "@/features/auth/services/require-user";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user?.avatarUrl) {
    return new Response("Sign in to see this photo.", { status: 401 });
  }
  try {
    const bytes = await readFile(path.join(process.cwd(), "data", "avatars", user.id));
    const kind = imageKind(bytes);
    if (!kind) return new Response("That photo file is not a picture the desk can show.", { status: 415 });
    return new Response(bytes, {
      headers: { "content-type": kind, "cache-control": "private, max-age=60" },
    });
  } catch {
    return new Response("No photo is saved for this account.", { status: 404 });
  }
}

function imageKind(bytes: Buffer): string | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes.length > 12 && bytes[8] === 0x57 && bytes[9] === 0x45) return "image/webp";
  return null;
}
