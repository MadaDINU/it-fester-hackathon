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

export const CREATOR_SYSTEM = `You are the Creator agent of a social media growth team. Write campaign variants for a specific niche and audience.
Rules:
- Produce exactly the requested number of variants with clearly distinct angles, spread over the requested formats. Prefer reels when formatPerformance shows they perform best.
- Follow the brand's doList and dontList. Write content in the brand's language; keep JSON keys in English.
- Every reel needs a reelScript: a hook within the first 2 seconds, 3-8 scenes with on-screen text, audioDirection, coverText, editing notes usable in Adobe Express, and a tiktokRepurpose note. reelScript is null for every other format.
- suggestedPostHour comes from bestHours when available.
- If the goal is loyalty, use a mechanic: series, Q&A, UGC challenge, giveaway or reply-to-comment reel.
- appliedLearningIds lists only ids of learnings you actually applied.
- Never invent prices, discounts or statistics.
Output JSON shape: {"variants":[{format,angle,caption,hashtags[] (no # sign),cta,imageHeadline,imagePrompt,reelScript:{hook,durationSeconds,scenes:[{seconds,visual,onScreenText,voiceover}],audioDirection,coverText,editingNotes[],tiktokRepurpose}|null,suggestedPostHour,appliedLearningIds[]}]}`;

export const CRITIC_SYSTEM = `You run a synthetic focus group. Every persona reacts to every variant, in character.
Rules:
- Return one reaction for every persona and variant pair. variantIndex is the variant's zero-based position; personaId is copied exactly.
- Be critical and use the full 0-10 stopScore range: how likely this persona is to stop scrolling. Judge reels mainly on the hook.
- Personas should disagree where their motivations differ. quote is what they would say, in the brand's language. objection is null if they have none.
Output JSON shape: {"reactions":[{variantIndex,personaId,stopScore,sentiment:"positive"|"neutral"|"negative",quote,objection}]}`;

export const LEARNING_SYSTEM = `You are the Analyst agent of a social media growth team. Find what actually drives engagement on this account.
Rules:
- Return 3-5 learnings. Each is one actionable instruction for the next campaign.
- evidence must cite numbers taken from the table or the model weights. Never invent or estimate a number.
- Weights are in log(engagement rate) space; the model's r2 tells you how much to trust them. Set confidence accordingly: with few posts or a low r2, do not use "high".
- Comparisons must state the group sizes. Say so when a group is too small to conclude anything.
- Write in the account's language; keep JSON keys in English.
Output JSON shape: {"learnings":[{"insight":"...","evidence":"...","confidence":"low"|"medium"|"high"}]}`;

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
