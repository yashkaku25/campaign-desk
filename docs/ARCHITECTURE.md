# AI AdTech architecture

One workspace. Campaigns live in our database. Gemini proposes a change. Postgres decides which rows match. Nothing is written until a person approves a preview.

This file is the map. Read it before adding a feature.

For a plain-English product summary and what shipped lately, see `docs/PRODUCT.md`.

## What this product does

A marketer watches CTR, impressions, spend, and conversions, then types a command such as “Pause campaigns with CTR under 2%”, “Optimize my campaigns”, or “I want to create a campaign”. Chat is a performance marketer (Gemini when `GEMINI_API_KEY` is set). It reads the desk numbers and optional sheet creative hints, proposes typed actions, and waits. Create drafts can include `strategyNote` and `expectedOutcome` so the preview and audit trail record the test. Strategies rotate (prospect, retarget, Instant Form, WhatsApp, creative A/B, scale, replace waste). Approve writes the change and an audit row. Reject writes an audit row and leaves campaigns alone.

Questions such as “why is spend up?” or “suggest strategies” get a marketer brief from those numbers. They do not write until someone Approves a create preview.

## How a command moves

```text
Copilot drawer
  -> server action
  -> signed-in user check + rate limit
  -> Gemini returns structured JSON (offline parser only when no API key)
  -> Zod allowlist
  -> SQL-shaped resolver picks the rows (the model never sends ids or SQL)
  -> preview card
       Approve -> apply_campaign_action (one transaction)
       Reject  -> audit row only
```

Money is integer cents. CTR is clicks divided by impressions. Zero impressions means CTR is unknown, not zero.

## Security gates

Each gate has one home.

| Gate | Home |
| --- | --- |
| Environment keys | `src/lib/env.ts` only. Nothing else reads `process.env`. |
| Gemini model id | `src/lib/ai/models.ts` |
| Action allowlist | `src/lib/ai/schemas.ts` — `pause`, `resume`, `set_daily_budget`, `reallocate_budget`, `create_campaign`, `answer` |
| System prompt | `src/lib/ai/prompts/system.ts` — campaign names are data, not instructions |
| Row matching | `src/features/campaigns/services/resolve-targets.ts` |
| Caps | `src/features/campaigns/services/caps.ts` — 25 campaigns, daily budget $1 to $100,000 |
| Preview record | `proposed_actions` — payload hash, target versions, 10-minute expiry |
| The only campaign write | Postgres `apply_campaign_action` when `DATA_BACKEND=supabase`. Local mirror: `src/features/campaigns/services/apply-campaign-action.ts` |
| Sheet URL + metric upsert | Postgres `actor_may_sync` on `set_workspace_sheet` and `upsert_campaign_metric` (`0008_sync_gates.sql`). TypeScript `deny(user, "sync")` mirrors that. |
| Roles / least privilege | `src/features/auth/services/access.ts` — only `role === "admin"` is full access; missing/unknown role is team with no write steps |
| Rate limit | `src/lib/rate-limit.ts` — Upstash when configured, memory counter otherwise. 20 parses per user per hour |
| Browser headers | `src/lib/security/headers.ts` — content policy, no framing, nosniff. HTTPS-only on the live site |
| Email link address | `src/lib/security/app-origin.ts` — confirmation links stay on the live site or the local desk |
| Errors | `src/lib/errors/log-error.ts` |
| Plain chat text | Copilot components render strings as text. No HTML from the model |

Secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_TOKEN`) stay on the server. v1 does not build a Supabase client with the service role. Row security runs as the signed-in user.

An admin can change campaigns, the sheet, and what each team member may do. A team member only gets the steps the admin turns on. The trust boundary is the account plus that role. Apply migrations through `0008_sync_gates.sql` so SQL and TypeScript agree.

`pgvector` is enabled and unused. Mutations do not use retrieval. Explanatory answers use SQL totals.

## Two backends, one door

`DATA_BACKEND=local` is the default so the app runs without cloud keys. It stores the same tables in `data/local-store.json` and runs the same checks as the SQL function (version, expiry, idempotency, all-or-nothing).

`DATA_BACKEND=supabase` calls the SQL function `apply_campaign_action`. Do not update `campaigns` from a second code path. If you change a check, change the TypeScript function and the SQL function together.

## Folder jobs

```text
src/app/                         screens and layouts only
src/components/ui/               shadcn primitives
src/components/shell/            sidebar and page frame
src/features/auth/               session, require user, access / roles
src/features/marketing/          public product page, no data calls
src/features/campaigns/          list, detail, resolve, caps, apply
src/features/copilot/            propose, approve, reject, drawer, preview
src/features/ingestion/          Google Sheet connect + sync (can_sync)
src/features/profile/            settings, team invites, role caps
src/features/practice/           Simulation Ads Manager (local week only — no desk writes)
src/features/audit/              read the audit log
src/lib/ai/                      Gemini, prompts, schema, parse
src/lib/supabase/                browser and server clients
src/lib/errors/                  the one logger
supabase/migrations/             schema, row security, apply + sync gates
supabase/seed.sql                demo campaigns and 30 days of metrics
```

UI files do not import Supabase. Services do not render JSX. Gemini calls stay in `src/lib/ai/`.

Each feature `index.ts` starts with a comment that says what that folder is allowed to do.

## Tables

Every table has `workspace_id` so a later multi-workspace version does not rewrite the schema. v1 has no workspace switcher.

- `workspaces`, `profiles` (profile id matches the auth user)
- `campaigns` — status `draft | active | paused | ended`, `daily_budget_cents`, `version`
- `campaign_metrics_daily` — unique on campaign + day
- `copilot_threads`, `copilot_messages`
- `proposed_actions` — `pending | approved | rejected | expired | failed`
- `audit_log` — insert and read only

Anon with no session sees nothing.

## Edge cases the write path handles

- No matching rows: preview explains that, Approve is hidden.
- Shared names: both campaigns are listed for confirmation.
- Two changes in one sentence: two preview cards.
- Double Approve or a retry: same action id and same payload returns the first result.
- Same action id with a different payload: no write, “already done”.
- Expired preview (10 minutes) or signed-out user: no write.
- Model timeout, bad JSON, or schema miss: no proposed action is stored.
- Budget outside the cap, or a create with no name: rejected before preview.
- CTR filter skips campaigns with zero impressions.
- A second person changed a row: version check fails the whole batch.
- Pausing a paused campaign succeeds and changes nothing.

## Out of scope

Live Meta or Google Ads, multiple workspaces, pgvector search, and billing.

## Run it

1. `npm install`
2. Copy `.env.example` to `.env.local` if you do not already have one.
3. `npm run dev` and open the login page.
4. Local demo account: `yash@studio.test` / `studio-demo`.

`DATA_BACKEND=local` stores rows in `data/local-store.json`. Delete that file to restore the seed. Set `DATA_BACKEND=supabase` only after the migration and seed have been applied in the Supabase project, with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set. Leave `SUPABASE_SERVICE_ROLE_KEY` unset. v1 never builds a client with it.

The Gemini model id is `gemini-3.8-flash` in `src/lib/ai/models.ts`. Without `GEMINI_API_KEY`, a small offline parser handles pause, resume, budget, and create phrases so the preview path still runs. It is not the production parser.

Tests: `npm test`.

## One definer exception

`apply_campaign_action` and `reject_campaign_action` are `SECURITY INVOKER`. Row changes are allowed only while the function sets a transaction-local `app.action_id`. The browser cannot set that.

The new-user trigger that inserts a `profiles` row is `SECURITY DEFINER` because a person cannot insert their profile before they have one. It writes only the new auth user into the single seeded workspace.

`is_workspace_member` is also `SECURITY DEFINER` so row policies can ask “is this person in the workspace?” without a circular policy on `profiles`. It returns a boolean and reads nothing else.
