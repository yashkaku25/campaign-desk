"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { findLocalAccount, hashPassword, passwordMatchesHash, saveLocalAccount } from "@/features/auth/services/local-accounts";
import { readSignInInput, readSignUpInput } from "@/features/auth/services/auth-input";
import { demoUserId } from "@/features/auth/services/require-user";
import { clearSessionCookie, writeSessionCookie } from "@/features/auth/services/session-cookie";
import { passwordsMatch } from "@/features/auth/services/session-token";
import { withLocalState } from "@/lib/data/local-store";
import { newRecordId } from "@/lib/data/seed";
import { WORKSPACE_ID } from "@/lib/domain";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { takeAuthAttempt } from "@/lib/rate-limit";
import { trustedAppOrigin } from "@/lib/security/app-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthNotice = { ok: false; message: string } | { ok: true; message: string };

export async function signIn(email: string, password: string): Promise<AuthNotice> {
  const input = readSignInInput(email, password);
  if ("message" in input) return { ok: false, message: input.message };

  const limited = await limitedNotice("sign-in", input.email);
  if (limited) return limited;

  try {
    if (env.dataBackend === "local") {
      const userId = await localUserId(input.email, input.password);
      if (!userId) return { ok: false, message: "That email or password did not match." };
      await writeSessionCookie(userId);
      redirect("/");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) {
      logError({
        what: "Could not sign in.",
        why: "Supabase did not accept that email and password.",
        file: "src/features/auth/services/auth-actions.ts",
        connectedTo: "Supabase Auth",
        fix: "Check the email and password, or create an account.",
        cause: error,
      });
      return { ok: false, message: signInMessage(error.message) };
    }
    redirect("/");
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof AppError) return { ok: false, message: error.what };
    logError({
      what: "Could not sign in.",
      why: "The sign-in step failed before a session was saved.",
      file: "src/features/auth/services/auth-actions.ts",
      fix: "Try again.",
      cause: error,
    });
    return { ok: false, message: "Could not sign in. Try again." };
  }
}

export async function signUp(
  displayName: string,
  email: string,
  password: string,
  currency: string,
  website = "",
): Promise<AuthNotice> {
  const limited = await limitedNotice("sign-up", email);
  if (limited) return limited;
  if (website.trim()) return { ok: false, message: "Could not create the account. Try again." };

  const input = readSignUpInput(displayName, email, password, currency);
  if ("message" in input) return { ok: false, message: input.message };

  try {
    if (env.dataBackend === "local") {
      await createLocalAccount(input.displayName, input.email, input.password, input.currency);
      redirect("/");
    }

    const supabase = await createSupabaseServerClient();
    const headerList = await headers();
    const origin = trustedAppOrigin(headerList.get("origin"), env.isProduction);
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { display_name: input.displayName, currency: input.currency },
        emailRedirectTo: `${origin}/login`,
      },
    });
    if (error) {
      logError({
        what: "Could not create the account.",
        why: "Supabase rejected the new account.",
        file: "src/features/auth/services/auth-actions.ts",
        connectedTo: "Supabase Auth and the handle_new_user trigger in supabase/migrations/0001_init.sql",
        fix: "Use a different email, or sign in if this one already has an account.",
        cause: error,
      });
      return { ok: false, message: signUpMessage(error.message) };
    }
    if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
      return { ok: false, message: "That email already has an account. Sign in instead." };
    }
    if (!data.session) {
      return {
        ok: true,
        message: "Account created. Check your email to confirm it, then sign in.",
      };
    }
    redirect("/");
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof AppError) return { ok: false, message: error.what };
    logError({
      what: "Could not create the account.",
      why: "The sign-up step failed before a session was saved.",
      file: "src/features/auth/services/auth-actions.ts",
      fix: "Try again.",
      cause: error,
    });
    return { ok: false, message: "Could not create the account. Try again." };
  }
}

export async function signOut(): Promise<void> {
  if (env.dataBackend === "supabase") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  await clearSessionCookie();
  redirect("/login");
}

async function localUserId(email: string, password: string): Promise<string | null> {
  const account = await findLocalAccount(email);
  if (account) {
    const matches = await passwordMatchesHash(password, account.passwordHash);
    return matches ? account.userId : null;
  }
  if (email === env.demoEmail.toLowerCase() && passwordsMatch(password, env.demoPassword)) {
    return demoUserId();
  }
  return null;
}

async function createLocalAccount(
  displayName: string,
  email: string,
  password: string,
  currency: "USD" | "EUR" | "GBP" | "CAD" | "INR",
): Promise<void> {
  if (email === env.demoEmail.toLowerCase() || (await findLocalAccount(email))) {
    throw new AppError({
      what: "That email already has an account.",
      why: "A person with this email is already saved.",
      file: "src/features/auth/services/auth-actions.ts",
      fix: "Sign in instead.",
    });
  }

  const userId = newRecordId();
  await saveLocalAccount({
    userId,
    email,
    passwordHash: await hashPassword(password),
  });
  await withLocalState((state) => ({
    state: {
      ...state,
      profiles: [
        ...state.profiles,
        { id: userId, workspaceId: WORKSPACE_ID, displayName, email, currency, avatarUrl: null },
      ],
    },
    result: undefined,
  }));
  await writeSessionCookie(userId);
}

async function limitedNotice(kind: "sign-up" | "sign-in", email: string): Promise<AuthNotice | null> {
  const ip = await clientIp();
  const byIp = await takeAuthAttempt(kind, ip);
  if (!byIp.ok) return { ok: false, message: byIp.message };
  if (kind === "sign-in") {
    const byEmail = await takeAuthAttempt(kind, `email:${email}`);
    if (!byEmail.ok) return { ok: false, message: byEmail.message };
  }
  return null;
}

async function clientIp(): Promise<string> {
  const headerList = await headers();
  const real = headerList.get("x-real-ip")?.trim();
  const forwarded = headerList.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  return (real || forwarded.at(-1) || "unknown").slice(0, 64);
}

function signInMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first, then sign in.";
  }
  return "That email or password did not match.";
}

function signUpMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already")) return "That email already has an account. Sign in instead.";
  if (lower.includes("invalid")) return "Enter a real email address.";
  if (lower.includes("password")) return "Use at least 8 characters in the password.";
  return "Could not create the account. Try again.";
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}
