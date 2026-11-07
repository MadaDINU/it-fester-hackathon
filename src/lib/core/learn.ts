import { generateJSON } from "@/lib/ai/client";
import { LEARNING_SYSTEM, LearningOutput } from "@/lib/ai/prompts";
import type { TLearning, TModelState } from "@/lib/contracts";
import { getBrandWithContext } from "@/lib/db/brands";
import { listMeasuredPosts, type MeasuredPost } from "@/lib/db/imports";
import { insertLearnings } from "@/lib/db/learnings";
import { saveModel } from "@/lib/db/model";
import { hasEmoji, hasQuestion } from "@/lib/ml/features";
import { fit, predict } from "@/lib/ml/predictor";

const MAX_TABLE_ROWS = 100;

export function trainedOnFor(posts: Array<Pick<MeasuredPost, "source">>): TModelState["trainedOn"] {
  const live = posts.filter((p) => p.source === "live").length;
  if (live === posts.length && live > 0) return "live";
  return live === 0 ? "seeded" : "mixed";
}

export async function runLearning(
  brandId: string,
): Promise<{ learnings: TLearning[]; model: TModelState } | null> {
  const brand = await getBrandWithContext(brandId);
  if (!brand) return null;

  const posts = await listMeasuredPosts(brandId);
  const model = fit(
    posts.map((p) => ({ input: p.input, engagementRate: p.engagementRate })),
    trainedOnFor(posts),
  );
  await saveModel(brandId, model);

  const table = posts.slice(0, MAX_TABLE_ROWS).map((p) => ({
    format: p.input.format,
    captionLength: p.input.caption.length,
    hashtags: p.input.hashtags.length,
    hour: p.input.postHour,
    hasQuestion: hasQuestion(p.input.caption),
    hasEmoji: hasEmoji(p.input.caption),
    actualER: Number(p.engagementRate.toFixed(4)),
    predictedER: Number(predict(p.input, model.weights).toFixed(4)),
  }));

  const { learnings } = await generateJSON({
    system: LEARNING_SYSTEM,
    prompt: JSON.stringify({
      totalPosts: posts.length,
      posts: table,
      model: { weights: model.weights, r2: model.r2, samples: model.samples },
      formatPerformance: brand.audience?.formatPerformance ?? [],
      pillarPerformance: brand.audience?.pillarPerformance ?? [],
      audienceVoice: brand.audience?.audienceVoice ?? null,
    }),
    schema: LearningOutput,
    fixture: "learningInsights",
    usage: { operation: "learningInsights", brandId },
  });

  return { learnings: await insertLearnings(brandId, learnings), model };
}
