# Campaign desk

**See how an ad might land before it spends real money.**

Campaign desk is a web app for marketers who run paid ads. It puts your campaign numbers on one desk, lets you practice a campaign before you spend, and gives you a chat helper that suggests changes. Nothing changes until you press **Approve**.

Live site: [campaign-desk-khaki.vercel.app](https://campaign-desk-khaki.vercel.app)

---

## Why we built it

Running ads is stressful for three simple reasons:

1. **Money goes out before you know if the idea is good.** Most people learn an ad was weak only after the budget is gone.
2. **The numbers are scattered.** Results sit in a Google Sheet, in an ads dashboard, and in someone's head.
3. **AI tools change things without asking.** When a chat tool edits a campaign on its own, nobody knows what changed or why.

Campaign desk fixes this. You can test a week of an ad without spending. Your sheet numbers come onto one screen. And every real change waits for a person to approve it, with a record of who did what.

## Who it is for

* Marketers and small teams who run Meta or Google ads
* Founders who manage their own ad budget
* People learning paid ads who want to practice before they spend

---

## What you can do

The app has five main areas, called desks.

| Desk | What it does |
| --- | --- |
| **Overview** | Shows what is live and what needs your attention. |
| **Campaigns** | Open any campaign to see spend, clicks, results and status. |
| **Sheet** | Paste a Google Sheet link. Sync brings those rows onto the desk. |
| **Simulation** | Build an ad the way you would in Ads Manager. See a likely range for the next few days. It never spends money, and it can be wrong. |
| **Chat** | Ask things like "pause campaigns with a low click rate" or "I want to create a campaign". You get a preview first. **Approve** saves it. **Reject** leaves everything as it was. |

## How a change is saved

Chat never edits your campaigns directly. Every change follows the same path:

```text
You type a request in Chat
  -> the AI suggests a change from a short fixed list (pause, resume, set budget, move budget, create)
  -> the app finds the matching campaigns itself, the AI never picks rows
  -> you see a preview card (it expires after 10 minutes)
  -> Approve: one safe database step makes the change and writes an audit record
  -> Reject: nothing changes, the audit still records it
```

Campaign names and numbers are treated as data, never as instructions to the AI.

---

## Accounts

* Sign up with **Continue with Google**, or with name, email, password and currency.
* Email sign up accepts **Gmail** and **Microsoft** addresses (outlook.com, hotmail.com, live.com, msn.com). Temporary email is blocked.
* **Every person gets their own private desk.** Nobody else can see your campaigns, sheet or chat.
* You can delete your account from Settings. Your desk and its data are removed with it. (Accounts made with Google can't do this yet, because Settings asks for a password.)

---

## Built with

| Part | Tool |
| --- | --- |
| App | [Next.js 15](https://nextjs.org), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database, login and file storage | [Supabase](https://supabase.com) (Postgres with row security) |
| AI helper | Google Gemini. A small offline helper is used when no key is set. |
| Rate limits | Upstash Redis (optional) |
| Hosting | [Vercel](https://vercel.com). Every push to `main` goes live. |
| Tests | Vitest |

---

## Run it on your computer

You need **Node.js 22 or newer**.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Then open http://127.0.0.1:3000

The example settings run the app in **local mode**. It saves data to a file on your computer and needs no cloud accounts. Sign in with the demo login shown on the sign in page.

To use the real database, set `DATA_BACKEND=supabase` and add your Supabase URL and public key in `.env.local`. See `.env.example` for every setting.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app on your computer |
| `npm test` | Runs all tests |
| `npm run build` | Makes the production build |
| `npm run check:secrets` | Checks that no private keys are about to be committed |

---

## Project map

```text
src/app/                 pages and layouts
src/features/auth/       sign up, sign in, Google login, sessions
src/features/campaigns/  campaign list, details, the safe change step
src/features/copilot/    the Chat helper and preview cards
src/features/ingestion/  Google Sheet connect and sync
src/features/practice/   the Simulation (never spends, never edits real campaigns)
src/features/marketing/  the public landing page
src/features/profile/    settings, photo, currency, delete account
src/lib/ai/              Gemini, prompts and the list of allowed actions
supabase/migrations/     database tables, security rules and functions
docs/                    product notes, architecture and security checklist
```

## Database changes

Database changes live in `supabase/migrations/`, numbered in order. When you add one, apply it to the live Supabase project as well. GitHub and the live database should always match.

## Keeping secrets safe

Private keys never go into GitHub. They live in Vercel settings, or in `.env.local` on your own computer. The browser only ever sees the public Supabase URL and public key. Run `npm run check:secrets` before you push. The full checklist is in [`docs/SECURITY.md`](docs/SECURITY.md).

---

## What it does not do yet

* It does not connect to live Meta or Google Ads accounts. Real numbers come from your Google Sheet.
* No shared team desks. Each person has their own.
* No billing.

## More reading

* [`docs/PRODUCT.md`](docs/PRODUCT.md): the product in plain words
* [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): how the code is organized and why
* [`docs/SECURITY.md`](docs/SECURITY.md): what stays private and how
