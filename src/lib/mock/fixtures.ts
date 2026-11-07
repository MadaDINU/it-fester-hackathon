import { BrandWithContext, Campaign, Community, Dashboard } from "@/lib/contracts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const createdAt = "2026-11-07T08:00:00.000Z";
const brandId = id(1);
const campaignId = id(2);

// Demonstration data only; these numbers are not imported Instagram results.
export const mockBrand = BrandWithContext.parse({
  id: brandId, name: "Sunday Coffee", websiteUrl: "https://example.com",
  instagram: { userId: "demo-coffee", username: "sundaycoffee_demo", followers: 4200 },
  dna: {
    summary: "A neighbourhood coffee shop turning everyday breaks into small rituals.",
    niche: "Specialty coffee rituals for busy city creatives", industry: "Coffee",
    valueProposition: "Thoughtful coffee, a welcoming space, and a slower moment.",
    toneOfVoice: ["Warm", "Curious", "Down to earth"],
    doList: ["Show the people behind the coffee"], dontList: ["Make unsupported health claims"],
    contentPillars: ["Coffee rituals", "Behind the bar", "Neighbourhood stories"],
    products: ["Espresso", "Seasonal filter coffee"], targetAudience: "City creatives and local coffee lovers",
    colors: ["#7C3AED", "#F4EEE5", "#23483D"], keywords: ["coffee", "community", "ritual"],
  },
  audience: {
    followers: 4200,
    demographics: { ageGender: [{ bucket: "F.25-34", share: 0.6 }, { bucket: "M.25-34", share: 0.4 }], topCities: [{ name: "Bucharest", share: 0.8 }], topCountries: [{ name: "Romania", share: 0.95 }] },
    bestHours: [8, 12, 18],
    formatPerformance: [{ format: "reel", posts: 20, avgEngagementRate: 0.065 }, { format: "post", posts: 10, avgEngagementRate: 0.041 }],
    pillarPerformance: [{ pillar: "Coffee rituals", posts: 15, avgEngagementRate: 0.058 }],
    audienceVoice: { topics: ["Brewing", "Local community"], praise: ["Welcoming atmosphere"], complaints: ["Weekend queues"], questions: ["Can I brew this at home?"] }, updatedAt: createdAt,
  },
  createdAt, importedPosts: 30,
  personas: ["The morning regular", "The curious brewer", "The remote creative", "The weekend explorer"].map((name, i) => ({
    id: id(10 + i), brandId, name, ageRange: "25–34", gender: null, location: "Bucharest",
    description: "Enjoys discovering thoughtful local coffee experiences.", motivations: ["A better daily ritual"],
    painPoints: ["Limited time"], contentTheyLove: ["Short brewing tips"], preferredFormat: i % 2 ? "post" : "reel",
    segmentShare: 0.25, groundedIn: "Illustrative demo persona, not inferred from real account data.",
  })),
  learnings: [{ id: id(20), brandId, insight: "Show a simple brewing ritual in the opening seconds.", evidence: "Illustrative seeded comparison of reels and posts.", confidence: "medium", createdAt }],
});

export const mockCampaign = Campaign.parse({
  id: campaignId, brandId, kind: "generated", goal: "engagement", platform: "instagram",
  brief: "Invite the neighbourhood to discover a slower morning coffee ritual.", formats: ["reel", "post"], status: "ready", createdAt,
  aiCost: { inputTokens: 3200, outputTokens: 1800, costEur: 0.025, estimated: true },
  variants: ["Your morning, a little slower", "Behind your first cup", "Meet your new daily ritual", "A table for your next idea"].map((angle, i) => ({
    id: id(30 + i), campaignId, origin: "generated", format: i < 2 ? "reel" : "post", angle,
    caption: `${angle}. Join us at Sunday Coffee and tell us how you take your first cup.`,
    hashtags: ["#SundayCoffee", "#CoffeeRitual"], cta: "Save this for your next coffee break", imageHeadline: angle,
    imagePrompt: "Morning light on a ceramic coffee cup at a neighbourhood café", imageUrl: null,
    reelScript: i < 2 ? {
      hook: "Your morning deserves this moment.", durationSeconds: 12,
      scenes: [{ seconds: "0-3", visual: "Close-up of coffee being poured", onScreenText: "Pause. Pour. Enjoy.", voiceover: "Make room for a slower morning." }, { seconds: "3-12", visual: "A guest settles by the window", onScreenText: "Your seat is waiting", voiceover: null }],
      audioDirection: "Warm acoustic beat", coverText: angle, editingNotes: ["Use captions and soft cuts"], tiktokRepurpose: "Keep the opening pour tight and add native captions.",
    } : null,
    suggestedPostHour: 8, panel: mockBrand.personas.map(p => ({ personaId: p.id, personaName: p.name, stopScore: 8 - i, sentiment: "positive", quote: "This feels like a morning I would enjoy.", objection: null })),
    panelScore: 88 - i * 6, predictedEngagementRate: 0.065 - i * 0.006, rank: i + 1, status: "draft", appliedLearningIds: [id(20)],
  })),
});

export const mockDashboard = Dashboard.parse({
  brandId, totals: { posts: 30, reach: 48000, avgEngagementRate: 0.057 },
  series: mockCampaign.variants.map((v, i) => ({ date: `2026-11-0${i + 1}`, actual: 0.06 - i * 0.004, predicted: v.predictedEngagementRate, variantId: v.id, format: v.format, source: "seeded" })),
  topPosts: mockCampaign.variants.map(v => ({ variantId: v.id, caption: v.caption, format: v.format, imageUrl: null, permalink: null, engagementRate: v.predictedEngagementRate ?? 0, source: "seeded" })),
  model: { weights: { isReel: 0.018, captionLength: -0.002, hour: 0.001 }, r2: 0.64, samples: 30, trainedOn: "seeded", updatedAt: createdAt },
  costValue: { aiCostEur: 0.025, costPerCampaignEur: 0.025, campaigns: 1, minutesSaved: 115, valueEur: 115 / 60 * 20, roiMultiple: (115 / 60 * 20) / 0.025, assumptions: { hourlyRateEur: 20, minutesSavedPerCampaign: 115, priceInputEurPerMTok: 3, priceOutputEurPerMTok: 8.5555555556 } },
});

export const mockCommunity = Community.parse({
  brandId,
  comments: [{ id: id(40), brandId, externalId: "demo-comment", mediaExternalId: "demo-media", text: "Can you show us how to brew this at home?", sentiment: "positive", topic: "Brewing", isQuestion: true, suggestedReply: "Absolutely! A simple brewing guide is coming soon.", replied: false, createdAt }],
  summary: { positiveShare: 1, negativeShare: 0, questionShare: 1, topTopics: ["Brewing"] },
  loyaltyIdeas: [{ title: "Your Sunday ritual", mechanic: "series", description: "A weekly brewing tip for the neighbourhood.", why: "Answers the demo audience's brewing questions." }],
});
