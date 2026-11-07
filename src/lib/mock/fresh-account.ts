import { BrandWithContext, Community, Dashboard } from "@/lib/contracts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const createdAt = "2026-11-07T12:00:00.000Z";
const freshBrandId = id(900);

// Demonstration fixture representing a brand new account with 0 media and cold start model
export const mockFreshBrand = BrandWithContext.parse({
  id: freshBrandId,
  name: "New Creator Studio",
  websiteUrl: "https://example.com/new-creator",
  instagram: { userId: "fresh-creator", username: "new_creator_demo", followers: 12 },
  dna: {
    summary: "A fresh lifestyle studio starting its digital presence.",
    niche: "Mindful urban living and minimal routines",
    industry: "Lifestyle",
    valueProposition: "Simple everyday routines for focused minds.",
    toneOfVoice: ["Calm", "Direct", "Encouraging"],
    doList: ["Focus on intentional habits"],
    dontList: ["Use noisy hype tactics"],
    contentPillars: ["Daily routines", "Space design", "Mindful work"],
    products: ["Digital journals"],
    targetAudience: "Young professionals establishing healthier routines",
    colors: ["#3B82F6", "#F8FAFC", "#1E293B"],
    keywords: ["routine", "mindfulness", "habits"],
  },
  audience: {
    followers: 12,
    demographics: null,
    bestHours: [],
    formatPerformance: [],
    pillarPerformance: [],
    audienceVoice: null,
    updatedAt: createdAt,
  },
  createdAt,
  importedPosts: 0,
  personas: [
    {
      id: id(910),
      brandId: freshBrandId,
      name: "The Early Explorer",
      ageRange: "22–30",
      gender: null,
      location: null,
      description: "First follower exploring mindful content.",
      motivations: ["Better daily focus"],
      painPoints: ["Information overload"],
      contentTheyLove: ["Short routine tips"],
      preferredFormat: "reel",
      segmentShare: 1.0,
      groundedIn: "Cold start seed persona for fresh brand.",
    },
  ],
  learnings: [],
});

export const mockFreshDashboard = Dashboard.parse({
  brandId: freshBrandId,
  totals: { posts: 0, reach: 0, avgEngagementRate: 0 },
  series: [],
  topPosts: [],
  model: {
    weights: {},
    r2: null,
    samples: 0,
    trainedOn: "seeded",
    updatedAt: createdAt,
  },
  costValue: {
    aiCostEur: 0,
    costPerCampaignEur: 0.025,
    campaigns: 0,
    minutesSaved: 0,
    valueEur: 0,
    roiMultiple: 0,
    assumptions: {
      hourlyRateEur: 20,
      minutesSavedPerCampaign: 115,
      priceInputEurPerMTok: 3,
      priceOutputEurPerMTok: 8.5555555556,
    },
  },
});

export const mockFreshCommunity = Community.parse({
  brandId: freshBrandId,
  comments: [],
  summary: null,
  loyaltyIdeas: [
    {
      title: "Introduce yourself ritual",
      mechanic: "qna",
      description: "Invite your first followers to share what they hope to see.",
      why: "Builds initial connection and gives early audience signals.",
    },
    {
      title: "First milestone celebration",
      mechanic: "giveaway",
      description: "Reward the first 100 followers with early access.",
      why: "Drives early word of mouth and community excitement.",
    },
    {
      title: "Weekly routine series",
      mechanic: "series",
      description: "A recurring weekly post answering beginner questions.",
      why: "Establishes posting cadence and signals reliability.",
    },
  ],
});
