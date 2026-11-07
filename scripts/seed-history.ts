// Adds 30 SIMULATED historical posts to the real brand so the learning loop can be shown.
// Every metric is stored with source "seeded" and every post id starts with "seeded_", so the
// API labels them as simulated. Idempotent: reruns update the same 30 posts.
// Usage (only with explicit approval): node --env-file=.env.local --import tsx scripts/seed-history.ts
import type { TIgMedia } from "../src/lib/contracts";
import { toImportedPost } from "../src/lib/core/instagramBrand";
import { trainedOnFor } from "../src/lib/core/learn";
import { findBrandIdByIgUser } from "../src/lib/db/brands";
import { listMeasuredPosts, upsertImportedPosts } from "../src/lib/db/imports";
import { saveModel } from "../src/lib/db/model";
import { env } from "../src/lib/env";
import { fit } from "../src/lib/ml/predictor";
import { simulateMetrics } from "../src/lib/ml/simulate";

const CAPTIONS = [
  "Discipline is choosing what you want most over what you want now. What are you choosing today?",
  "Nobody is coming to save you. Good news: you can do it yourself 💪 #motivation #mindset #discipline",
  "Small steps every day. That's the whole secret.",
  "Your comfort zone is a beautiful place, but nothing grows there 🌱 #growth #selfimprovement #success",
  "Read this twice: you are allowed to start over. Tag someone who needs it.",
  "5 habits that changed my mornings. Save this for tomorrow ☀️ #morningroutine #habits #productivity #motivation",
  "Stop waiting for Monday.",
  "What's one thing you're proud of this week? Tell me below 👇",
  "Fall seven times, stand up eight. #resilience #motivation #nevergiveup",
  "The version of you that you're becoming is worth the work.",
  "Consistency beats intensity. Every single time. #consistency #discipline #goals #mindset #success #growth",
  "Doubt kills more dreams than failure ever will. Which dream are you protecting?",
  "Breathe. You've survived 100% of your worst days.",
  "Be the energy you want to attract ✨ #positivevibes #mindset #lawofattraction",
  "Hard choices, easy life. Easy choices, hard life.",
  "Write your goal down tonight. Read it tomorrow. Repeat. #goals #focus #success",
  "If it doesn't challenge you, it won't change you. Agree?",
  "A reminder for whoever needs it today: rest is not quitting 🙏",
  "Don't compare your chapter 1 to someone else's chapter 20. #selflove #motivation #growth #mindset",
  "Success is quiet work done loudly over time.",
  "Which one do you need to hear today: patience, courage or discipline? 👇",
  "Your future self is watching. Make them proud. #motivation #discipline #success #future",
  "Make it happen. Shock everyone.",
  "Gratitude turns what we have into enough 🙌 #gratitude #mindfulness #happiness",
  "One year from now you'll wish you had started today.",
  "Who's training their mind as hard as their body? #mentalhealth #mindset #strength #motivation #fitness #grind #hustle #goals #success #inspiration #discipline",
  "Progress, not perfection.",
  "Say it out loud: I am capable. What else are you? 👇",
  "The best view comes after the hardest climb ⛰️ #motivation #nevergiveup #adventure",
  "Your only limit is you. #mindset #motivation #limitless",
];

const FORMATS: Array<Pick<TIgMedia, "mediaType" | "mediaProductType">> = [
  { mediaType: "VIDEO", mediaProductType: "REELS" },
  { mediaType: "IMAGE", mediaProductType: "FEED" },
  { mediaType: "CAROUSEL_ALBUM", mediaProductType: "FEED" },
];
const HOURS = [8, 12, 18, 19, 20, 21, 22, 7];

async function main() {
  const igUserId = env.IG_MAIN_USER_ID;
  if (!igUserId) throw new Error("Set IG_MAIN_USER_ID to the real account id");
  const brandId = await findBrandIdByIgUser(igUserId);
  if (!brandId) throw new Error("Real brand not found: run the live from-instagram import first");

  const posts = CAPTIONS.map((caption, i) => {
    const format = FORMATS[i % FORMATS.length];
    const hour = HOURS[i % HOURS.length];
    const hashtags = [...caption.matchAll(/#(\w+)/g)].map((m) => m[1]);
    const featureFormat = format.mediaProductType === "REELS" ? "reel" : format.mediaType === "CAROUSEL_ALBUM" ? "carousel" : "post";
    const m = simulateMetrics({ caption, hashtags, panelScore: null, format: featureFormat, postHour: hour }, 1000 + i);
    const media: TIgMedia = {
      id: `seeded_${String(i + 1).padStart(3, "0")}`,
      caption,
      ...format,
      permalink: null,
      thumbnailUrl: null,
      // One post every 4 days, ending a year ago (before the account went quiet).
      timestamp: new Date(Date.UTC(2025, 10, 1 - i * 4, hour - 2)).toISOString(),
      likeCount: m.likes,
      commentsCount: m.comments,
      insights: { reach: m.reach, views: m.views, saved: m.saves, shares: m.shares, totalInteractions: m.likes + m.comments + m.saves + m.shares },
    };
    return toImportedPost(media);
  });

  await upsertImportedPosts(brandId, posts, "seeded");
  const history = await listMeasuredPosts(brandId);
  const model = fit(history.map((p) => ({ input: p.input, engagementRate: p.engagementRate })), trainedOnFor(history));
  await saveModel(brandId, model);
  console.log(`Seeded ${posts.length} simulated posts on brand ${brandId}. Model: ${model.samples} samples, r2=${model.r2}, trainedOn=${model.trainedOn}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
