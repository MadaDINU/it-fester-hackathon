import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Metrics, Publication, Variant, type TMetrics } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";
import type { FeatureInput } from "@/lib/ml/features";

export async function getSimulationContext(id: string): Promise<{ status: "published"; features: FeatureInput } | { status: "failed"; features: null } | null> {
  z.string().uuid().parse(id);
  const { data: publication, error } = await supabaseAdmin.from("publications").select("variant_id,status").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to read publication");
  if (!publication) return null;
  const status = Publication.shape.status.parse(publication.status);
  if (status === "failed") return { status, features: null };
  const variantId = z.string().uuid().parse(publication.variant_id);
  const { data: row, error: variantError } = await supabaseAdmin.from("variants").select("caption,hashtags,format,panel_score,suggested_post_hour").eq("id", variantId).maybeSingle();
  if (variantError) throw new Error("Unable to read simulation inputs");
  if (!row) return null;
  const variant = Variant.pick({ caption: true, hashtags: true, format: true, panelScore: true, suggestedPostHour: true }).parse({ caption: row.caption, hashtags: row.hashtags, format: row.format, panelScore: row.panel_score, suggestedPostHour: row.suggested_post_hour });
  return { status, features: { caption: variant.caption, hashtags: variant.hashtags, format: variant.format, panelScore: variant.panelScore, postHour: variant.suggestedPostHour } };
}

export async function saveSimulatedMetrics(input: Omit<TMetrics, "id" | "source" | "capturedAt">): Promise<TMetrics> {
  const metrics = Metrics.parse({ ...input, id: randomUUID(), source: "simulated", capturedAt: new Date().toISOString() });
  const { error } = await supabaseAdmin.from("metrics").insert({
    id: metrics.id, publication_id: metrics.publicationId, reach: metrics.reach, views: metrics.views,
    likes: metrics.likes, comments: metrics.comments, shares: metrics.shares, saves: metrics.saves,
    engagement_rate: metrics.engagementRate, source: metrics.source, captured_at: metrics.capturedAt,
  });
  if (error) throw new Error("Unable to save simulated metrics");
  return metrics;
}
