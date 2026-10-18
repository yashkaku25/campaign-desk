"use server";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signOut } from "@/features/auth/services/auth-actions";
import {
  deleteLocalAccount,
  findLocalAccount,
  findLocalAccountByUserId,
  hashPassword,
  passwordMatchesHash,
  saveLocalAccount,
} from "@/features/auth/services/local-accounts";
import { requireUser } from "@/features/auth/services/require-user";
import { passwordsMatch } from "@/features/auth/services/session-token";
import { signupGmail } from "@/features/auth/services/gmail-address";
import { isCurrency, type CurrencyCode } from "@/lib/currency/codes";
import { withLocalState } from "@/lib/data/local-store";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileNotice = { ok: false; message: string } | { ok: true; message: string };

export async function saveProfile(displayName: string, currency: string): Promise<ProfileNotice> {
  const name = displayName.trim();
  if (!name || name.length > 40) return { ok: false, message: "Enter a name up to 40 characters." };
  if (!isCurrency(currency)) return { ok: false, message: "Choose USD, EUR, GBP, CAD, or INR." };
  const user = await requireUser();
  try {
    if (env.dataBackend === "local") {
      await withLocalState((state) => ({
        state: {
          ...state,
          profiles: state.profiles.map((profile) =>
            profile.id === user.id ? { ...profile, displayName: name, currency } : profile,
          ),
        },
        result: undefined,
      }));
    } else {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("profiles").update({ display_name: name, currency }).eq("id", user.id);
      if (error) throw error;
    }
    revalidatePath("/", "layout");
    return { ok: true, message: "Profile saved." };
  } catch (error) {
    logError({
      what: "Could not save the profile.",
      why: "The profile row rejected the name or currency.",
      file: "src/features/profile/services/profile-actions.ts",
      connectedTo: "public.profiles",
      fix: "Run supabase/migrations/0005_profile.sql, then try again.",
      cause: error,
    });
    return { ok: false, message: "Could not save the profile. Try again." };
  }
}

export async function savePhoto(formData: FormData): Promise<ProfileNotice> {
  const user = await requireUser();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a photo." };
  if (file.size > 1_000_000) return { ok: false, message: "Use a photo under 1 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = imageKind(bytes);
  if (!kind) return { ok: false, message: "Use a PNG, JPG, or WebP photo." };

  try {
    if (env.dataBackend === "local") {
      const folder = path.join(process.cwd(), "data", "avatars");
      await mkdir(folder, { recursive: true });
      await writeFile(path.join(folder, user.id), bytes);
      await withLocalState((state) => ({
        state: {
          ...state,
          profiles: state.profiles.map((profile) =>
            profile.id === user.id ? { ...profile, avatarUrl: "/media/avatar" } : profile,
          ),
        },
        result: undefined,
      }));
    } else {
      const supabase = await createSupabaseServerClient();
      const storagePath = `${user.id}/photo`;
      const uploaded = await supabase.storage.from("avatars").upload(storagePath, bytes, {
        upsert: true,
        contentType: kind,
        cacheControl: "60",
      });
      if (uploaded.error) throw uploaded.error;
      const { error } = await supabase.from("profiles").update({ avatar_path: storagePath }).eq("id", user.id);
      if (error) throw error;
    }
    revalidatePath("/", "layout");
    return { ok: true, message: "Photo saved." };
  } catch (error) {
    logError({
      what: "Could not save the photo.",
      why: "The photo store rejected the file.",
      file: "src/features/profile/services/profile-actions.ts",
      connectedTo: "storage bucket avatars, or data/avatars for the local desk",
      fix: "Use a PNG, JPG, or WebP under 1 MB. On Supabase, run supabase/migrations/0005_profile.sql.",
      cause: error,
    });
    return { ok: false, message: "Could not save the photo. Try again." };
  }
}

export async function changeEmail(nextEmail: string, currentPassword: string): Promise<ProfileNotice> {
  const gmail = signupGmail(nextEmail);
  if ("message" in gmail) return { ok: false, message: gmail.message };
  if (!currentPassword) return { ok: false, message: "Enter your current password." };
  const user = await requireUser();
  if (gmail.email === user.email) return { ok: false, message: "That is already your email." };

  try {
    if (!(await passwordStillMatches(user.id, user.email, currentPassword))) {
      return { ok: false, message: "The current password did not match." };
    }
    if (env.dataBackend === "local") {
      if (await findLocalAccount(gmail.email)) {
        return { ok: false, message: "That email already has an account." };
      }
      const existing = await findLocalAccountByUserId(user.id);
      if (existing) {
        await saveLocalAccount({ ...existing, email: gmail.email });
      }
      await withLocalState((state) => ({
        state: {
          ...state,
          profiles: state.profiles.map((profile) =>
            profile.id === user.id ? { ...profile, email: gmail.email } : profile,
          ),
        },
        result: undefined,
      }));
      revalidatePath("/", "layout");
      return { ok: true, message: "Email updated." };
    }

    const supabase = await createSupabaseServerClient();
    const origin = (await headers()).get("origin") ?? "http://localhost:3000";
    const { error } = await supabase.auth.updateUser(
      { email: gmail.email },
      { emailRedirectTo: `${origin}/settings` },
    );
    if (error) throw error;
    return { ok: true, message: "Check the new inbox and confirm the email. The desk updates it after that." };
  } catch (error) {
    logError({
      what: "Could not change the email.",
      why: "The sign-in service did not start the confirmation.",
      file: "src/features/profile/services/profile-actions.ts",
      connectedTo: "Supabase Auth and public.sync_profile_email",
      fix: "Use a Gmail address that is not already on the desk.",
      cause: error,
    });
    return { ok: false, message: "Could not change the email. Try again." };
  }
}

export async function changePassword(currentPassword: string, nextPassword: string): Promise<ProfileNotice> {
  if (nextPassword.length < 8 || nextPassword.length > 72) {
    return { ok: false, message: "Use at least 8 characters." };
  }
  if (nextPassword === currentPassword) {
    return { ok: false, message: "Choose a different password." };
  }
  const user = await requireUser();
  try {
    if (!(await passwordStillMatches(user.id, user.email, currentPassword))) {
      return { ok: false, message: "The current password did not match." };
    }
    if (env.dataBackend === "local") {
      await saveLocalAccount({
        userId: user.id,
        email: user.email,
        passwordHash: await hashPassword(nextPassword),
      });
      return { ok: true, message: "Password updated." };
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) throw error;
    return { ok: true, message: "Password updated." };
  } catch (error) {
    logError({
      what: "Could not change the password.",
      why: "The sign-in service rejected the new password.",
      file: "src/features/profile/services/profile-actions.ts",
      connectedTo: "Supabase Auth",
      fix: "Use 8 or more characters and the current password.",
      cause: error,
    });
    return { ok: false, message: "Could not change the password. Try again." };
  }
}

export async function deleteAccount(confirmEmail: string, currentPassword: string): Promise<ProfileNotice> {
  const user = await requireUser();
  if (confirmEmail.trim().toLowerCase() !== user.email) {
    return { ok: false, message: "Type your email to confirm." };
  }
  try {
    if (!(await passwordStillMatches(user.id, user.email, currentPassword))) {
      return { ok: false, message: "The current password did not match." };
    }
    if (env.dataBackend === "local") {
      await withLocalState((state) => {
        const threadIds = new Set(state.threads.filter((thread) => thread.userId === user.id).map((thread) => thread.id));
        return {
          state: {
            ...state,
            profiles: state.profiles.filter((profile) => profile.id !== user.id),
            threads: state.threads.filter((thread) => thread.userId !== user.id),
            messages: state.messages.filter((message) => !threadIds.has(message.threadId)),
            actions: state.actions.filter((action) => action.userId !== user.id),
          },
          result: undefined,
        };
      });
      await deleteLocalAccount(user.id);
      await rm(path.join(process.cwd(), "data", "avatars", user.id), { force: true });
    } else {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw error;
    }
  } catch (error) {
    if (error instanceof AppError) return { ok: false, message: error.what };
    logError({
      what: "Could not delete the account.",
      why: "The account row is still tied to saved history.",
      file: "src/features/profile/services/profile-actions.ts",
      connectedTo: "public.delete_own_account. Campaigns stay. Audit rows stay, without the profile link.",
      fix: "Run supabase/migrations/0005_profile.sql, then try again.",
      cause: error,
    });
    return { ok: false, message: "Could not delete the account. Try again." };
  }
  await signOut();
  redirect("/login");
}

async function passwordStillMatches(userId: string, email: string, password: string): Promise<boolean> {
  if (env.dataBackend === "local") {
    const account = await findLocalAccountByUserId(userId);
    if (account) return passwordMatchesHash(password, account.passwordHash);
    return email === env.demoEmail.toLowerCase() && passwordsMatch(password, env.demoPassword);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

function imageKind(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
