import { hasEmoji, hasQuestion, isEvening, type FeatureInput } from "@/lib/ml/features";

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hidden ground truth (BLUEPRINT 5.4). Callers store the result with source "simulated" or "seeded".
export function simulateMetrics(v: FeatureInput, seed?: number) {
  const random = seed === undefined ? Math.random : mulberry32(seed);
  const tags = v.hashtags.length;

  let er = 0.03;
  if (hasQuestion(v.caption)) er *= 1.3;
  if (v.caption.length < 150) er *= 1.2;
  if (tags >= 3 && tags <= 6) er *= 1.1;
  if (tags > 10) er *= 0.75;
  if (hasEmoji(v.caption)) er *= 1.1;
  if (v.format === "reel") er *= 1.5;
  if (v.format === "carousel") er *= 1.2;
  if (isEvening(v.postHour)) er *= 1.1;
  er *= 0.6 + (0.8 * (v.panelScore ?? 50)) / 100;
  er *= 0.85 + random() * 0.3;

  const reach = Math.round(2000 + random() * 18000);
  const interactions = reach * er;
  const likes = Math.round(interactions * 0.7);
  const comments = Math.round(interactions * 0.1);
  const shares = Math.round(interactions * 0.1);
  const saves = Math.round(interactions * 0.1);

  return {
    reach,
    views: Math.round(reach * 1.3),
    likes,
    comments,
    shares,
    saves,
    engagementRate: (likes + comments + shares + saves) / reach,
  };
}
