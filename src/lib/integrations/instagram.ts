import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { mockIgSnapshot } from "@/lib/ai/fixtures";
import { FromInstagramRequest, IgSnapshot, type TIgMedia, type TIgSnapshot } from "@/lib/contracts";
import { env } from "@/lib/env";

// Instagram API with Instagram Login (graph.instagram.com). Endpoint, field and metric names
// were checked against developers.facebook.com on 2026-11-07, where the latest version is v27.0.
// This module only reads. Tokens, URLs carrying tokens and comment texts are never logged.

const DEFAULT_VERSION = "v27.0";
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;
const PAGE_SIZE = 50;
const TOP_MEDIA_FOR_COMMENTS = 10;
const COMMENTS_PER_MEDIA = 20;

const PROFILE_FIELDS = "user_id,username,name,biography,website,followers_count,media_count";
const PROFILE_FIELDS_MIN = "user_id,username,name,followers_count,media_count";
const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,permalink,thumbnail_url,timestamp,like_count,comments_count";
// caption and media_product_type are documented for Facebook Login only; retried without them.
const MEDIA_FIELDS_MIN = "id,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count";
const MEDIA_METRICS = "reach,saved,shares,views,total_interactions";

export class InstagramApiError extends Error {
  name = "InstagramApiError";
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
  }
}

type Json = Record<string, unknown>;

function apiBase() {
  return `https://graph.instagram.com/${env.IG_API_VERSION ?? DEFAULT_VERSION}`;
}

// GET with a 10 s timeout and one retry on 429/5xx. The error message never contains the URL.
async function request(url: string): Promise<Json> {
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      if (attempt === 0) continue;
      throw new InstagramApiError(`Instagram request failed: ${err instanceof Error ? err.name : "network error"}`, 0);
    }
    const body = (await response.json().catch(() => ({}))) as Json;
    if (response.ok) return body;
    if (attempt === 0 && (response.status === 429 || response.status >= 500)) continue;
    const error = (body.error ?? {}) as { message?: string; code?: number };
    throw new InstagramApiError(error.message ?? `Instagram API error (HTTP ${response.status})`, response.status, error.code);
  }
}

function get(path: string, params: Record<string, string>, token: string): Promise<Json> {
  const query = new URLSearchParams({ ...params, access_token: token });
  return request(`${apiBase()}/${path}?${query}`);
}

async function getWithFallback(path: string, fields: string, fallback: string, extra: Record<string, string>, token: string) {
  try {
    return { body: await get(path, { fields, ...extra }, token), full: true };
  } catch (err) {
    if (!(err instanceof InstagramApiError) || err.status !== 400) throw err;
    return { body: await get(path, { fields: fallback, ...extra }, token), full: false };
  }
}

async function mapLimit<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await run(items[index]);
      }
    }),
  );
  return results;
}

const int = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const url = (v: unknown): string | null => {
  const s = str(v);
  return s && URL.canParse(s) ? s : null;
};

function metricValue(entry: Json): number | null {
  const values = entry.values as Array<{ value?: unknown }> | undefined;
  return int((entry.total_value as { value?: unknown } | undefined)?.value ?? values?.[0]?.value);
}

// An error or an empty data set means insights are unavailable for this media.
async function fetchInsights(mediaId: string, token: string): Promise<TIgMedia["insights"]> {
  try {
    const body = await get(`${mediaId}/insights`, { metric: MEDIA_METRICS }, token);
    const data = (body.data ?? []) as Json[];
    if (data.length === 0) return null;
    const value = (name: string) => {
      const entry = data.find((d) => d.name === name);
      return entry ? metricValue(entry) : null;
    };
    return {
      reach: value("reach"),
      views: value("views"),
      saved: value("saved"),
      shares: value("shares"),
      totalInteractions: value("total_interactions"),
    };
  } catch {
    return null;
  }
}

async function fetchMedia(userId: string, limit: number, token: string): Promise<TIgMedia[]> {
  const first = await getWithFallback(
    `${userId}/media`,
    MEDIA_FIELDS,
    MEDIA_FIELDS_MIN,
    { limit: String(Math.min(PAGE_SIZE, limit)) },
    token,
  );
  const rows: Json[] = [];
  let page: Json = first.body;
  for (;;) {
    rows.push(...((page.data ?? []) as Json[]));
    const next = (page.paging as { next?: string } | undefined)?.next;
    if (rows.length >= limit || !next || !next.startsWith("https://graph.instagram.com/")) break;
    page = await request(next);
  }

  const media = rows.slice(0, limit).map((m) => {
    const mediaType = m.media_type === "CAROUSEL_ALBUM" || m.media_type === "VIDEO" ? m.media_type : "IMAGE";
    return {
      id: String(m.id),
      caption: str(m.caption),
      mediaType,
      mediaProductType: str(m.media_product_type),
      permalink: url(m.permalink),
      thumbnailUrl: url(m.thumbnail_url),
      timestamp: String(m.timestamp),
      likeCount: int(m.like_count),
      commentsCount: int(m.comments_count),
      insights: null,
    } satisfies TIgMedia;
  });

  const insights = await mapLimit(media, CONCURRENCY, (m) => fetchInsights(m.id, token));
  return media.map((m, i) => ({ ...m, insights: insights[i] }));
}

// Comment text only: usernames are never requested.
async function fetchComments(media: TIgMedia[], token: string): Promise<TIgSnapshot["comments"]> {
  const top = [...media]
    .filter((m) => (m.commentsCount ?? 0) > 0)
    .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    .slice(0, TOP_MEDIA_FOR_COMMENTS);
  const perMedia = await mapLimit(top, CONCURRENCY, async (m) => {
    try {
      const { body } = await getWithFallback(
        `${m.id}/comments`,
        "id,text,timestamp,like_count",
        "id,text,timestamp",
        { limit: String(COMMENTS_PER_MEDIA) },
        token,
      );
      return ((body.data ?? []) as Json[]).slice(0, COMMENTS_PER_MEDIA).flatMap((c) =>
        str(c.text)
          ? [{ id: String(c.id), mediaId: m.id, text: String(c.text), likeCount: int(c.like_count), timestamp: String(c.timestamp) }]
          : [],
      );
    } catch {
      return [];
    }
  });
  return perMedia.flat();
}

type Breakdown = Array<{ dims: string[]; value: number }>;

async function followerBreakdown(userId: string, breakdown: string, token: string): Promise<Breakdown> {
  const body = await get(
    `${userId}/insights`,
    { metric: "follower_demographics", period: "lifetime", metric_type: "total_value", timeframe: "last_30_days", breakdown },
    token,
  );
  const results = (((body.data as Json[] | undefined)?.[0]?.total_value as Json | undefined)?.breakdowns as Json[] | undefined)?.[0]
    ?.results as Array<{ dimension_values?: string[]; value?: number }> | undefined;
  if (!results?.length) throw new Error("no demographics");
  return results.map((r) => ({ dims: r.dimension_values ?? [], value: r.value ?? 0 }));
}

function toShares(rows: Breakdown, name: (dims: string[]) => string) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return rows
    .map((r) => ({ name: name(r.dims), share: r.value / total }))
    .sort((a, b) => b.share - a.share);
}

// Optional: Meta returns no demographics under 100 followers. Any failure gives null.
async function fetchDemographics(userId: string, token: string): Promise<TIgSnapshot["demographics"]> {
  try {
    const [ageGender, cities, countries] = await Promise.all([
      followerBreakdown(userId, "age,gender", token),
      followerBreakdown(userId, "city", token),
      followerBreakdown(userId, "country", token),
    ]);
    return {
      ageGender: toShares(ageGender, ([age, gender]) => `${gender}.${age}`).map((r) => ({ bucket: r.name, share: r.share })),
      topCities: toShares(cities, ([city]) => city).slice(0, 10),
      topCountries: toShares(countries, ([country]) => country).slice(0, 10),
    };
  } catch {
    return null;
  }
}

// online_followers is not in the current metrics table; it is tried and may return null.
async function fetchOnlineHours(userId: string, token: string): Promise<number[] | null> {
  try {
    const body = await get(`${userId}/insights`, { metric: "online_followers", period: "lifetime" }, token);
    const values = ((body.data as Json[] | undefined)?.[0]?.values ?? []) as Array<{ value?: Record<string, number> }>;
    const byHour = values.at(-1)?.value;
    if (!byHour) return null;
    const hours = Array.from({ length: 24 }, (_, h) => Number(byHour[String(h)] ?? 0));
    return hours.some((v) => v > 0) ? hours : null;
  } catch {
    return null;
  }
}

async function fetchLive(limit: number): Promise<TIgSnapshot> {
  const token = env.IG_MAIN_ACCESS_TOKEN;
  if (!token) throw new Error("IG_MAIN_ACCESS_TOKEN is not set");

  const { body: me, full } = await getWithFallback("me", PROFILE_FIELDS, PROFILE_FIELDS_MIN, {}, token);
  const userId = env.IG_MAIN_USER_ID ?? str(me.user_id) ?? str(me.id);
  if (!userId) throw new InstagramApiError("Instagram did not return a user id", 502);

  const media = await fetchMedia(userId, limit, token);
  const [comments, demographics, onlineHours] = await Promise.all([
    fetchComments(media, token),
    fetchDemographics(userId, token),
    fetchOnlineHours(userId, token),
  ]);

  return IgSnapshot.parse({
    profile: {
      id: userId,
      username: String(me.username),
      name: str(me.name),
      biography: full ? str(me.biography) : null,
      website: full ? str(me.website) : null,
      followers: int(me.followers_count) ?? 0,
      mediaCount: int(me.media_count) ?? media.length,
    },
    media,
    comments,
    demographics,
    onlineHours,
    fetchedAt: new Date().toISOString(),
    mode: "live",
  });
}

// Mock mode: the cached snapshot keeps its own mode (a cached live import stays "live").
async function readCached(limit: number): Promise<TIgSnapshot> {
  let cached: string | undefined;
  try {
    cached = await readFile(join(process.cwd(), "data", "ig-snapshot.json"), "utf8");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new Error("Unable to read cached Instagram snapshot");
    }
  }
  let snapshot: TIgSnapshot;
  try {
    snapshot = IgSnapshot.parse(cached === undefined ? mockIgSnapshot : JSON.parse(cached.replace(/^﻿/, "")));
  } catch {
    throw new Error("Invalid cached Instagram snapshot");
  }
  const media = snapshot.media.slice(0, limit);
  const ids = new Set(media.map((m) => m.id));
  return { ...snapshot, media, comments: snapshot.comments.filter((c) => ids.has(c.mediaId)) };
}

export async function fetchInstagramSnapshot({ limit = 50 }: { limit?: number } = {}): Promise<TIgSnapshot> {
  const request = FromInstagramRequest.parse({ limit });
  return env.IG_DATA_MODE === "live" ? fetchLive(request.limit) : readCached(request.limit);
}
