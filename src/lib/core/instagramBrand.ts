import { generateJSON } from "@/lib/ai/client";
import { AUDIENCE_SYSTEM, AudienceOutput } from "@/lib/ai/prompts";
import {
  IgSnapshot,
  type TAudienceProfile,
  type TBrandDNA,
  type TBrandWithContext,
  type TIgMedia,
  type TIgSnapshot,
  type TVariant,
} from "@/lib/contracts";
import {
  deleteBrand,
  findBrandIdByIgUser,
  getBrandWithContext,
  insertInstagramBrand,
  replacePersonas,
  updateBrandProfile,
} from "@/lib/db/brands";
import { upsertComments } from "@/lib/db/comments";
import { upsertImportedPosts, type ImportedPost } from "@/lib/db/imports";
import { saveModel } from "@/lib/db/model";
import { UpstreamError } from "@/lib/http";
import { fetchInstagramSnapshot } from "@/lib/integrations/instagram";
import { fit } from "@/lib/ml/predictor";

// No per-account timezone is available; the target market and demo account are in Romania.
const LOCAL_TIMEZONE = "Europe/Bucharest";

export const PLACEHOLDER_DNA: TBrandDNA = {
  summary: "Import in progress",
  niche: "",
  industry: "",
  valueProposition: "",
  toneOfVoice: ["-"],
  doList: [],
  dontList: [],
  contentPillars: ["-", "--"],
  products: [],
  targetAudience: "",
  colors: ["#7C3AED", "#111827"],
  keywords: [],
};

export function mediaFormat(m: Pick<TIgMedia, "mediaType" | "mediaProductType">): TVariant["format"] {
  if (m.mediaProductType === "REELS") return "reel";
  if (m.mediaType === "CAROUSEL_ALBUM") return "carousel";
  return "post";
}

export const parseHashtags = (caption: string | null) =>
  [...(caption ?? "").matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);

function localHour(timestamp: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: LOCAL_TIMEZONE,
  }).format(new Date(timestamp));
  return Number(hour);
}

export function toImportedPost(media: TIgMedia): ImportedPost {
  const reach = media.insights?.reach ?? 0;
  const interactions =
    (media.likeCount ?? 0) +
    (media.commentsCount ?? 0) +
    (media.insights?.shares ?? 0) +
    (media.insights?.saved ?? 0);
  return {
    media,
    format: mediaFormat(media),
    hashtags: parseHashtags(media.caption),
    postHour: localHour(media.timestamp),
    reach,
    engagementRate: reach > 0 ? Math.min(1, interactions / reach) : 0,
  };
}

const average = (values: number[]) => values.reduce((s, v) => s + v, 0) / (values.length || 1);

export function computeFormatPerformance(measured: ImportedPost[]): TAudienceProfile["formatPerformance"] {
  return (["reel", "carousel", "post", "story"] as const).flatMap((format) => {
    const posts = measured.filter((p) => p.format === format);
    return posts.length
      ? [{ format, posts: posts.length, avgEngagementRate: average(posts.map((p) => p.engagementRate)) }]
      : [];
  });
}

export function computeBestHours(onlineHours: number[] | null, measured: ImportedPost[]): number[] {
  if (onlineHours) {
    return onlineHours
      .map((value, hour) => ({ value, hour }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((h) => h.hour);
  }
  const top = [...measured].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 10);
  const counts = new Map<number, number>();
  for (const p of top) counts.set(p.postHour, (counts.get(p.postHour) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hour]) => hour);
}

export function computePillarPerformance(
  tags: Array<{ mediaId: string; pillar: string }>,
  measured: ImportedPost[],
): TAudienceProfile["pillarPerformance"] {
  const byId = new Map(measured.map((p) => [p.media.id, p.engagementRate]));
  const groups = new Map<string, number[]>();
  for (const { mediaId, pillar } of tags) {
    const er = byId.get(mediaId);
    if (er !== undefined) groups.set(pillar, [...(groups.get(pillar) ?? []), er]);
  }
  return [...groups.entries()].map(([pillar, ers]) => ({
    pillar,
    posts: ers.length,
    avgEngagementRate: average(ers),
  }));
}

// Comments go to the LLM as text only: the snapshot contract carries no usernames.
function buildAudiencePrompt(snapshot: TIgSnapshot, measured: ImportedPost[], bestHours: number[]): string {
  const ranked = [...measured].sort((a, b) => b.engagementRate - a.engagementRate);
  const top = ranked.slice(0, 15);
  const bottom = ranked.slice(15).slice(-10);
  const describe = (p: ImportedPost) => ({
    mediaId: p.media.id,
    format: p.format,
    engagementRate: Number(p.engagementRate.toFixed(4)),
    caption: (p.media.caption ?? "").slice(0, 300),
  });
  return JSON.stringify({
    profile: {
      username: snapshot.profile.username,
      name: snapshot.profile.name,
      biography: snapshot.profile.biography,
      followers: snapshot.profile.followers,
    },
    topPosts: top.map(describe),
    bottomPosts: bottom.map(describe),
    demographics: snapshot.demographics,
    bestHours,
    comments: snapshot.comments.slice(0, 60).map((c) => c.text),
  });
}

async function loadSnapshot(limit: number): Promise<TIgSnapshot> {
  try {
    return IgSnapshot.parse(await fetchInstagramSnapshot({ limit }));
  } catch (err) {
    throw new UpstreamError(`Instagram import failed: ${err instanceof Error ? err.message : err}`);
  }
}

export async function buildBrandFromInstagram(limit: number): Promise<TBrandWithContext> {
  const snapshot = await loadSnapshot(limit);
  const { profile } = snapshot;
  const name = profile.name ?? profile.username;
  // Mock snapshots are never labelled as live data (BLUEPRINT data ethics).
  const source = snapshot.mode === "live" ? "live" : "seeded";

  const existingId = await findBrandIdByIgUser(profile.id);
  const brandId =
    existingId ??
    (await insertInstagramBrand({
      name,
      igUserId: profile.id,
      igUsername: profile.username,
      followers: profile.followers,
      websiteUrl: profile.website && URL.canParse(profile.website) ? profile.website : null,
      dna: PLACEHOLDER_DNA,
    }));

  try {
    const posts = snapshot.media.map(toImportedPost);
    await upsertImportedPosts(brandId, posts, source);
    await upsertComments(brandId, snapshot.comments);

    const measured = posts.filter((p) => p.reach > 0);
    const bestHours = computeBestHours(snapshot.onlineHours, measured);

    const output = await generateJSON({
      system: AUDIENCE_SYSTEM,
      prompt: buildAudiencePrompt(snapshot, measured, bestHours),
      schema: AudienceOutput,
      maxTokens: 8000,
      fixture: "audienceAnalysis",
      usage: { operation: "audienceAnalysis", brandId },
    });

    const totalShare = output.personas.reduce((s, p) => s + p.segmentShare, 0) || 1;
    await replacePersonas(
      brandId,
      output.personas.map((p) => ({ ...p, segmentShare: p.segmentShare / totalShare })),
    );

    const audience: TAudienceProfile = {
      followers: profile.followers,
      demographics: snapshot.demographics,
      bestHours,
      formatPerformance: computeFormatPerformance(measured),
      pillarPerformance: computePillarPerformance(output.pillarTags, measured),
      audienceVoice: output.audienceVoice,
      updatedAt: new Date().toISOString(),
    };
    await updateBrandProfile(brandId, { name, followers: profile.followers, dna: output.dna, audience });

    if (measured.length >= 8) {
      await saveModel(
        brandId,
        fit(
          measured.map((p) => ({
            input: {
              caption: p.media.caption ?? "",
              hashtags: p.hashtags,
              panelScore: null,
              format: p.format,
              postHour: p.postHour,
            },
            engagementRate: p.engagementRate,
          })),
          source,
        ),
      );
    }
  } catch (err) {
    // A failed first import must not leave a brand with placeholder DNA behind.
    if (!existingId) await deleteBrand(brandId);
    throw err;
  }

  const brand = await getBrandWithContext(brandId);
  if (!brand) throw new Error("Brand disappeared after import");
  return brand;
}
