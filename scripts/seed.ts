// Demo-data fallback for when the Instagram API is unavailable (BLUEPRINT 5.5). No LLM calls.
// Run: node --env-file=.env.local --import tsx scripts/seed.ts   (idempotent)
import type { TAudienceProfile, TBrandDNA, TIgMedia, TPersona, TVariant } from "../src/lib/contracts";
import { computeBestHours, computeFormatPerformance } from "../src/lib/core/instagramBrand";
import {
  findBrandIdByIgUser,
  insertInstagramBrand,
  replacePersonas,
  updateBrandProfile,
} from "../src/lib/db/brands";
import { upsertImportedPosts, type ImportedPost } from "../src/lib/db/imports";
import { saveModel } from "../src/lib/db/model";
import { fit } from "../src/lib/ml/predictor";
import { simulateMetrics } from "../src/lib/ml/simulate";

const IG_USER_ID = "seed_demo";
const FOLLOWERS = 12400;

const dna: TBrandDNA = {
  summary: "Home-workout coach for busy parents: short, honest, equipment-free routines.",
  niche: "budget home workouts for busy dads",
  industry: "Fitness coaching",
  valueProposition: "Real results in 15 minutes a day, at home, with no gym and no supplements.",
  toneOfVoice: ["encouraging", "honest", "funny"],
  doList: ["Show real, imperfect homes", "Keep workouts under 15 minutes", "Answer questions in comments"],
  dontList: ["Promote supplements", "Shame bodies", "Promise quick fixes"],
  contentPillars: ["Quick workouts", "Pain-free movement", "Budget fitness", "Dad life humour"],
  products: ["Free 4-week plan", "Paid coaching programme"],
  targetAudience: "Parents aged 28-45 with little time who want to stay fit at home",
  colors: ["#7C3AED", "#111827", "#F59E0B"],
  keywords: ["home workout", "dad fitness", "no equipment", "15 minutes", "back pain"],
};

const audienceVoice: NonNullable<TAudienceProfile["audienceVoice"]> = {
  topics: ["back pain", "beginner plans", "small spaces"],
  praise: ["Honest, no supplements", "Fits a parent's schedule"],
  complaints: ["Loud music in reels", "Some moves are too fast"],
  questions: ["Is this safe with a bad knee?", "How many sets for a beginner?"],
};

const personas: Array<Omit<TPersona, "id" | "brandId">> = [
  {
    name: "Busy Dad Andrei", ageRange: "30-40", gender: "male", location: "Bucharest",
    description: "Desk job, two kids, 20 spare minutes after bedtime.",
    motivations: ["Energy for the kids", "Lose belly fat"], painPoints: ["No time", "Gym membership unused"],
    contentTheyLove: ["Quick routines", "Dad humour"], preferredFormat: "reel", segmentShare: 0.4,
    groundedIn: "Seeded demo data (illustrative, not real analytics)",
  },
  {
    name: "Back-pain Mihai", ageRange: "40-55", gender: "male", location: "Cluj-Napoca",
    description: "Sits all day and wants gentle movement that does not hurt.",
    motivations: ["Pain-free back", "Stay active with grandchildren"], painPoints: ["Fear of injury", "Confusing advice"],
    contentTheyLove: ["Mobility tutorials", "Form checks"], preferredFormat: "carousel", segmentShare: 0.25,
    groundedIn: "Seeded demo data (illustrative, not real analytics)",
  },
  {
    name: "Budget Mom Elena", ageRange: "28-38", gender: "female", location: "Iasi",
    description: "Wants to exercise with the family without buying equipment.",
    motivations: ["Healthy habits for the family", "Save money"], painPoints: ["Small flat", "Tight budget"],
    contentTheyLove: ["Household-item workouts", "Meal tips"], preferredFormat: "post", segmentShare: 0.2,
    groundedIn: "Seeded demo data (illustrative, not real analytics)",
  },
  {
    name: "Returning Beginner Radu", ageRange: "25-35", gender: "male", location: "Timisoara",
    description: "Stopped training years ago and needs a gentle restart.",
    motivations: ["Rebuild a routine", "Feel confident"], painPoints: ["Intimidated by gyms", "Inconsistent habits"],
    contentTheyLove: ["Beginner plans", "Progress stories"], preferredFormat: "reel", segmentShare: 0.15,
    groundedIn: "Seeded demo data (illustrative, not real analytics)",
  },
];

const HOOKS = [
  "15-minute full body workout, no equipment", "Stop doing this if your back hurts", "Dad workout while the kids nap",
  "Budget home gym with a backpack", "3 stretches for desk-job back pain", "Beginner plan: week 1", "Why I never sell supplements",
  "Living-room cardio in 10 minutes", "Is this safe with a bad knee?", "Push-ups for people who hate push-ups",
];
const TAGS = ["homeworkout", "dadfitness", "noequipment", "15minworkout", "backpain", "fitnessathome", "budgetfitness", "momlife"];
const EMOJI = ["", " 💪", " 🔥", ""];
const FORMATS: TVariant["format"][] = ["reel", "post", "carousel", "reel", "post"];
const PILLARS = dna.contentPillars;

function buildPost(i: number): ImportedPost {
  const format = FORMATS[i % FORMATS.length];
  const hook = HOOKS[i % HOOKS.length];
  const question = i % 3 === 0 ? " Which one will you try?" : "";
  const long = i % 4 === 0 ? " " + "Consistency beats intensity, every single week. ".repeat(4) : "";
  const hashtags = TAGS.slice(0, [2, 4, 5, 12, 3][i % 5]).concat(i % 5 === 3 ? TAGS.map((t) => t + "x") : []);
  const caption = `${hook}${EMOJI[i % EMOJI.length]}${question}${long} ${hashtags.map((t) => "#" + t).join(" ")}`;
  const postHour = [8, 12, 19, 20, 21, 7, 18][i % 7];

  const m = simulateMetrics({ caption, hashtags, panelScore: null, format, postHour }, 1000 + i);
  const timestamp = new Date(Date.UTC(2026, 0, 1 + i * 3, postHour - 2, 0, 0)).toISOString();
  const media: TIgMedia = {
    id: `seed_media_${String(i + 1).padStart(3, "0")}`,
    caption,
    mediaType: format === "carousel" ? "CAROUSEL_ALBUM" : format === "reel" ? "VIDEO" : "IMAGE",
    mediaProductType: format === "reel" ? "REELS" : "FEED",
    permalink: null,
    thumbnailUrl: null,
    timestamp,
    likeCount: m.likes,
    commentsCount: m.comments,
    insights: { reach: m.reach, views: m.views, saved: m.saves, shares: m.shares, totalInteractions: m.likes + m.comments + m.shares + m.saves },
  };
  return { media, format, hashtags, postHour, reach: m.reach, engagementRate: m.engagementRate };
}

async function main() {
  const existing = await findBrandIdByIgUser(IG_USER_ID);
  const brandId =
    existing ??
    (await insertInstagramBrand({
      name: "FitDad Demo",
      igUserId: IG_USER_ID,
      igUsername: "fitdad_demo",
      followers: FOLLOWERS,
      websiteUrl: null,
      dna,
    }));

  const posts = Array.from({ length: 40 }, (_, i) => buildPost(i));
  await upsertImportedPosts(brandId, posts, "seeded");
  await replacePersonas(brandId, personas);

  const audience: TAudienceProfile = {
    followers: FOLLOWERS,
    demographics: null,
    bestHours: computeBestHours(null, posts),
    formatPerformance: computeFormatPerformance(posts),
    pillarPerformance: PILLARS.map((pillar, k) => {
      const group = posts.filter((_, i) => i % PILLARS.length === k);
      return { pillar, posts: group.length, avgEngagementRate: group.reduce((s, p) => s + p.engagementRate, 0) / group.length };
    }),
    audienceVoice,
    updatedAt: new Date().toISOString(),
  };
  await updateBrandProfile(brandId, { name: "FitDad Demo", followers: FOLLOWERS, dna, audience });

  await saveModel(
    brandId,
    fit(
      posts.map((p) => ({
        input: { caption: p.media.caption ?? "", hashtags: p.hashtags, panelScore: null, format: p.format, postHour: p.postHour },
        engagementRate: p.engagementRate,
      })),
      "seeded",
    ),
  );

  console.log(`Seeded demo brand ${brandId} (${existing ? "updated" : "created"}) with ${posts.length} posts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
