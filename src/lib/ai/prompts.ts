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
