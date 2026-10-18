"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  savePhoto,
  saveProfile,
  type ProfileNotice,
} from "@/features/profile/services/profile-actions";
import { CURRENCIES, CURRENCY_LABEL, type CurrencyCode } from "@/lib/currency/codes";

export function SettingsForm({
  name,
  email,
  currency,
  avatarUrl,
}: {
  name: string;
  email: string;
  currency: CurrencyCode;
  avatarUrl: string | null;
}) {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">Settings</h1>
      <ProfileCard name={name} email={email} currency={currency} avatarUrl={avatarUrl} />
      <EmailCard />
      <PasswordCard />
      <DeleteCard email={email} />
    </div>
  );
}

function ProfileCard({
  name,
  email,
  currency,
  avatarUrl,
}: {
  name: string;
  email: string;
  currency: CurrencyCode;
  avatarUrl: string | null;
}) {
  const [profileNotice, setProfileNotice] = useState<ProfileNotice | null>(null);
  const [photoNotice, setPhotoNotice] = useState<ProfileNotice | null>(null);
  const [busy, setBusy] = useState<"profile" | "photo" | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <h2 className="font-serif text-2xl">Name, photo, and currency</h2>
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // The photo is a file the person uploaded, not model HTML.
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-ink text-lg font-semibold text-paper">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <p className="text-sm text-muted">{email}</p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setBusy("profile");
          setProfileNotice(null);
          startTransition(async () => {
            setProfileNotice(await saveProfile(String(form.get("name") ?? ""), String(form.get("currency") ?? "")));
            setBusy(null);
          });
        }}
      >
        <Field label="Name" id="settings-name">
          <Input id="settings-name" name="name" defaultValue={name} required maxLength={40} />
        </Field>
        <Field label="Currency" id="settings-currency">
          <select
            id="settings-currency"
            name="currency"
            defaultValue={currency}
            className="h-11 w-full rounded-2xl border border-line bg-card px-3 text-sm"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} · {CURRENCY_LABEL[code]}
              </option>
            ))}
          </select>
        </Field>
        {busy === "profile" ? null : <Notice notice={profileNotice} />}
        <Button type="submit" disabled={pending} aria-busy={busy === "profile"}>
          {busy === "profile" ? <BusyLabel>Saving your profile.</BusyLabel> : "Save profile"}
        </Button>
      </form>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setBusy("photo");
          setPhotoNotice(null);
          startTransition(async () => {
            setPhotoNotice(await savePhoto(form));
            setBusy(null);
          });
        }}
      >
        <Field label="Photo" id="settings-photo">
          <Input id="settings-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" required />
        </Field>
        {busy === "photo" ? null : <Notice notice={photoNotice} />}
        <Button type="submit" variant="outline" disabled={pending} aria-busy={busy === "photo"}>
          {busy === "photo" ? <BusyLabel>Uploading the photo.</BusyLabel> : "Upload photo"}
        </Button>
      </form>
    </section>
  );
}

function EmailCard() {
  const [notice, setNotice] = useState<ProfileNotice | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <h2 className="font-serif text-2xl">Email</h2>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            setNotice(await changeEmail(String(form.get("email") ?? ""), String(form.get("password") ?? "")));
          });
        }}
      >
        <Field label="New email" id="settings-email">
          <Input id="settings-email" name="email" type="email" required />
        </Field>
        <SecretField label="Current password" id="settings-email-password" name="password" />
        {pending ? null : <Notice notice={notice} />}
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <BusyLabel>Sending the confirmation.</BusyLabel> : "Send confirmation"}
        </Button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [notice, setNotice] = useState<ProfileNotice | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <h2 className="font-serif text-2xl">Password</h2>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            setNotice(await changePassword(String(form.get("current") ?? ""), String(form.get("next") ?? "")));
          });
        }}
      >
        <SecretField label="Current password" id="settings-current-password" name="current" />
        <SecretField label="New password" id="settings-next-password" name="next" autoComplete="new-password" />
        {pending ? null : <Notice notice={notice} />}
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <BusyLabel>Updating the password.</BusyLabel> : "Update password"}
        </Button>
      </form>
    </section>
  );
}

function DeleteCard({ email }: { email: string }) {
  const [notice, setNotice] = useState<ProfileNotice | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-2xl border border-clay/40 bg-card p-6">
      <h2 className="font-serif text-2xl">Delete account</h2>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            setNotice(await deleteAccount(String(form.get("confirm") ?? ""), String(form.get("password") ?? "")));
          });
        }}
      >
        <Field label={`Type ${email} to confirm`} id="settings-delete-email">
          <Input id="settings-delete-email" name="confirm" type="email" required />
        </Field>
        <SecretField label="Current password" id="settings-delete-password" name="password" />
        {pending ? null : <Notice notice={notice} />}
        <Button type="submit" variant="clay" disabled={pending} aria-busy={pending}>
          {pending ? <BusyLabel>Deleting the account.</BusyLabel> : "Delete account"}
        </Button>
      </form>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function SecretField({
  label,
  id,
  name,
  autoComplete = "current-password",
}: {
  label: string;
  id: string;
  name: string;
  autoComplete?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <span className="relative mt-2 block">
        <Input id={id} name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} required className="pr-11" />
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown((current) => !current)}
        >
          {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

function Notice({ notice }: { notice: ProfileNotice | null }) {
  if (!notice) return null;
  return <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote>;
}
