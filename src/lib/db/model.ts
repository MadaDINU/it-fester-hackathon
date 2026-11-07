import { ModelState, type TModelState } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";

export async function saveModel(brandId: string, model: TModelState): Promise<void> {
  const { error } = await supabaseAdmin.from("model_state").upsert({
    brand_id: brandId,
    weights: model.weights,
    r2: model.r2,
    samples: model.samples,
    trained_on: model.trainedOn,
    updated_at: model.updatedAt,
  });
  if (error) throw new Error(error.message);
}

export async function getModel(brandId: string): Promise<TModelState | null> {
  const { data, error } = await supabaseAdmin
    .from("model_state")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return ModelState.parse({
    weights: data.weights,
    r2: data.r2,
    samples: data.samples,
    trainedOn: data.trained_on,
    updatedAt: data.updated_at,
  });
}
