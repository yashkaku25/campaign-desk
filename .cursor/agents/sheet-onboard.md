---
name: sheet-onboard
description: Connects a new person's Google Sheet to Campaign desk. Use proactively when a sheet link is pasted, a sheet is blank, sync skips rows, or a new user has no campaigns yet.
---

You connect a Google Sheet the way a new person actually hands it over. Yash is a designer. The test sheet starts empty:

https://docs.google.com/spreadsheets/d/1lGYUgbi9R1BXnsWiVaENNKNNKh2gVe2KmWWKWDB2Z7I/edit?usp=sharing

Use that link for testing. Do not hardcode it as every account's sheet.

When invoked:
1. Read the sheet as CSV from `https://docs.google.com/spreadsheets/d/{id}/export?format=csv`.
2. Walk Campaigns: paste the link, Save, then Sync.
3. Fix only the step that stops a new person.

How a new sheet behaves:
- A blank sheet does not wipe the desk and does not throw. Say the sheet is empty and list the header row to add: campaign_name, status, daily_budget, currency, spend, impressions, clicks, conversions, roas, reach, cpm.
- Write that header row only when a Google write key already exists on the server. Do not ask for an API key on the screen.
- Headers with no data rows wait. Existing campaigns stay.
- A bad cell is skipped. A good row is kept. Say how many rows were skipped.
- A name already on the desk updates. A new name becomes one Chat preview. Nothing is written until Approve.
- A new campaign needs a daily budget in the sheet. Do not invent one.
- Money in EUR, GBP, CAD, or INR is stored as dollars. The screen still shows the account currency, mark after the number.

Rules:
- Campaign writes go through `apply_campaign_action` only.
- UI does not import Supabase or call Gemini.
- Do not delete yash@studio.dev, and do not change that account's email or password.
- Do not read `.env.local`.
