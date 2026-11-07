import { z } from "zod";
import {
  AudienceProfile,
  BrandDNA,
  CommentInsight,
  Community,
  Learning,
  Persona,
  PersonaReaction,
  Variant,
} from "@/lib/contracts";

// Output schemas for every agent op (BLUEPRINT 5.2). Prompts are added with the pipeline tasks.

export const AUDIENCE_SYSTEM = `You are the Audience agent of a social media growth team. From an Instagram account's real data, define its brand DNA, niche and audience.
Rules:
- The niche must be specific (for example "budget home workouts for busy dads", never just "fitness").
- Create exactly 4 personas. Their segmentShare values must sum to 1 and follow the demographic split when demographics are given.
- Every persona's groundedIn must cite the real data supporting it (a demographic bucket, a comment theme, a top post).
- Never invent statistics. Use only what the data shows.
- Tag every post listed in the data with exactly one of your contentPillars in pillarTags, using its mediaId.
- Write content in the account's language; keep JSON keys in English.
- colors are 2-5 hex codes like #7C3AED. preferredFormat is one of post, carousel, reel, story.
Output JSON shape: {"dna":{summary,niche,industry,valueProposition,toneOfVoice[],doList[],dontList[],contentPillars[2-6],products[],targetAudience,colors[],keywords[]},"pillarTags":[{mediaId,pillar}],"audienceVoice":{topics[],praise[],complaints[],questions[]},"personas":[{name,ageRange,gender,location,description,motivations[],painPoints[],contentTheyLove[],preferredFormat,segmentShare,groundedIn}]}`;

const PersonaDraft = Persona.omit({ id: true, brandId: true });

export const AudienceOutput = z.object({
  dna: BrandDNA,
  pillarTags: z.array(z.object({ mediaId: z.string(), pillar: z.string() })),
  audienceVoice: AudienceProfile.shape.audienceVoice.unwrap(),
  personas: z.array(PersonaDraft).length(4),
});

export const WebsiteOutput = z.object({
  dna: BrandDNA,
  personas: z.array(PersonaDraft).length(4),
});

export const CreatorOutput = z.object({
  variants: z.array(
    Variant.pick({
      format: true,
      angle: true,
      caption: true,
      hashtags: true,
      cta: true,
      imageHeadline: true,
      imagePrompt: true,
      reelScript: true,
      suggestedPostHour: true,
      appliedLearningIds: true,
    }).refine((v) => v.format !== "reel" || v.reelScript !== null, {
      message: "reelScript is required when format is reel",
    }),
  ).min(1),
});

export const CriticOutput = z.object({
  reactions: z.array(
    PersonaReaction.pick({
      personaId: true,
      stopScore: true,
      sentiment: true,
      quote: true,
      objection: true,
    }).extend({ variantIndex: z.number().int().min(0) }),
  ),
});

export const LearningOutput = z.object({
  learnings: z.array(Learning.pick({ insight: true, evidence: true, confidence: true })).min(3).max(5),
});

export const CommunityOutput = z.object({
  comments: z.array(
    CommentInsight.pick({ sentiment: true, topic: true, isQuestion: true, suggestedReply: true }).extend({
      id: z.string(),
    }),
  ),
  loyaltyIdeas: Community.shape.loyaltyIdeas.length(3),
});
