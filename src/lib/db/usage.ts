import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

export type UsageTag = { operation: string; brandId?: string; campaignId?: string };

export type ModelTier = "main" | "fast";

const SPEND_CACHE_MS = 30_000;
let spendCache: { eur: number; at: number } | null = null;

// Total measured spend across all brands, cached for 30 s; recordUsage adds to it.
export async function getTotalAiSpend(): Promise<number> {
  if (spendCache && Date.now() - spendCache.at < SPEND_CACHE_MS) return spendCache.eur;
  let eur = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("ai_usage")
      .select("cost_eur")
      .eq("estimated", false)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data) eur += Number(row.cost_eur);
    if (data.length < 1000) break;
  }
  spendCache = { eur, at: Date.now() };
  return eur;
}

// Total AI cost of a brand (imports and learning included) and the part tied to campaigns.
export async function getBrandAiCost(brandId: string): Promise<{ totalEur: number; campaignEur: number }> {
  let totalEur = 0;
  let campaignEur = 0;
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabaseAdmin
      .from("ai_usage")
      .select("cost_eur, campaign_id")
      .eq("brand_id", brandId)
      .order("id")
      .range(from, from + page - 1);
    if (error) throw new Error(error.message);
    for (const row of data) {
      const cost = Number(row.cost_eur);
      totalEur += cost;
      if (row.campaign_id) campaignEur += cost;
    }
    if (data.length < page) break;
  }
  return { totalEur, campaignEur };
}

export function computeCostEur(inputTokens: number, outputTokens: number, tier: ModelTier = "main"): number {
  const [priceIn, priceOut] =
    tier === "fast"
      ? [env.AI_PRICE_FAST_INPUT_EUR_PER_MTOK, env.AI_PRICE_FAST_OUTPUT_EUR_PER_MTOK]
      : [env.AI_PRICE_INPUT_EUR_PER_MTOK, env.AI_PRICE_OUTPUT_EUR_PER_MTOK];
  return (inputTokens / 1e6) * priceIn + (outputTokens / 1e6) * priceOut;
}

// A metering failure must never fail the AI call, so this logs instead of throwing.
export async function recordUsage(entry: UsageTag & {
  provider: string;
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
  latencyMs: number;
  tier?: ModelTier;
}): Promise<void> {
  const costEur = computeCostEur(entry.inputTokens, entry.outputTokens, entry.tier);
  if (spendCache && !entry.estimated) spendCache.eur += costEur;
  try {
    const { error } = await supabaseAdmin.from("ai_usage").insert({
      brand_id: entry.brandId ?? null,
      campaign_id: entry.campaignId ?? null,
      operation: entry.operation,
      provider: entry.provider,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      cost_eur: costEur,
      estimated: entry.estimated,
      latency_ms: entry.latencyMs,
    });
    if (error) console.error("ai_usage insert failed:", error.message);
  } catch (err) {
    console.error("ai_usage insert failed:", err instanceof Error ? err.message : err);
  }
}
