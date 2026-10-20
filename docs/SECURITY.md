# Security checklist — Campaign desk

Keep secrets off GitHub. Keep production on Supabase. Nothing sensitive goes in the browser except the public Supabase anon key.

## What must never be public

| Keep private | Where it lives |
| --- | --- |
| `.env`, `.env.local` | Your machine + Vercel env only |
| `GEMINI_API_KEY` | Server / Vercel |
| `SESSION_SECRET` | Server / Vercel (unique per deploy) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Server / Vercel |
| `UPSTASH_REDIS_REST_TOKEN` | Server / Vercel |
| Google refresh tokens | Cookie (httpOnly) or `data/google-refresh.json` (gitignored) |
| `data/local-store.json`, `data/local-accounts.json` | Local only, gitignored |
| `SUPABASE_SERVICE_ROLE_KEY` | **Do not use in v1** — not even on the server |

Safe to be public (browser): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Git rules

1. Repo stays **private** unless you consciously choose otherwise.
2. Never commit `.env` or `.env.local`. Only `.env.example` (placeholders, no real keys).
3. Before every push: `git status` and confirm no `.env`, `data/*`, or key files are staged.
4. Run `npm run check:secrets` before push when you can.
5. If a real key ever lands in git history, **rotate that key** in Google / Gemini / Supabase / Vercel. Deleting the file in a new commit is not enough.

## Production rules (Vercel)

1. `DATA_BACKEND=supabase` (local store is blocked in production).
2. `SESSION_SECRET` must be a long unique string — not the example from `.env.example`.
3. Set Gemini, Google OAuth, and Upstash only as Vercel env vars (Production + Preview as you need).
4. Confirm migrations `0007_roles.sql` and `0008_sync_gates.sql` are applied on Supabase (sync gate = `actor_may_sync` exists).
5. Live login must **not** show “Local demo: … / …”.
6. Campaign writes only through `apply_campaign_action`. Chat is plain text — no HTML from the model.

## Quick checks (do these)

```text
□ git status — no .env or data/*.json staged
□ npm run check:secrets
□ npm test
□ Live /login — no demo password on screen
□ Supabase: actor_may_sync exists (ok = 1)
□ Vercel: DATA_BACKEND=supabase, SESSION_SECRET is unique
```

## If something leaked

1. Rotate the key or password immediately (do not wait).
2. Remove it from Vercel / Google Cloud / Supabase dashboard.
3. Put the new value only in Vercel env (or local `.env.local`).
4. Tell anyone who might have seen the old value.
