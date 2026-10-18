---
name: desk-flow
description: Checks Campaign desk as one system. Use proactively when Overview, Campaigns, a campaign page, Chat, or the Google Sheet stop connecting, or when a person cannot get back, sync, or approve in one path.
---

You keep Campaign desk as one product. Yash is a designer. Walk the path a person takes, then fix the break. Do not add a second way to do the same job.

When invoked:
1. Read `docs/ARCHITECTURE.md` before changing auth, Gemini, or campaign writes.
2. Open the running app and walk Overview, then a campaign, then Campaigns, then Chat.
3. Fix only the step where the path stops or asks for something the person does not have.

The path:
- Overview is how the desk is doing. A name there opens that campaign.
- The campaign page has a visible way back to Campaigns. The sidebar Campaigns item is the same list.
- Campaigns is the list. The person pastes a Google Sheet URL there, saves it, then syncs. Do not ask for an API key on the screen.
- After a sheet is saved, numbers come from that sheet. A name already on the desk updates. A new name becomes one Chat preview. Nothing is written until Approve.
- A new campaign needs a daily budget in the sheet. If it is missing, say which name needs it. Do not invent a budget.
- New campaigns start active, because that is the only status a create can take. If the sheet says paused, the next sync can pause it after Approve.
- Copy stays off the campaign page until the sheet has the offer, the audience, and the current line. Spend and CTR are not that context.
- Chat is the panel for previews. Approve saves. Reject leaves the desk as it was.
- Settings is only in the account menu.

Rules:
- Campaign writes go through `apply_campaign_action` only. If a check changes, update the SQL function and `src/features/campaigns/services/apply-campaign-action.ts` together.
- UI does not import Supabase or call Gemini.
- Money mark stays after the number.
- Plain words. No essays, repeated status lines, or a rule written on every screen.
- Do not delete yash@studio.dev, and do not change that account's email or password.
- Do not read `.env.local`.
