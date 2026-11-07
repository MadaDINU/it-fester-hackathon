// End-to-end API check. Usage: BASE_URL=https://... npx tsx scripts/smoke.ts
// Creates data in the target database. With AI_PROVIDER=anthropic on the server it spends tokens.
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Json = Record<string, unknown>;
let failed = 0;

async function step<T>(name: string, run: () => Promise<T>): Promise<T | null> {
  const started = Date.now();
  const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)} s`;
  try {
    const result = await run();
    console.log(`PASS  ${name}  (${elapsed()})`);
    return result;
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}  (${elapsed()}): ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function call(path: string, body?: unknown): Promise<Json> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as Json;
}

function check(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Smoke test against ${BASE_URL}`);

  await step("health", async () => {
    const health = await call("/api/health");
    check(health.db === true, `db is ${health.db}`);
    console.log(`      ai=${health.aiProvider} publish=${health.publishMode} ig=${health.igDataMode}`);
  });

  const brand = await step("from-instagram", async () => {
    const result = await call("/api/brands/from-instagram", { limit: 30 });
    check((result.personas as unknown[]).length === 4, "expected 4 personas");
    return result;
  });

  if (brand) {
    const brandId = brand.id as string;

    await step("campaign", async () => {
      const campaign = await call("/api/campaigns", {
        brandId,
        goal: "followers",
        platform: "instagram",
        brief: "Smoke test campaign for the main audience",
        formats: ["reel", "post"],
      });
      check(campaign.status === "ready", `status is ${campaign.status}`);
      check((campaign.variants as unknown[]).length >= 2, "expected at least 2 variants");
    });

    await step("learn", async () => {
      const result = await call(`/api/brands/${brandId}/learn`, {});
      check((result.learnings as unknown[]).length >= 3, "expected at least 3 learnings");
    });

    await step("dashboard", async () => {
      const result = await call(`/api/brands/${brandId}/dashboard`);
      check(result.brandId === brandId, "wrong brand");
    });

    await step("community", async () => {
      const result = await call(`/api/brands/${brandId}/community`, {});
      check((result.loyaltyIdeas as unknown[]).length > 0 || (result.comments as unknown[]).length === 0, "no loyalty ideas");
    });
  } else {
    failed++;
    console.log("SKIP  campaign, learn, dashboard, community: no brand");
  }

  await step("analyze", async () => {
    const result = await call("/api/brands/analyze", {
      name: "Smoke Test Cafe",
      description: "A neighbourhood specialty coffee shop with a small bakery.",
    });
    check((result.personas as unknown[]).length === 4, "expected 4 personas");
  });

  console.log(failed ? `\nFAILED: ${failed}` : "\nALL PASSED");
  process.exitCode = failed ? 1 : 0;
}

void main();
