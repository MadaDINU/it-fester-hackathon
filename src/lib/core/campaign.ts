import type { z } from "zod";
import { MOCK_PERSONA_IDS } from "@/lib/ai/agent-fixtures";
import { generateJSON } from "@/lib/ai/client";
import { CREATOR_SYSTEM, CRITIC_SYSTEM, CreatorOutput, CriticOutput } from "@/lib/ai/prompts";
import type {
  TAudienceProfile,
  TCampaign,
  TCreateCampaignRequest,
  TPersona,
  TPersonaReaction,
} from "@/lib/contracts";
import { getBrandWithContext } from "@/lib/db/brands";
import { getCampaign, insertCampaign, insertVariants, setCampaignStatus } from "@/lib/db/campaigns";
import { listLearnings } from "@/lib/db/learnings";
import { getModel } from "@/lib/db/model";
import { notifyCampaignReady } from "@/lib/integrations/notify";
import { predict } from "@/lib/ml/predictor";

type Reaction = z.infer<typeof CriticOutput>["reactions"][number];

export function panelFor(variantIndex: number, reactions: Reaction[], personas: TPersona[]) {
  const panel: TPersonaReaction[] = [];
  let score = 0;
  personas.forEach((persona, p) => {
    // The mock fixture cannot know real persona ids, so it is matched by position.
    const reaction = reactions.find(
      (r) => r.variantIndex === variantIndex && (r.personaId === persona.id || r.personaId === MOCK_PERSONA_IDS[p]),
    );
    if (!reaction) return;
    score += persona.segmentShare * reaction.stopScore * 10;
    panel.push({
      personaId: persona.id,
      personaName: persona.name,
      stopScore: reaction.stopScore,
      sentiment: reaction.sentiment,
      quote: reaction.quote,
      objection: reaction.objection,
    });
  });
  return { panel, panelScore: Math.min(100, score) };
}

// The Critic's verdict for each learning the variant claims; a pair it skipped stays unverified.
export function complianceFor(
  variantIndex: number,
  appliedIds: string[],
  compliance: Array<{ variantIndex: number; learningId: string; respected: boolean }>,
) {
  return appliedIds.flatMap((learningId) => {
    const verdict = compliance.find((c) => c.variantIndex === variantIndex && c.learningId === learningId);
    return verdict ? [{ learningId, respected: verdict.respected }] : [];
  });
}

const normalize =(values: number[]) => {
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  return values.map((v) => (range === 0 ? 0.5 : (v - min) / range));
};

// Returns the 1-based rank of each item, by 0.5 norm(panel) + 0.5 norm(predicted).
export function rankScores(panelScores: number[], predictions: number[]): number[] {
  const panel = normalize(panelScores);
  const predicted = normalize(predictions);
  const order = panel
    .map((p, i) => ({ i, score: 0.5 * p + 0.5 * predicted[i] }))
    .sort((a, b) => b.score - a.score);
  const ranks = Array.from({ length: panel.length }, () => 0);
  order.forEach(({ i }, position) => {
    ranks[i] = position + 1;
  });
  return ranks;
}

function summarizeAudience(audience: TAudienceProfile | null) {
  if (!audience) return null;
  const top3 = <T extends { share: number }>(items: T[]) =>
    [...items].sort((a, b) => b.share - a.share).slice(0, 3);
  const { demographics: d } = audience;
  return {
    demographics: d && {
      ageGender: top3(d.ageGender),
      topCities: top3(d.topCities),
      topCountries: top3(d.topCountries),
    },
    formatPerformance: audience.formatPerformance,
    bestHours: audience.bestHours,
    audienceVoice: audience.audienceVoice,
  };
}

export async function createCampaign(req: TCreateCampaignRequest): Promise<TCampaign | null> {
  const brand = await getBrandWithContext(req.brandId);
  if (!brand) return null;

  const campaignId = await insertCampaign(req);
  const usage = { brandId: req.brandId, campaignId };

  try {
    const [learnings, model] = await Promise.all([listLearnings(req.brandId, 6), getModel(req.brandId)]);

    const { variants: drafts } = await generateJSON({
      system: CREATOR_SYSTEM,
      prompt: JSON.stringify({
        dna: brand.dna,
        audience: summarizeAudience(brand.audience),
        personas: brand.personas.map((p) => ({
          name: p.name,
          ageRange: p.ageRange,
          description: p.description,
          motivations: p.motivations,
          painPoints: p.painPoints,
          contentTheyLove: p.contentTheyLove,
          preferredFormat: p.preferredFormat,
          segmentShare: p.segmentShare,
        })),
        learnings: learnings.map((l) => ({ id: l.id, insight: l.insight })),
        goal: req.goal,
        platform: req.platform,
        formats: req.formats,
        brief: req.brief,
        variantCount: req.variantCount,
      }),
      schema: CreatorOutput,
      maxTokens: 8000,
      fixture: "campaignVariants",
      usage: { ...usage, operation: "campaignVariants" },
    });
    const variants = drafts.slice(0, req.variantCount);

    const knownLearnings = new Set(learnings.map((l) => l.id));
    const insightById = new Map(learnings.map((l) => [l.id, l.insight]));
    const applied = variants.map((v) => v.appliedLearningIds.filter((id) => knownLearnings.has(id)));

    const { reactions, compliance } = await generateJSON({
      system: CRITIC_SYSTEM,
      prompt: JSON.stringify({
        personas: brand.personas.map((p) => ({
          personaId: p.id,
          name: p.name,
          ageRange: p.ageRange,
          description: p.description,
          motivations: p.motivations,
          painPoints: p.painPoints,
        })),
        variants: variants.map((v, variantIndex) => ({
          variantIndex,
          format: v.format,
          angle: v.angle,
          caption: v.caption,
          hook: v.reelScript?.hook ?? null,
          hashtags: v.hashtags,
          suggestedPostHour: v.suggestedPostHour,
          appliedLearnings: applied[variantIndex].map((id) => ({ learningId: id, insight: insightById.get(id) })),
        })),
      }),
      schema: CriticOutput,
      maxTokens: 6000,
      tier: "fast",
      fixture: "focusGroup",
      usage: { ...usage, operation: "focusGroup" },
    });

    const scored = variants.map((v, i) => {
      const { panel, panelScore } = panelFor(i, reactions, brand.personas);
      const predictedEngagementRate = predict(
        {
          caption: v.caption,
          hashtags: v.hashtags,
          panelScore,
          format: v.format,
          postHour: v.suggestedPostHour,
        },
        model?.weights,
      );
      return { v, panel, panelScore, predictedEngagementRate };
    });
    const ranks = rankScores(
      scored.map((s) => s.panelScore),
      scored.map((s) => s.predictedEngagementRate),
    );

    await insertVariants(
      campaignId,
      scored.map((s, i) => ({
        ...s.v,
        reelScript: s.v.format === "reel" ? s.v.reelScript : null,
        hashtags: s.v.hashtags.map((h) => h.replace(/^#/, "")),
        appliedLearningIds: applied[i],
        learningCompliance: complianceFor(i, applied[i], compliance),
        panel: s.panel,
        panelScore: s.panelScore,
        predictedEngagementRate: s.predictedEngagementRate,
        rank: ranks[i],
      })),
    );
    await setCampaignStatus(campaignId, "ready");
  } catch (err) {
    await setCampaignStatus(campaignId, "failed").catch(() => undefined);
    throw err;
  }

  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign disappeared after creation");
  notifyCampaignReady(campaign).catch((err) => console.error("notify failed:", err));
  return campaign;
}
