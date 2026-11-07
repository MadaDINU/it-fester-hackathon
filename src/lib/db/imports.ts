import { randomUUID } from "node:crypto";
import type { TIgMedia, TVariant } from "@/lib/contracts";
import type { FeatureInput } from "@/lib/ml/features";
import { supabaseAdmin } from "@/lib/supabase";

export type ImportedPost = {
  media: TIgMedia;
  format: TVariant["format"];
  hashtags: string[];
  postHour: number;
  reach: number; // 0 when insights are missing: such posts are excluded from training
  engagementRate: number;
};

async function getOrCreateHistoryCampaign(brandId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("id")
    .eq("brand_id", brandId)
    .eq("kind", "imported_history")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data.id;

  const created = await supabaseAdmin
    .from("campaigns")
    .insert({
      brand_id: brandId,
      kind: "imported_history",
      goal: "engagement",
      platform: "instagram",
      brief: "Imported Instagram history",
      formats: ["post", "carousel", "reel"],
      status: "published",
    })
    .select("id")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data.id;
}

// Idempotent: publications are keyed by external_id, and live metrics are replaced.
export async function upsertImportedPosts(
  brandId: string,
  posts: ImportedPost[],
  source: "live" | "seeded",
): Promise<void> {
  if (posts.length === 0) return;
  const campaignId = await getOrCreateHistoryCampaign(brandId);

  const existing = await supabaseAdmin
    .from("publications")
    .select("id, variant_id, external_id")
    .in("external_id", posts.map((p) => p.media.id));
  if (existing.error) throw new Error(existing.error.message);
  const known = new Map(existing.data.map((r) => [r.external_id as string, r]));

  const rows = posts.map((post) => {
    const row = known.get(post.media.id);
    return { post, variantId: row?.variant_id ?? randomUUID(), publicationId: row?.id ?? randomUUID() };
  });

  const variants = await supabaseAdmin.from("variants").upsert(
    rows.map(({ post, variantId }) => ({
      id: variantId,
      campaign_id: campaignId,
      origin: "imported",
      format: post.format,
      caption: post.media.caption ?? "",
      hashtags: post.hashtags,
      image_url: post.media.thumbnailUrl,
      suggested_post_hour: post.postHour,
      status: "published",
    })),
  );
  if (variants.error) throw new Error(variants.error.message);

  const publications = await supabaseAdmin.from("publications").upsert(
    rows.map(({ post, variantId, publicationId }) => ({
      id: publicationId,
      variant_id: variantId,
      platform: "instagram",
      mode: "imported",
      account: "main",
      external_id: post.media.id,
      permalink: post.media.permalink,
      status: "published",
      published_at: post.media.timestamp,
    })),
  );
  if (publications.error) throw new Error(publications.error.message);

  const publicationIds = rows.map((r) => r.publicationId);
  const removed = await supabaseAdmin
    .from("metrics")
    .delete()
    .in("publication_id", publicationIds)
    .eq("source", source);
  if (removed.error) throw new Error(removed.error.message);

  const metrics = await supabaseAdmin.from("metrics").insert(
    rows.map(({ post, publicationId }) => ({
      publication_id: publicationId,
      reach: post.reach,
      views: post.media.insights?.views ?? 0,
      likes: post.media.likeCount ?? 0,
      comments: post.media.commentsCount ?? 0,
      shares: post.media.insights?.shares ?? 0,
      saves: post.media.insights?.saved ?? 0,
      engagement_rate: post.engagementRate,
      source,
    })),
  );
  if (metrics.error) throw new Error(metrics.error.message);
}

export type MeasuredPost = {
  input: FeatureInput;
  engagementRate: number;
  source: "live" | "seeded" | "simulated";
};

type MetricJoin = {
  publication_id: string;
  engagement_rate: number;
  source: MeasuredPost["source"];
  publications: {
    variants: {
      format: FeatureInput["format"];
      caption: string;
      hashtags: string[];
      panel_score: number | null;
      suggested_post_hour: number | null;
    };
  };
};

// Every post of the brand with a measured reach, using each publication's latest metrics.
export async function listMeasuredPosts(brandId: string): Promise<MeasuredPost[]> {
  const { data, error } = await supabaseAdmin
    .from("metrics")
    .select(
      "publication_id, engagement_rate, source, publications!inner(variants!inner(format, caption, hashtags, panel_score, suggested_post_hour, campaigns!inner(brand_id)))",
    )
    .eq("publications.variants.campaigns.brand_id", brandId)
    .gt("reach", 0)
    .order("captured_at");
  if (error) throw new Error(error.message);

  const latest = new Map<string, MetricJoin>();
  for (const row of data as unknown as MetricJoin[]) latest.set(row.publication_id, row);

  return [...latest.values()].map((row) => {
    const v = row.publications.variants;
    return {
      input: {
        caption: v.caption,
        hashtags: v.hashtags,
        panelScore: v.panel_score === null ? null : Number(v.panel_score),
        format: v.format,
        postHour: v.suggested_post_hour,
      },
      engagementRate: Number(row.engagement_rate),
      source: row.source,
    };
  });
}

export async function countImportedPosts(brandId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("id")
    .eq("brand_id", brandId)
    .eq("kind", "imported_history");
  if (error) throw new Error(error.message);
  if (data.length === 0) return 0;
  const { count, error: countError } = await supabaseAdmin
    .from("variants")
    .select("id", { head: true, count: "exact" })
    .in("campaign_id", data.map((c) => c.id));
  if (countError) throw new Error(countError.message);
  return count ?? 0;
}
