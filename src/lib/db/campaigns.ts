import { Campaign, Variant, type TAICost, type TCampaign, type TVariant } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";

type CampaignRow = {
  id: string;
  brand_id: string;
  kind: string;
  goal: string;
  platform: string;
  brief: string;
  formats: string[];
  status: string;
  created_at: string;
};

type UsageRow = {
  campaign_id: string;
  input_tokens: number;
  output_tokens: number;
  cost_eur: number;
  estimated: boolean;
};

function toVariant(r: Record<string, unknown>): TVariant {
  return Variant.parse({
    id: r.id,
    campaignId: r.campaign_id,
    origin: r.origin,
    format: r.format,
    angle: r.angle,
    caption: r.caption,
    hashtags: r.hashtags,
    cta: r.cta,
    imageHeadline: r.image_headline,
    imagePrompt: r.image_prompt,
    imageUrl: r.image_url,
    reelScript: r.reel_script,
    suggestedPostHour: r.suggested_post_hour,
    panel: r.panel,
    panelScore: r.panel_score === null ? null : Number(r.panel_score),
    predictedEngagementRate:
      r.predicted_engagement_rate === null ? null : Number(r.predicted_engagement_rate),
    rank: r.rank,
    status: r.status,
    appliedLearningIds: r.applied_learning_ids,
  });
}

function sumCost(rows: UsageRow[]): TAICost {
  return {
    inputTokens: rows.reduce((s, r) => s + r.input_tokens, 0),
    outputTokens: rows.reduce((s, r) => s + r.output_tokens, 0),
    costEur: rows.reduce((s, r) => s + Number(r.cost_eur), 0),
    estimated: rows.some((r) => r.estimated),
  };
}

function toCampaign(r: CampaignRow, variants: TVariant[], usage: UsageRow[]): TCampaign {
  return Campaign.parse({
    id: r.id,
    brandId: r.brand_id,
    kind: r.kind,
    goal: r.goal,
    platform: r.platform,
    brief: r.brief,
    formats: r.formats,
    status: r.status,
    createdAt: r.created_at,
    variants,
    aiCost: sumCost(usage),
  });
}

async function usageFor(campaignIds: string[]): Promise<UsageRow[]> {
  if (campaignIds.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("ai_usage")
    .select("campaign_id, input_tokens, output_tokens, cost_eur, estimated")
    .in("campaign_id", campaignIds);
  if (error) throw new Error(error.message);
  return data;
}

export async function insertCampaign(fields: {
  brandId: string;
  goal: string;
  platform: string;
  brief: string;
  formats: string[];
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert({
      brand_id: fields.brandId,
      goal: fields.goal,
      platform: fields.platform,
      brief: fields.brief,
      formats: fields.formats,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function setCampaignStatus(id: string, status: TCampaign["status"]): Promise<void> {
  const { error } = await supabaseAdmin.from("campaigns").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertVariants(
  campaignId: string,
  variants: Array<Omit<TVariant, "id" | "campaignId" | "origin" | "imageUrl" | "status">>,
): Promise<void> {
  const { error } = await supabaseAdmin.from("variants").insert(
    variants.map((v) => ({
      campaign_id: campaignId,
      format: v.format,
      angle: v.angle,
      caption: v.caption,
      hashtags: v.hashtags,
      cta: v.cta,
      image_headline: v.imageHeadline,
      image_prompt: v.imagePrompt,
      reel_script: v.reelScript,
      suggested_post_hour: v.suggestedPostHour,
      panel: v.panel,
      panel_score: v.panelScore,
      predicted_engagement_rate: v.predictedEngagementRate,
      rank: v.rank,
      applied_learning_ids: v.appliedLearningIds,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function getCampaign(id: string): Promise<TCampaign | null> {
  const { data, error } = await supabaseAdmin.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const variants = await supabaseAdmin
    .from("variants")
    .select("*")
    .eq("campaign_id", id)
    .order("rank")
    .order("created_at");
  if (variants.error) throw new Error(variants.error.message);
  return toCampaign(data, variants.data.map(toVariant), await usageFor([id]));
}

// Lists generated campaigns only: imported history belongs to analytics. Variants are left empty.
export async function listCampaigns(brandId: string): Promise<TCampaign[]> {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("brand_id", brandId)
    .eq("kind", "generated")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const usage = await usageFor(data.map((c) => c.id));
  return data.map((c) => toCampaign(c, [], usage.filter((u) => u.campaign_id === c.id)));
}
