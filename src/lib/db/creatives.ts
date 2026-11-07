import { z } from "zod";
import { BrandDNA, Variant } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";
import { mockBrand, mockCampaign } from "@/lib/mock/fixtures";

// Keep database access inside the server routes; never import this from a client component.
export async function getCreativeContext(id: string) {
  z.string().uuid().parse(id);
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const variant = mockCampaign.variants.find(v => v.id === id);
    return variant ? { brand: mockBrand, variant } : null;
  }
  const { data: row, error } = await supabaseAdmin.from("variants").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to read creative");
  if (!row) return null;
  const variant = Variant.parse({
    id: row.id, campaignId: row.campaign_id, origin: row.origin, format: row.format, angle: row.angle,
    caption: row.caption, hashtags: row.hashtags, cta: row.cta, imageHeadline: row.image_headline,
    imagePrompt: row.image_prompt, imageUrl: row.image_url, reelScript: row.reel_script,
    suggestedPostHour: row.suggested_post_hour, panel: row.panel, panelScore: row.panel_score,
    predictedEngagementRate: row.predicted_engagement_rate, rank: row.rank, status: row.status, appliedLearningIds: row.applied_learning_ids,
  });
  const { data: campaign, error: campaignError } = await supabaseAdmin.from("campaigns").select("brand_id").eq("id", variant.campaignId).maybeSingle();
  if (campaignError) throw new Error("Unable to read creative campaign");
  if (!campaign) return null;
  const { data: brandRow, error: brandError } = await supabaseAdmin.from("brands").select("name,dna,ig_username").eq("id", campaign.brand_id).maybeSingle();
  if (brandError) throw new Error("Unable to read creative brand");
  if (!brandRow) return null;
  const brand = { name: z.string().parse(brandRow.name), dna: BrandDNA.parse(brandRow.dna), instagram: brandRow.ig_username ? { username: z.string().parse(brandRow.ig_username) } : null };
  return { brand, variant };
}

export async function saveCreative(id: string, jpeg: Buffer) {
  z.string().uuid().parse(id);
  const bucket = supabaseAdmin.storage.from("creatives");
  const { error } = await bucket.upload(`${id}.jpg`, jpeg, { contentType: "image/jpeg", upsert: true, cacheControl: "0" });
  if (error) throw new Error("Creative upload failed");
  const imageUrl = z.string().url().parse(bucket.getPublicUrl(`${id}.jpg`).data.publicUrl);
  const { data, error: updateError } = await supabaseAdmin.from("variants").update({ image_url: imageUrl }).eq("id", id).select("id").maybeSingle();
  if (updateError || !data) throw new Error("Unable to save creative URL");
  return imageUrl;
}
