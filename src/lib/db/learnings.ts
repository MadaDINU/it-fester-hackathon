import { Learning, type TLearning } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";

function toLearning(r: {
  id: string;
  brand_id: string;
  insight: string;
  evidence: string;
  confidence: string;
  created_at: string;
}): TLearning {
  return Learning.parse({
    id: r.id,
    brandId: r.brand_id,
    insight: r.insight,
    evidence: r.evidence,
    confidence: r.confidence,
    createdAt: r.created_at,
  });
}

export async function insertLearnings(
  brandId: string,
  learnings: Array<Pick<TLearning, "insight" | "evidence" | "confidence">>,
): Promise<TLearning[]> {
  const { data, error } = await supabaseAdmin
    .from("learnings")
    .insert(learnings.map((l) => ({ brand_id: brandId, ...l })))
    .select("*");
  if (error) throw new Error(error.message);
  return data.map(toLearning);
}

export async function listLearnings(brandId: string, limit?: number): Promise<TLearning[]> {
  const query = supabaseAdmin
    .from("learnings")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  const { data, error } = await (limit ? query.limit(limit) : query);
  if (error) throw new Error(error.message);
  return data.map(toLearning);
}
