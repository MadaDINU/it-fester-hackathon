import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { agentFixtures } from "@/lib/ai/agent-fixtures";
import { getTotalAiSpend, recordUsage, type ModelTier, type UsageTag } from "@/lib/db/usage";
import { env } from "@/lib/env";

const TIMEOUT_MS = 50_000;
const MAX_ATTEMPTS = 2;
const MOCK_DELAY_MS = 800;
const JSON_ONLY = "\n\nRespond with a single valid JSON object and nothing else.";

export class AIError extends Error {
  constructor(
    message: string,
    options?: ErrorOptions & { code?: "BUDGET_EXCEEDED" },
  ) {
    super(message, options);
    this.name = "AIError";
    this.code = options?.code;
  }
  code?: "BUDGET_EXCEEDED";
}

export function assertWithinBudget(spentEur: number, budgetEur: number): void {
  if (spentEur >= budgetEur) {
    throw new AIError(
      `AI budget reached: €${spentEur.toFixed(2)} spent of €${budgetEur.toFixed(2)}. Raise AI_BUDGET_EUR or switch AI_PROVIDER to mock.`,
      { code: "BUDGET_EXCEEDED" },
    );
  }
}

export function parseJSONText(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

type GenerateOptions<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  // Accepted for the BLUEPRINT 5.1 signature but not sent: current models reject sampling parameters.
  temperature?: number;
  maxTokens?: number;
  tier?: ModelTier; // "fast" uses ANTHROPIC_MODEL_FAST
  fixture: string;
  usage: UsageTag;
};

async function generateMock<T>(opts: GenerateOptions<T>): Promise<T> {
  const started = Date.now();
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  if (!(opts.fixture in agentFixtures)) throw new AIError(`Unknown fixture: ${opts.fixture}`);
  const fixture = agentFixtures[opts.fixture];
  const result = opts.schema.safeParse(fixture);
  if (!result.success) throw new AIError(`Fixture ${opts.fixture} is invalid: ${result.error.message}`);
  await recordUsage({
    ...opts.usage,
    provider: "mock",
    inputTokens: Math.ceil((opts.system.length + opts.prompt.length) / 4),
    outputTokens: Math.ceil(JSON.stringify(fixture).length / 4),
    estimated: true,
    latencyMs: Date.now() - started,
    tier: opts.tier,
  });
  return result.data;
}

// Without this, thinking consumes max_tokens and most of the time budget.
function thinkingOff(model: string) {
  if (model === "claude-sonnet-5-5") return { thinking: { type: "between_tools" as const } };
  if (model === "claude-haiku-5-5") return { thinking: { type: "disabled" as const } };
  return {};
}

async function generateAnthropic<T>(opts: GenerateOptions<T>): Promise<T> {
  const model = opts.tier === "fast" ? env.ANTHROPIC_MODEL_FAST : env.ANTHROPIC_MODEL;
  if (!env.ANTHROPIC_API_KEY) throw new AIError("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0 });
  // All attempts share one budget so a retry cannot outlive the route's maxDuration.
  const deadline = Date.now() + TIMEOUT_MS;
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.prompt }];
  let lastError = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new AIError(`Timed out; last error: ${lastError}`);
    assertWithinBudget(await getTotalAiSpend(), env.AI_BUDGET_EUR);

    const started = Date.now();
    let response: Anthropic.Message;
    try {
      response = await client.messages.create(
        {
          model,
          max_tokens: opts.maxTokens ?? 4000,
          system: opts.system + JSON_ONLY,
          messages,
          ...thinkingOff(model),
        },
        { timeout: remaining },
      );
    } catch (err) {
      throw new AIError(`Anthropic request failed: ${describeError(err)}`, { cause: err });
    }

    // Every attempt is billed, so every attempt is metered.
    await recordUsage({
      ...opts.usage,
      provider: "anthropic",
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimated: false,
      latencyMs: Date.now() - started,
      tier: opts.tier,
    });

    if (response.stop_reason === "refusal") throw new AIError("The model declined the request");

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    try {
      return opts.schema.parse(parseJSONText(text));
    } catch (err) {
      lastError = describeError(err);
      messages.push(
        { role: "assistant", content: text || "(empty)" },
        { role: "user", content: `That output was invalid: ${lastError}\nReturn the corrected JSON only.` },
      );
    }
  }
  throw new AIError(`Invalid model output after ${MAX_ATTEMPTS} attempts: ${lastError}`);
}

export async function generateJSON<T>(opts: GenerateOptions<T>): Promise<T> {
  return env.AI_PROVIDER === "mock" ? generateMock(opts) : generateAnthropic(opts);
}
