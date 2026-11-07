import { z } from "zod";

// Server-side configuration. Client components must never import this file.
// Unset and empty values are equivalent. Modes default to mock so that an unconfigured
// environment can never call paid APIs or publish anything.
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());
const mode = <T extends [string, ...string[]]>(values: T, fallback: T[number]) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.enum(values).default(fallback as never));
const num = (fallback: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().default(fallback));

const EnvSchema = z.object({
  AI_PROVIDER: mode(["anthropic", "mock"], "mock"),
  ANTHROPIC_API_KEY: optional,
  ANTHROPIC_MODEL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("claude-sonnet-5-5"),
  ),

  ANTHROPIC_MODEL_FAST: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("claude-haiku-5-5"),
  ),

  // Defaults match .env.example, which records the source and exchange rate.
  AI_PRICE_INPUT_EUR_PER_MTOK: num(1.74),
  AI_PRICE_OUTPUT_EUR_PER_MTOK: num(8.7),
  AI_PRICE_FAST_INPUT_EUR_PER_MTOK: num(0.087),
  AI_PRICE_FAST_OUTPUT_EUR_PER_MTOK: num(0.435),
  AI_BUDGET_EUR: num(4),
  // Per generateJSON call, retries included. 50 s fits Vercel's 60 s routes; raise it locally.
  AI_TIMEOUT_MS: num(50_000),
  VALUE_HOURLY_RATE_EUR: num(20),
  VALUE_MINUTES_SAVED_PER_CAMPAIGN: num(120),

  SUPABASE_URL: optional,
  SUPABASE_SERVICE_ROLE_KEY: optional,

  IG_DATA_MODE: mode(["live", "mock"], "mock"),
  IG_GRAPH_HOST: mode(["auto", "facebook", "instagram"], "auto"),
  IG_API_VERSION: z.preprocess((v) => (v === "" ? undefined : v), z.string().default("v27.0")),
  IG_MAIN_USER_ID: optional,
  IG_NICHE_BRIEF: optional,
  IG_MAIN_ACCESS_TOKEN: optional,
  IG_PUBLISH_USER_ID: optional,
  IG_PUBLISH_ACCESS_TOKEN: optional,
  PUBLISH_MODE: mode(["live", "mock"], "mock"),

  FB_PAGE_ID: optional,
  FB_PAGE_ACCESS_TOKEN: optional,

  DISCORD_WEBHOOK_URL: optional,
  SLACK_WEBHOOK_URL: optional,

  NEXT_PUBLIC_ADOBE_CLIENT_ID: optional,
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_USE_MOCKS: z.preprocess((v) => v === "true", z.boolean()),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
