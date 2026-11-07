// Pre-rehearsal check of the demo data and pages. Makes NO AI calls and changes nothing.
// Usage: BASE_URL=https://... node --env-file=.env.local --import tsx scripts/rehearsal-check.ts
// (BASE_URL defaults to http://localhost:3000; the database checks read the shared Supabase.)
import { supabaseAdmin } from "../src/lib/supabase";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const BRAND = process.env.DEMO_BRAND_ID ?? "cb86e39b-2a6c-439e-8523-c3436354d665";
const CAMPAIGN = process.env.DEMO_CAMPAIGN_ID ?? "8af05aef-5e27-4d32-bf90-2dc3d894a511";

type Row = { check: string; ok: boolean; detail: string };
const rows: Row[] = [];
const record = (check: string, ok: boolean, detail = "") => rows.push({ check, ok, detail });

async function status(url: string): Promise<number> {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(30_000) })).status;
  } catch {
    return 0;
  }
}

async function json<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function main() {
  console.log(`Rehearsal check against ${BASE_URL} (no AI calls)\n`);

  for (const path of ["/", "/brands", `/brands/${BRAND}`, `/brands/${BRAND}/analytics`, `/brands/${BRAND}/community`, `/campaigns/${CAMPAIGN}`]) {
    const code = await status(`${BASE_URL}${path}`);
    record(`page ${path}`, code === 200, String(code));
  }

  try {
    const campaign = await json<{ status: string; variants: Array<{ id: string; rank: number; format: string; imageUrl: string | null }> }>(`/api/campaigns/${CAMPAIGN}`);
    record("campaign ready", campaign.status === "ready", `${campaign.status}, ${campaign.variants.length} variants`);
    for (const v of campaign.variants) {
      if (!v.imageUrl) {
        record(`creative rank ${v.rank} (${v.format})`, false, "not rendered (imageUrl null)");
        continue;
      }
      const code = await status(v.imageUrl);
      record(`creative rank ${v.rank} (${v.format})`, code === 200, String(code));
    }
  } catch (err) {
    record("campaign API", false, String(err));
  }

  try {
    const d = await json<{ series: Array<{ source: string }>; model: { trainedOn: string; samples: number; r2: number | null } | null }>(`/api/brands/${BRAND}/dashboard`);
    const live = d.series.filter((s) => s.source === "live").length;
    record("dashboard: no live posts (real cold start)", live === 0, `${live} live points`);
    record("dashboard: trainedOn seeded", d.model?.trainedOn === "seeded", String(d.model?.trainedOn));
    record("dashboard: 30 samples", d.model?.samples === 30, `${d.model?.samples} samples, r2 ${d.model?.r2?.toFixed(2)}`);
  } catch (err) {
    record("dashboard API", false, String(err));
  }

  try {
    const c = await json<{ comments: unknown[]; loyaltyIdeas: Array<{ title: string }> }>(`/api/brands/${BRAND}/community`);
    record("community: 0 comments", c.comments.length === 0, `${c.comments.length}`);
    record("community: 3 loyalty ideas", c.loyaltyIdeas.length === 3, c.loyaltyIdeas.map((i) => i.title).join("; "));
  } catch (err) {
    record("community API", false, String(err));
  }

  const romanian = /[ăâîșşțţĂÂÎȘŞȚŢ]/;
  const { data: learnings } = await supabaseAdmin.from("learnings").select("insight").eq("brand_id", BRAND);
  const nonEnglish = (learnings ?? []).filter((l) => romanian.test(l.insight)).length;
  record("DB: 5 learnings, all English", learnings?.length === 5 && nonEnglish === 0, `${learnings?.length} learnings, ${nonEnglish} with Romanian text`);

  const { data: campaigns } = await supabaseAdmin.from("campaigns").select("id,brief").eq("brand_id", BRAND).eq("kind", "generated");
  const others = (campaigns ?? []).filter((c) => c.id !== CAMPAIGN);
  record("DB: only the demo campaign", others.length === 0, others.length ? `extra: ${others.map((c) => `${c.id.slice(0, 8)} "${c.brief.slice(0, 40)}"`).join(", ")}` : "8af05aef only");

  const { data: ideas } = await supabaseAdmin.from("loyalty_ideas").select("title").eq("brand_id", BRAND);
  const oldIdeas = (ideas ?? []).filter((i) => romanian.test(i.title)).length;
  record("DB: loyalty ideas in English", oldIdeas === 0, `${ideas?.length} stored, ${oldIdeas} in Romanian (only the latest 3 are shown)`);

  try {
    const h = await json<{ aiProvider: string; igDataMode: string; aiSpentEur: number | null; aiBudgetEur: number }>("/api/health");
    const left = h.aiSpentEur === null ? null : h.aiBudgetEur - h.aiSpentEur;
    record("budget left", left !== null && left > 1, left === null ? "unknown" : `€${left.toFixed(2)} of €${h.aiBudgetEur} (ai=${h.aiProvider}, ig=${h.igDataMode})`);
  } catch (err) {
    record("health API", false, String(err));
  }

  const width = Math.max(...rows.map((r) => r.check.length));
  for (const r of rows) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.check.padEnd(width)}  ${r.detail}`);
  const failed = rows.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nALL PASSED");
  process.exitCode = failed ? 1 : 0;
}

void main();
