/**
 * Campaigns: read models, target resolution, caps, and the local apply mirror.
 * UI in this folder must not import Supabase. Writes go through apply_campaign_action.
 */
export { listCampaigns } from "@/features/campaigns/services/list-campaigns";
export { getCampaign } from "@/features/campaigns/services/get-campaign";
