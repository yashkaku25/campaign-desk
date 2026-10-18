const TEMP_MAIL_DOMAINS = [
  "10minutemail.com",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "discard.email",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "tmpmail.net",
  "tmpmail.org",
  "trashmail.com",
  "yopmail.com",
] as const;

export const GMAIL_ONLY_MESSAGE = "Use a Gmail address. Temporary email is not accepted.";
export const TEMP_MAIL_MESSAGE = "Temporary email is not accepted. Use a Gmail address.";

export function signupGmail(raw: string): { email: string } | { message: string } {
  const email = raw.trim().toLowerCase();
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { message: "Enter a real email address." };
  const [local, domain] = parts;
  if (isTempDomain(domain)) return { message: TEMP_MAIL_MESSAGE };
  if (domain !== "gmail.com") return { message: GMAIL_ONLY_MESSAGE };

  const plusParts = local.split("+");
  if (plusParts.length > 2) return { message: GMAIL_ONLY_MESSAGE };
  const base = plusParts[0] ?? "";
  const tag = plusParts[1];
  if (!isGmailBase(base)) return { message: GMAIL_ONLY_MESSAGE };
  if (tag !== undefined && !/^[a-z0-9._-]{1,40}$/.test(tag)) return { message: GMAIL_ONLY_MESSAGE };

  const compact = base.replaceAll(".", "");
  return { email: `${compact}@gmail.com` };
}

export function signInEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || email.slice(at + 1) !== "gmail.com") return email;
  const local = email.slice(0, at).split("+")[0] ?? "";
  const compact = local.replaceAll(".", "");
  if (!compact) return email;
  return `${compact}@gmail.com`;
}

function isTempDomain(domain: string): boolean {
  return TEMP_MAIL_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
}

function isGmailBase(base: string): boolean {
  if (base.length < 6 || base.length > 30) return false;
  if (!/^[a-z0-9.]+$/.test(base)) return false;
  if (base.startsWith(".") || base.endsWith(".") || base.includes("..")) return false;
  const compact = base.replaceAll(".", "");
  return compact.length >= 6 && compact.length <= 30;
}
