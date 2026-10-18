const LIVE_ORIGIN = "https://campaign-desk-khaki.vercel.app";
const LOCAL_ORIGIN = "http://127.0.0.1:3000";

/**
 * Address used in confirmation emails.
 * A request can claim any Origin. Only the live site, or the local desk while developing, is accepted.
 */
export function trustedAppOrigin(requestOrigin: string | null, isProduction: boolean): string {
  const fallback = isProduction ? LIVE_ORIGIN : LOCAL_ORIGIN;
  if (!requestOrigin) return fallback;
  let origin = "";
  try {
    origin = new URL(requestOrigin).origin;
  } catch {
    return fallback;
  }
  if (origin === LIVE_ORIGIN) return origin;
  if (!isProduction && origin === LOCAL_ORIGIN) return origin;
  return fallback;
}
