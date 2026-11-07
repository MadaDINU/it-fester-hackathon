import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

export type UsageTag = { operation: string; brandId?: string; campaignId?: string };

export function computeCostEur(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1e6) * env.AI_PRICE_INPUT_EUR_PER_MTOK +
    (outputTokens / 1e6) * env.AI_PRICE_OUTPUT_EUR_PER_MTOK
  );
}

// A metering failure must never fail the AI call, so this logs instead of throwing.
export async function recordUsage(entry: UsageTag & {
  provider: string;
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
  latencyMs: number;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("ai_usage").insert({
      brand_id: entry.brandId ?? null,
      campaign_id: entry.campaignId ?? null,
      operation: entry.operation,
      provider: entry.provider,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      cost_eur: computeCostEur(entry.inputTokens, entry.outputTokens),
      estimated: entry.estimated,
      latency_ms: entry.latencyMs,
    });
    if (error) console.error("ai_usage insert failed:", error.message);
  } catch (err) {
    console.error("ai_usage insert failed:", err instanceof Error ? err.message : err);
  }
}
