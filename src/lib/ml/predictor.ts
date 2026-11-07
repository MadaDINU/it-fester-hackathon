import type { TModelState } from "@/lib/contracts";
import { extractFeatures, FEATURE_NAMES, type FeatureInput } from "@/lib/ml/features";
import { dot, fitRidge, r2 } from "@/lib/ml/regression";

const MIN_SAMPLES = 8;
const toTarget = (er: number) => Math.log(er + 0.001);

// Prior in log(ER) space, used until an account has enough history.
export const DEFAULT_WEIGHTS: Record<string, number> = {
  intercept: -3.9,
  panelScore: 0.8,
  captionLength: -0.2,
  hashtagCount: 0.1,
  hasQuestion: 0.25,
  hasEmoji: 0.1,
  tooManyHashtags: -0.3,
  isReel: 0.4,
  isCarousel: 0.18,
  eveningPost: 0.1,
};

const toVector = (weights: Record<string, number>) => FEATURE_NAMES.map((name) => weights[name] ?? 0);

export function predict(input: FeatureInput, weights: Record<string, number> = DEFAULT_WEIGHTS): number {
  const er = Math.exp(dot(extractFeatures(input), toVector(weights))) - 0.001;
  return Math.min(0.3, Math.max(0.002, er));
}

export function fit(
  samples: Array<{ input: FeatureInput; engagementRate: number }>,
  trainedOn: TModelState["trainedOn"],
): TModelState {
  const updatedAt = new Date().toISOString();
  if (samples.length < MIN_SAMPLES) {
    return { weights: DEFAULT_WEIGHTS, r2: null, samples: samples.length, trainedOn, updatedAt };
  }
  const X = samples.map((s) => extractFeatures(s.input));
  const y = samples.map((s) => toTarget(s.engagementRate));
  const w = fitRidge(X, y);
  return {
    weights: Object.fromEntries(FEATURE_NAMES.map((name, i) => [name, w[i]])),
    // In-sample fit on log(ER); report as such.
    r2: r2(y, X.map((x) => dot(x, w))),
    samples: samples.length,
    trainedOn,
    updatedAt,
  };
}
