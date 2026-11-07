// Pre-demo check for the local production build. Prints PASS/FAIL and direct links.
// Usage: npm run demo:check  (reads .env.local; values are never printed)
import { listBrands } from "../src/lib/db/brands";
import { listCampaigns } from "../src/lib/db/campaigns";
import { DEMO_BRIEF } from "./demo-config";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
let failures = 0;

function report(ok: boolean, label: string, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
}

function checkEnv() {
  const provider = process.env.AI_PROVIDER || "mock";
  const igMode = process.env.IG_DATA_MODE || "mock";
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  if (provider === "anthropic") required.push("ANTHROPIC_API_KEY");
  if (igMode === "live") required.push("IG_MAIN_ACCESS_TOKEN");
  for (const name of required) report(Boolean(process.env[name]), `env ${name}`, process.env[name] ? "set" : "missing");
  console.log(`      AI_PROVIDER=${provider}  IG_DATA_MODE=${igMode}  PUBLISH_MODE=${process.env.PUBLISH_MODE || "mock"}`);
}

async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(10_000) });
    const health = (await response.json()) as {
      db: boolean;
      aiProvider: string;
      aiSpentEur: number | null;
      aiBudgetEur: number;
    };
    report(health.db, "health db");
    const left = health.aiSpentEur === null ? null : health.aiBudgetEur - health.aiSpentEur;
    report(
      left === null || left > 0.2,
      "AI budget",
      left === null ? "unknown" : `€${left.toFixed(2)} left of €${health.aiBudgetEur}`,
    );
  } catch {
    report(false, "app reachable", `${BASE_URL} — run npm run demo:start first`);
  }
}

async function checkDemoData() {
  const brands = (await listBrands()).filter((b) => b.instagram);
  const brand = process.env.DEMO_BRAND_ID ? brands.find((b) => b.id === process.env.DEMO_BRAND_ID) : brands[0];
  report(Boolean(brand), "demo brand", brand ? `@${brand.instagram?.username}` : "none — run prepare-demo.ts");
  if (!brand) return;
  const campaign = (await listCampaigns(brand.id)).find((c) => c.status === "ready" && c.brief === DEMO_BRIEF);
  report(Boolean(campaign), "prepared campaign", campaign ? DEMO_BRIEF : "none — run prepare-demo.ts");

  console.log("\nLinks:");
  console.log(`  Brand       ${BASE_URL}/brands/${brand.id}`);
  if (campaign) console.log(`  Campaign    ${BASE_URL}/campaigns/${campaign.id}`);
  console.log(`  Analytics   ${BASE_URL}/brands/${brand.id}/analytics`);
  console.log(`  Community   ${BASE_URL}/brands/${brand.id}/community`);
}

async function main() {
  checkEnv();
  await checkHealth();
  await checkDemoData().catch((err) => report(false, "database", err instanceof Error ? err.message : String(err)));
  console.log(failures ? `\n${failures} check(s) failed` : "\nREADY");
  process.exitCode = failures ? 1 : 0;
}

void main();
