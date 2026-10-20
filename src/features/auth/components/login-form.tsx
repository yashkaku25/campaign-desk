"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusyLabel } from "@/components/ui/spinner";
import { StatusNote } from "@/components/ui/status-note";
import { signIn, signUp, type AuthNotice } from "@/features/auth/services/auth-actions";
import { CURRENCIES, CURRENCY_LABEL } from "@/lib/currency/codes";

export function LoginForm({
  demoEmail,
  demoPassword,
  showDemo,
  startMode = "sign-in",
}: {
  demoEmail: string;
  demoPassword: string;
  showDemo: boolean;
  startMode?: "sign-in" | "sign-up";
}) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(startMode);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [, startTransition] = useTransition();
  const signingUp = mode === "sign-up";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (waiting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("name") ?? "");
    const website = String(form.get("website") ?? "");
    const currency = String(form.get("currency") ?? "USD");
    setNotice(null);
    setWaiting(true);
    const slow = new Promise<AuthNotice>((resolve) => {
      window.setTimeout(() => {
        resolve({
          ok: false,
          message: signingUp
            ? "Creating the account is taking too long. Try again."
            : "Sign-in is taking too long. Try again.",
        });
      }, 20000);
    });
    const work = signingUp ? signUp(displayName, email, password, currency, website) : signIn(email, password);
    startTransition(async () => {
      try {
        const result = await Promise.race([work, slow]);
        if (result) setNotice(result);
      } catch {
        // A successful sign-in redirects. That throw is the page change, not a failure.
      } finally {
        setWaiting(false);
      }
    });
  }

  function switchMode() {
    setNotice(null);
    setMode(signingUp ? "sign-in" : "sign-up");
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      <h1 className="font-sans font-semibold tracking-tight text-4xl tracking-tight">{signingUp ? "Create account" : "Sign in"}</h1>
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="company-website">Website</label>
        <input id="company-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {signingUp ? (
        <label className="block text-sm font-semibold" htmlFor="name">
          Name
          <Input id="name" name="name" type="text" autoComplete="name" className="mt-2" required maxLength={40} />
        </label>
      ) : null}
      {signingUp ? (
        <label className="block text-sm font-semibold" htmlFor="currency">
          Currency
          <select
            id="currency"
            name="currency"
            defaultValue="USD"
            className="mt-2 h-11 w-full rounded-2xl border border-line bg-card px-3 text-sm"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} · {CURRENCY_LABEL[code]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm font-semibold" htmlFor="email">
        Email
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete={signingUp ? "email" : "username"}
          className="mt-2"
          required
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="password">
        Password
        <span className="relative mt-2 block">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={signingUp ? "new-password" : "current-password"}
            className="pr-11"
            required
            minLength={signingUp ? 8 : undefined}
          />
          <button
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </span>
      </label>
      {notice ? <StatusNote tone={notice.ok ? "ok" : "bad"}>{notice.message}</StatusNote> : null}
      <Button className="w-full" type="submit" disabled={waiting} aria-busy={waiting}>
        {waiting ? <BusyLabel>{signingUp ? "Creating the account." : "Signing in."}</BusyLabel> : signingUp ? "Create account" : "Sign in"}
      </Button>
      <button className="text-left text-sm font-semibold text-ink" type="button" onClick={switchMode}>
        {signingUp ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
      {showDemo && !signingUp ? (
        <p className="text-sm text-muted">
          Local demo: {demoEmail} / {demoPassword}
        </p>
      ) : null}
    </form>
  );
}
