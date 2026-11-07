// Restores the real demo brand to its clean state after a rehearsal. No AI calls; idempotent.
// Usage: npm run demo:reset
// Keeps: the seeded 30-post history, personas, DNA, ai_usage, the demo campaign and its creatives.
// Removes: mock publications on generated campaigns, campaigns generated after the demo one,
// and all but the newest 5 learnings. Resets the demo campaign to ready and its variants to draft.
import { env } from "../src/lib/env";
import { supabaseAdmin as db } from "../src/lib/supabase";
import { DEMO_BRIEF } from "./demo-config";

const KEEP_LEARNINGS = 5;

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

async function main() {
  const igUserId = env.IG_MAIN_USER_ID;
  const brand = process.env.DEMO_BRAND_ID
    ? { id: process.env.DEMO_BRAND_ID }
    : check(await db.from("brands").select("id").eq("ig_user_id", igUserId ?? "").maybeSingle());
  if (!brand) throw new Error("Demo brand not found (set IG_MAIN_USER_ID or DEMO_BRAND_ID)");

  const generated = check(
    await db.from("campaigns").select("id,brief,status,created_at").eq("brand_id", brand.id).eq("kind", "generated").order("created_at"),
  );
  const demo = process.env.DEMO_CAMPAIGN_ID
    ? generated.find((c) => c.id === process.env.DEMO_CAMPAIGN_ID)
    : generated.find((c) => c.brief === DEMO_BRIEF);
  if (!demo) throw new Error(`Demo campaign "${DEMO_BRIEF}" not found`);

  // 1. Campaigns generated after the demo campaign (rehearsal leftovers).
  const later = generated.filter((c) => c.created_at > demo.created_at);
  for (const c of later) console.log(`delete campaign ${c.id.slice(0, 8)} (${c.status}) "${c.brief.slice(0, 60)}"`);
  if (later.length) check(await db.from("campaigns").delete().in("id", later.map((c) => c.id)));

  // 2. Mock publications on the remaining generated campaigns; metrics cascade. Imported history is untouched.
  const kept = generated.filter((c) => !later.includes(c)).map((c) => c.id);
  const variants = check(await db.from("variants").select("id").in("campaign_id", kept));
  const mockPubs = variants.length
    ? check(await db.from("publications").select("id").in("variant_id", variants.map((v) => v.id)).eq("mode", "mock"))
    : [];
  if (mockPubs.length) check(await db.from("publications").delete().in("id", mockPubs.map((p) => p.id)));

  // 3. Demo campaign back to ready, its variants back to draft.
  check(await db.from("variants").update({ status: "draft" }).eq("campaign_id", demo.id).neq("status", "draft"));
  check(await db.from("campaigns").update({ status: "ready" }).eq("id", demo.id));

  // 4. Only the newest learnings.
  const learnings = check(await db.from("learnings").select("id").eq("brand_id", brand.id).order("created_at", { ascending: false }));
  const extra = learnings.slice(KEEP_LEARNINGS);
  if (extra.length) check(await db.from("learnings").delete().in("id", extra.map((l) => l.id)));

  console.log(
    `Reset done: ${later.length} campaign(s), ${mockPubs.length} mock publication(s), ${extra.length} learning(s) removed; demo campaign ${demo.id.slice(0, 8)} is ready.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
