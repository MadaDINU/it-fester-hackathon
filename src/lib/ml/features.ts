import type { z } from "zod";
import type { Format } from "@/lib/contracts";

export type FeatureInput = {
  caption: string;
  hashtags: string[];
  panelScore: number | null;
  format: z.infer<typeof Format>;
  postHour: number | null;
};

export const FEATURE_NAMES = [
  "intercept",
  "panelScore",
  "captionLength",
  "hashtagCount",
  "hasQuestion",
  "hasEmoji",
  "tooManyHashtags",
  "isReel",
  "isCarousel",
  "eveningPost",
] as const;

export const hasQuestion = (caption: string) => caption.includes("?");
export const hasEmoji = (caption: string) => /\p{Extended_Pictographic}/u.test(caption);
export const isEvening = (hour: number | null) => hour !== null && hour >= 17 && hour <= 22;

export function extractFeatures(v: FeatureInput): number[] {
  return [
    1,
    (v.panelScore ?? 50) / 100,
    Math.min(v.caption.length, 600) / 600,
    v.hashtags.length / 10,
    hasQuestion(v.caption) ? 1 : 0,
    hasEmoji(v.caption) ? 1 : 0,
    v.hashtags.length > 10 ? 1 : 0,
    v.format === "reel" ? 1 : 0,
    v.format === "carousel" ? 1 : 0,
    isEvening(v.postHour) ? 1 : 0,
  ];
}
