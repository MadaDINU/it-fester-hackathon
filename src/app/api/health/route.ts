import { env } from "@/lib/env";
import { ok } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function checkDb(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("brands")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const db = await checkDb();
  return ok({
    ok: db,
    db,
    aiProvider: env.AI_PROVIDER,
    publishMode: env.PUBLISH_MODE,
    igDataMode: env.IG_DATA_MODE,
  });
}
