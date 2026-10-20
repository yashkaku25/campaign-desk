---
name: desk-simulation
description: Finishes the Campaign desk simulation, the Meta-style run of an ad before it spends. Use proactively when the simulation week, shopper feelings, audience choices, metrics, or the marketer suggestion are missing or still a static list.
---

You finish the simulation. Yash is a designer. The product is a real simulation of a Meta-style campaign. It can be wrong. It does not spend. Real numbers still come from the Google Sheet. Never call it practice.

Read `docs/ARCHITECTURE.md` before you change auth, Gemini, or a campaign write.

## What already exists

- Feelings live in `src/features/practice/emotions/`. Each feeling is one record: stage, start facts, the act it pushes, the act it blocks, the feeling that opposes it, and when it fades. A feeling does not start unless its facts are present. A feeling name is not a fact.
- `resolveShopper` picks a winner and a runner-up at notice, click, pay, and after. A tie stays a tie. After-feelings can carry to the next day.
- `runPractice` in `src/features/practice/services/run-practice.ts` walks 7 days from a headline, copy, picture or video, and optional campaign numbers. It lists what is missing. If impressions and spend exist, it returns a click band and a result band. It does not invent a band when the numbers are missing. (Internal code still uses that file name; the product language is simulation.)
- Campaign options and metric names are started in `src/features/practice/meta/options.ts` and `src/features/practice/meta/metrics.ts`.
- The public page says: simulate the ad before it spends, and the sheet still holds real numbers. The signed-in screen is `/simulation`.

## What you still build

The run has to act from the inputs of that day, not from a frozen list.

1. A screen a signed-in person can open at `/simulation`. They enter the headline, the copy, a picture or a video, and whether the video has words on it. They pick the audience. They can point at a campaign already on the desk so the band uses that campaign’s synced numbers.
2. Audience choices that match Meta in 2026, stored as data the screen can show:
   - Advantage+ audience, where interests are a suggestion, or original audiences, where the audience stays fixed.
   - Hard controls only: location, minimum age, language, a custom-audience exclusion, and a special category.
   - Demographics that still exist: age, gender, relationship, education, work, life events, parents, and US ZIP income bands.
   - Interest groups that still exist after the 2025 consolidation: business and industry, entertainment, family and relationships, fitness and wellness, food and drink, hobbies and activities, shopping and fashion, sports and outdoors, technology. Do not add health causes, sexual orientation, religion, or politics as targetable interests. Those were removed.
   - Behaviors that still exist: page admins, engaged shoppers, mobile device, travel, expats, anniversary. Detailed-targeting exclusions are gone. Custom-audience exclusions stay.
   - Custom audiences: customer list, website visitors, time on page, cart, checkout, purchase, lead, video watch depth, page and Instagram engagement, messages, app. Windows of 1, 3, 7, 14, 30, 60, 90, and 180 days. Carts fade fast. Video viewers can stay longer.
   - Lookalikes from a real source, 1%, then wider. A source under 100 people from one country is not enough. Special categories cannot use a lookalike, age, gender, or ZIP.
3. A marketer step that reads the week and the numbers and says one next change, with the reason. Examples: wait while results are under about 50, turn off an ad people are hiding, shorten a tired cart window, exclude purchasers from a cold set, widen a lookalike whose frequency is high, or loosen a cost goal that is not delivering. The person still Approves any change that writes a campaign. The simulation itself never calls `apply_campaign_action`.
4. Show the winning feeling, the runner-up, and the band on the screen. Say “Simulation. This can be wrong. It does not spend.” Never say practice.

## Rules

- Do not remove Google Sheet connect, sync, photo, or CSV. Those numbers are the real input.
- Do not add Windsor, a Meta login, or a Google Ads login.
- Do not put a secret in a client file or a `NEXT_PUBLIC_` variable.
- UI does not import Supabase or call Gemini. Gemini, if a later search is added, stays in `src/lib/ai/`.
- Campaign writes stay on `apply_campaign_action` only.
- Money mark stays after the number. Plain words. No slogan.
- Do not delete yash@studio.dev, and do not change that account’s email or password.
- Do not edit plan files.
- Add a test for any new rule. Run `node .\node_modules\vitest\vitest.mjs` on the simulation tests under `src/features/practice`, then open `/simulation`.
