# Campaign desk: what this is

Campaign desk helps a marketer **see how an ad might land before it spends real money**, bring **real sheet numbers** onto one desk, and **change campaigns only after Approve**.

Live site: [https://campaign-desk-khaki.vercel.app](https://campaign-desk-khaki.vercel.app)

---

## What it solves (plain words)

1. Ads often spend before anyone knows if the idea is good.
2. Numbers live in a Google Sheet, and chat guesses without a clear trail.
3. This product shows a week that does **not** spend, syncs the sheet, and keeps every real change behind **Approve** (with an audit row).

---

## The five desks

| Desk | Job |
| --- | --- |
| **Overview** | See what is live and what needs care. |
| **Campaigns** | Open a row. Read spend, results, and status. |
| **Sheet** | Paste a Google Sheet. Sync puts those rows on the desk. |
| **Simulation** | Write the ad and who it is for. Get a band for the next days. It can be wrong. It does not spend. |
| **Chat** | Ask for a change or a new campaign. Read the preview. Approve saves. Reject leaves it. |

---

## Recent product changes (this release)

### Simulation (Meta-style practice week)

- Full Ads Manager path: create → ad set → ad → Analyse.
- Destinations: website, Instant Form, messages, calls, and more.
- Detailed targeting and Facebook-style interest lists (Shopping ≠ Online shopping).
- Creative upload + phone mockup; shopper journey is deeper than a flat funnel.
- Desk colors (pine/paper), not Meta blue.
- Marketer suggestion when the week looks weak (form, messages, creative, etc.).

### Chat marketer

- “Optimize” and similar asks become concrete pause / budget / move actions from desk numbers.
- **“I want to create a campaign”** drafts a full create preview (name + daily budget).
- Optional **strategy note** and **what to expect** on the preview so the test is tracked.
- Strategies **rotate** (prospect, retarget, Instant Form, WhatsApp, creative A/B, scale, replace waste).
- Sheet creative columns (headline, copy, product) feed the brief when a sheet is connected.
- Nothing writes until Approve. Audit keeps Approve / Reject.

### Roles and sync safety

- Admin can turn on or off ask / propose / approve / sync for team members.
- Sheet sync and Google connect respect `can_sync`.
- Production Supabase must run migrations **`0007_roles.sql`** and **`0008_sync_gates.sql`** so the database matches the app gates.
  - `0007` is already on production (roles + `actor_may_apply`).
  - Confirm `0008` with: `select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'actor_may_sync';`. If the count is `0`, paste and Run `supabase/migrations/0008_sync_gates.sql` in the Supabase SQL editor.

### Public page

- `/` for signed-out visitors shows the welcome landing (rewrite to `/welcome`).
- Cursor-style film walkthrough of the five desks, then short feature sections in simple English.

---

## What never goes public

These stay on the server or on your machine, **never** in GitHub:

- `.env` / `.env.local`
- `GEMINI_API_KEY`, OAuth secrets, session secrets
- `data/google-refresh.json`, `data/local-store.json`, `data/local-accounts.json`

The browser may only see `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Full checklist: `docs/SECURITY.md`. Before push: `npm run check:secrets`.

---

## How a real change is saved

```text
Person types in Chat
  → Gemini (or offline rules) return allowlisted JSON
  → Preview card (hash + versions + 10-minute expiry)
  → Approve → apply_campaign_action (only write path)
  → Audit row
  → Optional write-back to the Google Sheet
```

Campaign names and metrics are **data**, not instructions. Chat is plain text (no HTML from the model).

---

## For builders

Read `docs/ARCHITECTURE.md` for folders, caps, and security gates.
Local offline: `DATA_BACKEND=local`. Production: `DATA_BACKEND=supabase`.
