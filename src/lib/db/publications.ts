import { z } from "zod";
import { Publication, type TPublication } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";

export async function savePublication(input: TPublication, campaignId: string): Promise<TPublication> {
  const publication = Publication.parse(input);
  z.string().uuid().parse(campaignId);
  // Demo responses are deliberately ephemeral; never write fixture IDs to a real database.
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") return publication;
  const { error } = await supabaseAdmin.from("publications").insert({
    id: publication.id, variant_id: publication.variantId, platform: publication.platform,
    mode: publication.mode, account: publication.account, external_id: publication.externalId,
    permalink: publication.permalink, status: publication.status, error: publication.error,
    published_at: publication.publishedAt,
  });
  if (error) throw new Error("Unable to save publication");
  if (publication.status === "published") {
    const variant = await supabaseAdmin.from("variants").update({ status: "published" }).eq("id", publication.variantId).select("id").maybeSingle();
    if (variant.error || !variant.data) throw new Error("Publication saved but variant status could not be updated");
    const campaign = await supabaseAdmin.from("campaigns").update({ status: "published" }).eq("id", campaignId).select("id").maybeSingle();
    if (campaign.error || !campaign.data) throw new Error("Publication saved but campaign status could not be updated");
  }
  return publication;
}
