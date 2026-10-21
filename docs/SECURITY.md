# Security checklist: Campaign desk

Keep secrets off GitHub. Keep production on Supabase. The browser only ever sees the public Supabase URL and the public key.

## What must never be public

| Keep private | Where it lives |
| --- | --- |
| `.env`, `.env.local` | Your computer and Vercel settings only |
| `GEMINI_API_KEY` | Server, set in Vercel |
| `SESSION_SECRET` | Server, set in Vercel (a unique value per deploy) |
| `GOOGLE_OAUTH_CLIENT_SECRET` (Sheets) | Server, set in Vercel |
| Google sign in Client Secret | Supabase only (Authentication, then Sign In / Providers, then Google). Never in the code or in Vercel. |
| `UPSTASH_REDIS_REST_TOKEN` | Server, set in Vercel |
| Google refresh tokens | Cookie (httpOnly) or `data/google-refresh.json` (gitignored) |
| `data/local-store.json`, `data/local-accounts.json` | Your computer only, gitignored |
| `SUPABASE_SERVICE_ROLE_KEY` | **Do not use.** Not even on the server. |

Safe to be public (browser): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Accounts and private desks

1. Anyone can sign up with **Continue with Google**, or with email and password.
2. Email sign up only accepts Gmail and Microsoft mail (outlook.com, hotmail.com, live.com, msn.com). Temporary email is blocked. The app checks this, and the database checks it again in `handle_new_user`.
3. **Every new account gets its own private desk** (its own row in `workspaces`). Row security only shows a person the campaigns, sheet, chat and audit rows on their own desk.
4. There are no invites and no admin or team split for new accounts. Each person owns their desk.
5. Deleting an account (`delete_own_account`) also removes that person's desk and everything on it.
6. Google sign in returns to `https://campaign-desk-khaki.vercel.app/api/auth/callback`. That exact address must be in Supabase, under Authentication, then URL Configuration, then Redirect URLs. The Google Cloud client must list `https://pewnqdzjibbtkrxngnpi.supabase.co/auth/v1/callback` as its redirect URI.

## Git rules

1. The repo stays **private** unless you choose otherwise on purpose.
2. Never commit `.env` or `.env.local`. Only `.env.example`, with placeholders and no real keys.
3. Before every push, run `git status` and check that no `.env`, `data/*` or key files are staged.
4. Run `npm run check:secrets` before you push.
5. If a real key ever lands in git history, **change that key** in Google, Gemini, Supabase or Vercel. Deleting the file in a new commit is not enough.

## Production rules (Vercel and Supabase)

1. `DATA_BACKEND=supabase`. The local file store is blocked in production.
2. `SESSION_SECRET` must be a long, unique value. Never the one from `.env.example`.
3. Set Gemini, Google Sheets OAuth and Upstash only as Vercel settings.
4. Apply every file in `supabase/migrations/` to the live Supabase project, in number order. GitHub and the live database must match. The latest are `0010_private_desks.sql` (open sign up, private desks) and `0011_delete_own_desk.sql` (delete account).
5. The live sign in page must **not** show the local demo email and password.
6. Campaigns change only through `apply_campaign_action`. Chat shows plain text. No HTML from the AI.

## Quick checks (do these)

```text
□ git status: no .env or data/*.json staged
□ npm run check:secrets
□ npm test
□ Live /login: no demo password on screen
□ Live /login: Continue with Google opens the Google account picker
□ Sign up with a new Gmail: you land on an empty desk of your own
□ Supabase: the latest migration in supabase/migrations/ is applied
□ Vercel: DATA_BACKEND=supabase and SESSION_SECRET is unique
```

## If something leaked

1. Change the key or password right away. Do not wait.
2. Remove the old one in Vercel, Google Cloud or the Supabase dashboard.
3. Put the new value only in Vercel settings, Supabase settings, or your local `.env.local`.
4. Tell anyone who might have seen the old value.
