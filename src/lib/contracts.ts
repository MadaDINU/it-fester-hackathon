import { z } from "zod";

export const Platform = z.enum(["instagram", "facebook"]);
export const Format = z.enum(["post", "carousel", "reel", "story"]);
export const Goal = z.enum(["awareness", "engagement", "followers", "traffic", "conversions", "loyalty"]);
const uuid = z.string().uuid();
const share = z.number().min(0).max(1);

// ---------- Instagram snapshot (returned by lib/integrations/instagram.ts) ----------
export const IgMedia = z.object({
  id: z.string(),
  caption: z.string().nullable(),
  mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
  mediaProductType: z.string().nullable(),   // "REELS" | "FEED" | "STORY" | ...
  permalink: z.string().url().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  timestamp: z.string(),
  likeCount: z.number().int().nullable(),
  commentsCount: z.number().int().nullable(),
  insights: z.object({
    reach: z.number().int().nullable(),
    views: z.number().int().nullable(),
    saved: z.number().int().nullable(),
    shares: z.number().int().nullable(),
    totalInteractions: z.number().int().nullable(),
  }).nullable(),
});
export const IgComment = z.object({
  id: z.string(),
  mediaId: z.string(),
  text: z.string(),
  likeCount: z.number().int().nullable(),
  timestamp: z.string(),
  // username deliberately NOT included (privacy)
});
export const Demographics = z.object({
  ageGender: z.array(z.object({ bucket: z.string(), share })),   // e.g. "F.25-34"
  topCities: z.array(z.object({ name: z.string(), share })),
  topCountries: z.array(z.object({ name: z.string(), share })),
});
export const IgSnapshot = z.object({
  profile: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string().nullable(),
    biography: z.string().nullable(),
    website: z.string().nullable(),
    followers: z.number().int(),
    mediaCount: z.number().int(),
  }),
  media: z.array(IgMedia),          // newest first, up to the requested limit
  comments: z.array(IgComment),     // recent comments on the top media
  demographics: Demographics.nullable(),
  onlineHours: z.array(z.number()).length(24).nullable(), // avg followers online per hour (local)
  fetchedAt: z.string(),
  mode: z.enum(["live", "mock"]),
});

// ---------- Brand ----------
export const BrandDNA = z.object({
  summary: z.string(),
  niche: z.string(),                         // specific, e.g. "budget home workouts for busy dads"
  industry: z.string(),
  valueProposition: z.string(),
  toneOfVoice: z.array(z.string()).min(1),
  doList: z.array(z.string()),
  dontList: z.array(z.string()),
  contentPillars: z.array(z.string()).min(2).max(6),
  products: z.array(z.string()),
  targetAudience: z.string(),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(5),
  keywords: z.array(z.string()),
});

export const AudienceProfile = z.object({
  followers: z.number().int(),
  demographics: Demographics.nullable(),
  bestHours: z.array(z.number().int().min(0).max(23)).max(4),
  formatPerformance: z.array(z.object({        // computed from real data, not by the LLM
    format: Format, posts: z.number().int(), avgEngagementRate: z.number(),
  })),
  pillarPerformance: z.array(z.object({        // LLM tags posts to pillars, numbers computed in code
    pillar: z.string(), posts: z.number().int(), avgEngagementRate: z.number(),
  })),
  audienceVoice: z.object({
    topics: z.array(z.string()), praise: z.array(z.string()),
    complaints: z.array(z.string()), questions: z.array(z.string()),
  }).nullable(),
  updatedAt: z.string(),
});

export const Persona = z.object({
  id: uuid, brandId: uuid,
  name: z.string(), ageRange: z.string(), gender: z.string().nullable(), location: z.string().nullable(),
  description: z.string(),
  motivations: z.array(z.string()), painPoints: z.array(z.string()),
  contentTheyLove: z.array(z.string()),
  preferredFormat: Format,
  segmentShare: share,                    // shares sum to ~1 per brand
  groundedIn: z.string(),                 // which real data supports this persona
});

export const Learning = z.object({
  id: uuid, brandId: uuid,
  insight: z.string(), evidence: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  createdAt: z.string(),
});

export const Brand = z.object({
  id: uuid,
  name: z.string(),
  websiteUrl: z.string().url().nullable(),
  instagram: z.object({ userId: z.string(), username: z.string(), followers: z.number().int() }).nullable(),
  dna: BrandDNA,
  audience: AudienceProfile.nullable(),
  createdAt: z.string(),
});
export const BrandWithContext = Brand.extend({
  personas: z.array(Persona),
  learnings: z.array(Learning),
  importedPosts: z.number().int(),
});

// ---------- Content ----------
export const ReelScript = z.object({
  hook: z.string(),                       // first 1–2 seconds, on-screen + spoken
  durationSeconds: z.number().int().min(5).max(90),
  scenes: z.array(z.object({
    seconds: z.string(),                  // "0-2"
    visual: z.string(), onScreenText: z.string(), voiceover: z.string().nullable(),
  })).min(2).max(10),
  audioDirection: z.string(),             // mood/tempo, e.g. "upbeat trending-style beat, 120bpm"
  coverText: z.string(),
  editingNotes: z.array(z.string()),      // cuts, captions, zooms, transitions (Adobe Express-friendly)
  tiktokRepurpose: z.string(),            // what to change for TikTok
});

export const PersonaReaction = z.object({
  personaId: uuid, personaName: z.string(),
  stopScore: z.number().min(0).max(10),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  quote: z.string(), objection: z.string().nullable(),
});

export const Variant = z.object({
  id: uuid, campaignId: uuid,
  origin: z.enum(["generated", "imported"]),
  format: Format,
  angle: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string(),
  imageHeadline: z.string(),
  imagePrompt: z.string(),
  imageUrl: z.string().url().nullable(),
  reelScript: ReelScript.nullable(),      // required when format = "reel"
  suggestedPostHour: z.number().int().min(0).max(23).nullable(),
  panel: z.array(PersonaReaction),
  panelScore: z.number().min(0).max(100).nullable(),             // null for imported
  predictedEngagementRate: z.number().min(0).max(1).nullable(),  // null for imported
  rank: z.number().int().min(1),
  status: z.enum(["draft", "approved", "published"]),
  appliedLearningIds: z.array(uuid),
});

export const AICost = z.object({
  inputTokens: z.number().int(), outputTokens: z.number().int(),
  costEur: z.number(), estimated: z.boolean(),
});

export const Campaign = z.object({
  id: uuid, brandId: uuid,
  kind: z.enum(["generated", "imported_history"]),
  goal: Goal, platform: Platform, brief: z.string(),
  formats: z.array(Format),
  status: z.enum(["generating", "ready", "published", "failed"]),
  createdAt: z.string(),
  variants: z.array(Variant),             // generated: sorted by rank
  aiCost: AICost,
});

// ---------- Results ----------
export const Publication = z.object({
  id: uuid, variantId: uuid, platform: Platform,
  mode: z.enum(["live", "mock", "imported"]),
  account: z.enum(["main", "publish"]),
  externalId: z.string().nullable(), permalink: z.string().url().nullable(),
  status: z.enum(["published", "failed"]), error: z.string().nullable(),
  publishedAt: z.string(),
});

export const Metrics = z.object({
  id: uuid, publicationId: uuid,
  reach: z.number().int(), views: z.number().int(),
  likes: z.number().int(), comments: z.number().int(),
  shares: z.number().int(), saves: z.number().int(),
  engagementRate: z.number().min(0).max(1),  // (likes+comments+shares+saves)/max(reach,1)
  source: z.enum(["live", "seeded", "simulated"]),
  capturedAt: z.string(),
});

export const ModelState = z.object({
  weights: z.record(z.string(), z.number()),
  r2: z.number().nullable(), samples: z.number().int(),
  trainedOn: z.enum(["live", "seeded", "mixed"]),
  updatedAt: z.string(),
});

export const CommentInsight = z.object({
  id: uuid, brandId: uuid, externalId: z.string(), mediaExternalId: z.string(),
  text: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative"]).nullable(),
  topic: z.string().nullable(),
  isQuestion: z.boolean().nullable(),
  suggestedReply: z.string().nullable(),
  replied: z.boolean(),
  createdAt: z.string(),
});

export const Community = z.object({
  brandId: uuid,
  comments: z.array(CommentInsight),     // newest first, max 50
  summary: z.object({
    positiveShare: z.number(), negativeShare: z.number(), questionShare: z.number(),
    topTopics: z.array(z.string()),
  }).nullable(),
  loyaltyIdeas: z.array(z.object({
    title: z.string(),
    mechanic: z.enum(["series", "qna", "challenge_ugc", "giveaway", "reply_reel", "behind_scenes", "poll_story"]),
    description: z.string(), why: z.string(),
  })),
});

export const CostValue = z.object({
  aiCostEur: z.number(), costPerCampaignEur: z.number(), campaigns: z.number().int(),
  minutesSaved: z.number(), valueEur: z.number(), roiMultiple: z.number(),
  assumptions: z.object({
    hourlyRateEur: z.number(), minutesSavedPerCampaign: z.number(),
    priceInputEurPerMTok: z.number(), priceOutputEurPerMTok: z.number(),
  }),
});

export const Dashboard = z.object({
  brandId: uuid,
  totals: z.object({
    posts: z.number().int(), reach: z.number().int(), avgEngagementRate: z.number(),
  }),
  series: z.array(z.object({
    date: z.string(), actual: z.number(), predicted: z.number().nullable(),
    variantId: uuid, format: Format, source: Metrics.shape.source,
  })),
  topPosts: z.array(z.object({
    variantId: uuid, caption: z.string(), format: Format,
    imageUrl: z.string().url().nullable(), permalink: z.string().url().nullable(),
    engagementRate: z.number(), source: Metrics.shape.source,
  })),
  model: ModelState.nullable(),
  costValue: CostValue,
});

// ---------- Requests ----------
export const FromInstagramRequest = z.object({ limit: z.number().int().min(10).max(100).default(50) });
export const AnalyzeBrandRequest = z.object({
  name: z.string().min(1), url: z.string().url().optional(), description: z.string().optional(),
}).refine(r => r.url || r.description, { message: "url or description required" });
export const CreateCampaignRequest = z.object({
  brandId: uuid, goal: Goal, platform: Platform, brief: z.string().min(5),
  formats: z.array(Format).min(1).default(["reel", "post"]),
  variantCount: z.number().int().min(2).max(5).default(4),
});
export const PublishRequest = z.object({
  platform: Platform,
  account: z.enum(["main", "publish"]).default("publish"),
  confirmMainAccount: z.boolean().optional(),   // must be true to post to the 130k account
});
export const ReplyRequest = z.object({ text: z.string().min(1).max(500) });
export const ApiError = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

// ---------- Types ----------
export type TIgSnapshot = z.infer<typeof IgSnapshot>;
export type TIgMedia = z.infer<typeof IgMedia>;
export type TBrandDNA = z.infer<typeof BrandDNA>;
export type TAudienceProfile = z.infer<typeof AudienceProfile>;
export type TPersona = z.infer<typeof Persona>;
export type TLearning = z.infer<typeof Learning>;
export type TBrand = z.infer<typeof Brand>;
export type TBrandWithContext = z.infer<typeof BrandWithContext>;
export type TReelScript = z.infer<typeof ReelScript>;
export type TPersonaReaction = z.infer<typeof PersonaReaction>;
export type TVariant = z.infer<typeof Variant>;
export type TCampaign = z.infer<typeof Campaign>;
export type TPublication = z.infer<typeof Publication>;
export type TMetrics = z.infer<typeof Metrics>;
export type TModelState = z.infer<typeof ModelState>;
export type TCommentInsight = z.infer<typeof CommentInsight>;
export type TCommunity = z.infer<typeof Community>;
export type TAICost = z.infer<typeof AICost>;
export type TCostValue = z.infer<typeof CostValue>;
export type TDashboard = z.infer<typeof Dashboard>;
export type TCreateCampaignRequest = z.infer<typeof CreateCampaignRequest>;
export type TAnalyzeBrandRequest = z.infer<typeof AnalyzeBrandRequest>;
