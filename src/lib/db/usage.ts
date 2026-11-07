import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

export type UsageTag = { operation: string; brandId?: string; campaignId?: string };

export type ModelTier = "main" | "fast";

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
  try {
    const { error } = await supabaseAdmin.from("ai_usage").insert({
      brand_id: entry.brandId ?? null,
      campaign_id: entry.campaignId ?? null,
      operation: entry.operation,
      provider: entry.provider,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      cost_eur: computeCostEur(entry.inputTokens, entry.outputTokens, entry.tier),
      estimated: entry.estimated,
      latency_ms: entry.latencyMs,
    });
    if (error) console.error("ai_usage insert failed:", error.message);
  } catch (err) {
    console.error("ai_usage insert failed:", err instanceof Error ? err.message : err);
  }
}
