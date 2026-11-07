import { Learning, type TLearning } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";

export async function listLearnings(brandId: string, limit?: number): Promise<TLearning[]> {
  const query = supabaseAdmin
    .from("learnings")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  const { data, error } = await (limit ? query.limit(limit) : query);
  if (error) throw new Error(error.message);
  return data.map((r) =>
    Learning.parse({
      id: r.id,
      brandId: r.brand_id,
      insight: r.insight,
      evidence: r.evidence,
      confidence: r.confidence,
      createdAt: r.created_at,
    }),
  );
}
