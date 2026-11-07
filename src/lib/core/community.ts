import { generateJSON } from "@/lib/ai/client";
import { COMMUNITY_SYSTEM, CommunityOutput } from "@/lib/ai/prompts";
import { Community, type TCommentInsight, type TCommunity } from "@/lib/contracts";
import { getBrandWithContext } from "@/lib/db/brands";
import {
  brandExists,
  insertLoyaltyIdeas,
  listComments,
  listLoyaltyIdeas,
  listUnprocessedComments,
  saveCommentAnalysis,
} from "@/lib/db/comments";
import { env } from "@/lib/env";

const MAX_UNPROCESSED = 40;

export function summarizeComments(comments: TCommentInsight[]): TCommunity["summary"] {
  const processed = comments.filter((c) => c.sentiment !== null);
  if (processed.length === 0) return null;
  const share = (n: number) => Number((n / processed.length).toFixed(3));
  const counts = new Map<string, number>();
  for (const c of processed) {
    const topic = c.topic?.trim().toLowerCase();
    if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  const topTopics = [...counts.entries()]
    .sort((a, b) => b[1] - a[1]) // stable: ties keep first-seen order
    .slice(0, 5)
    .map(([topic]) => topic);
  return {
    positiveShare: share(processed.filter((c) => c.sentiment === "positive").length),
    negativeShare: share(processed.filter((c) => c.sentiment === "negative").length),
    questionShare: share(processed.filter((c) => c.isQuestion === true).length),
    topTopics,
  };
}

export async function getCommunity(brandId: string): Promise<TCommunity | null> {
  if (!(await brandExists(brandId))) return null;
  const [comments, loyaltyIdeas] = await Promise.all([listComments(brandId, 50), listLoyaltyIdeas(brandId, 3)]);
  return Community.parse({ brandId, comments, summary: summarizeComments(comments), loyaltyIdeas });
}

export async function runCommunityAgent(brandId: string): Promise<TCommunity | null> {
  const brand = await getBrandWithContext(brandId);
  if (!brand) return null;

  const pending = await listUnprocessedComments(brandId, MAX_UNPROCESSED);
  if (pending.length === 0) return getCommunity(brandId);

  const result = await generateJSON({
    system: COMMUNITY_SYSTEM,
    // Only comment ids and text leave the system, never usernames.
    prompt: JSON.stringify({ dna: brand.dna, comments: pending.map((c) => ({ id: c.id, text: c.text })) }),
    schema: CommunityOutput,
    tier: "fast",
    maxTokens: 6000,
    fixture: "communityAnalysis",
    usage: { operation: "communityAnalysis", brandId },
  });

  // Mock fixtures carry fixed ids, so they are matched to the sent comments by position.
  const returned =
    env.AI_PROVIDER === "mock"
      ? result.comments.slice(0, pending.length).map((c, i) => ({ ...c, id: pending[i].id }))
      : result.comments;
  const sent = new Set(pending.map((c) => c.id));
  const seen = new Set<string>();
  const items = returned.filter((c) => {
    if (!sent.has(c.id) || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  await saveCommentAnalysis(brandId, items);
  await insertLoyaltyIdeas(brandId, result.loyaltyIdeas);
  return getCommunity(brandId);
}
