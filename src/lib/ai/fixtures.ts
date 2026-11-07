import type { TIgMedia, TIgSnapshot } from "@/lib/contracts";

// Mock data for AI_PROVIDER=mock and IG_DATA_MODE=mock. The account is fictional.
// Agent fixtures are added in task F1.

const CAPTIONS = [
  "3 moves, 10 minutes, no equipment. Which one do you hate most? #homeworkout #fitdad #noequipment",
  "Your back pain isn't from your chair. It's from these 2 weak muscles. Save this.",
  "The 5-minute morning routine I do before the kids wake up 💪 #morningroutine #busydads",
  "Swipe for the full week plan: 4 sessions, 20 minutes each. #workoutplan #homegym #fitness #training",
  "Stop doing crunches. Do this instead.",
  "What's your biggest excuse for skipping a workout? Be honest 👇",
  "Backpack workout: all you need is a bag and some books 🎒 #budgetfitness #homeworkout",
  "I trained 20 minutes a day for 90 days. Here's what actually changed.",
  "Beginner push-up progression, from wall to floor. #pushups #beginnerworkout #calisthenics",
  "Meal prep for under €25 a week. Full shopping list in the slides. #mealprep #budgetmeals",
  "The stretch nobody does, and everybody needs.",
  "Tried working out with my toddler on my back. Results were mixed 😂 #dadlife #fitdad",
  "Q&A: how do you stay consistent when you sleep 5 hours? Answering your comments.",
  "Why I stopped counting calories, and what I track now.",
  "Squat form check: 3 mistakes I see every day. #squats #formcheck #homegym",
  "A dumbbell is €30. A gym is €40 a month. Do the maths.",
  "Sunday reset: 15 minutes of mobility. Tag someone who sits all day. #mobility #stretching",
  "Five exercises for the living room, carousel version. Save for tonight. #homeworkout #livingroomworkout",
  "You don't need motivation. You need a 10-minute rule.",
  "Pull-up bar review after one year of daily use. Worth it? #pullups #homegym",
  "Which plan should I post next: strength or fat loss? Vote below 👇",
  "From 0 to 10 push-ups in 4 weeks. The exact plan.",
  "Three protein breakfasts in 5 minutes. #protein #healthybreakfast #fitdad",
  "A quiet post: rest days are part of the program.",
  "Tabata in the kitchen while the pasta boils 🍝 #tabata #hiit #homeworkout",
  "The 4 lifts I would keep if I could only keep 4. #strengthtraining #fitness",
  "Your questions about knee pain, answered by a physio.",
  "Before and after isn't about the body. It's about the stairs.",
  "Budget home gym: what to buy first, second and never. #homegym #budgetfitness #equipment #gymsetup",
  "New series: 30 days, 30 tiny habits. Day 1 is drinking water 💧 #30daychallenge #habits",
];

const COMMENT_TEXTS = [
  "This actually fixed my lower back, thank you",
  "Can I do this with a bad knee?",
  "How many sets for a beginner?",
  "The backpack one is genius",
  "Too fast, can you slow it down next time?",
  "Where can I find the full plan?",
  "Did this with my son, he destroyed me",
  "Do you have something for people over 50?",
  "Finally someone without a sponsored supplement",
  "The music is way too loud in these reels",
  "What's the best time of day to train?",
  "Love the honesty in this one",
  "Is 20 minutes really enough to build muscle?",
  "Day 12 of your plan, still going",
  "Please do a version for small apartments",
  "This one felt like an ad, not your usual stuff",
  "What brand is that pull-up bar?",
  "My wife and I do these every morning now",
  "Can you make a plan for night shift workers?",
  "Best account for busy parents, no contest",
];

const FORMATS: Array<Pick<TIgMedia, "mediaType" | "mediaProductType">> = [
  { mediaType: "VIDEO", mediaProductType: "REELS" },
  { mediaType: "IMAGE", mediaProductType: "FEED" },
  { mediaType: "CAROUSEL_ALBUM", mediaProductType: "FEED" },
];

const media: TIgMedia[] = CAPTIONS.map((caption, i) => {
  const format = FORMATS[i % FORMATS.length];
  const isReel = format.mediaProductType === "REELS";
  const isCarousel = format.mediaType === "CAROUSEL_ALBUM";
  // Deterministic spread so the model has signal: reels reach further, questions earn comments.
  const wobble = 0.7 + ((i * 37) % 60) / 100;
  const reach = Math.round((isReel ? 24000 : isCarousel ? 11000 : 7000) * wobble);
  const likes = Math.round(reach * (isReel ? 0.052 : isCarousel ? 0.047 : 0.031) * wobble);
  const comments = Math.round(likes * (caption.includes("?") || caption.includes("👇") ? 0.09 : 0.03));
  const shares = Math.round(reach * (isReel ? 0.008 : 0.003));
  const saved = Math.round(reach * (isCarousel ? 0.018 : 0.006));
  const id = `mock_media_${String(i + 1).padStart(3, "0")}`;
  const hour = [18, 7, 20, 12, 19, 21][i % 6];
  const timestamp = new Date(Date.UTC(2026, 9, 30 - i * 3, hour)).toISOString();

  return {
    id,
    caption,
    ...format,
    permalink: `https://www.instagram.com/p/${id}/`,
    thumbnailUrl: null,
    timestamp,
    likeCount: likes,
    commentsCount: comments,
    insights: {
      reach,
      views: Math.round(reach * (isReel ? 1.6 : 1.2)),
      saved,
      shares,
      totalInteractions: likes + comments + saved + shares,
    },
  };
});

const topMedia = [...media].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 10);

export const mockIgSnapshot: TIgSnapshot = {
  profile: {
    id: "mock_ig_user",
    username: "loopwise_demo_fit",
    name: "Loopwise Demo (mock data)",
    biography: "Budget home workouts for busy parents. 20 minutes, no gym. New plans every week.",
    website: "https://example.com",
    followers: 48200,
    mediaCount: 412,
  },
  media,
  comments: COMMENT_TEXTS.map((text, i) => ({
    id: `mock_comment_${String(i + 1).padStart(3, "0")}`,
    mediaId: topMedia[i % topMedia.length].id,
    text,
    likeCount: (i * 7) % 23,
    timestamp: new Date(Date.UTC(2026, 9, 31, i % 24, i * 2)).toISOString(),
  })),
  demographics: {
    ageGender: [
      { bucket: "M.25-34", share: 0.31 },
      { bucket: "M.35-44", share: 0.27 },
      { bucket: "F.25-34", share: 0.16 },
      { bucket: "F.35-44", share: 0.12 },
      { bucket: "M.18-24", share: 0.08 },
      { bucket: "M.45-54", share: 0.06 },
    ],
    topCities: [
      { name: "Bucharest", share: 0.14 },
      { name: "Cluj-Napoca", share: 0.07 },
      { name: "Timisoara", share: 0.05 },
      { name: "Iasi", share: 0.04 },
    ],
    topCountries: [
      { name: "RO", share: 0.62 },
      { name: "IT", share: 0.09 },
      { name: "DE", share: 0.07 },
      { name: "ES", share: 0.05 },
    ],
  },
  onlineHours: [
    900, 500, 300, 250, 300, 800, 2100, 3400, 3100, 2600, 2500, 2900, 3600, 3200, 2800, 2900, 3300,
    4200, 5100, 5900, 6200, 5400, 3600, 1900,
  ],
  fetchedAt: "2026-11-01T08:00:00.000Z",
  mode: "mock",
};
