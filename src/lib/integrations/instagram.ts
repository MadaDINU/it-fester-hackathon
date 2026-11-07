import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { mockIgSnapshot } from "@/lib/ai/fixtures";
import { FromInstagramRequest, IgSnapshot, type TIgMedia, type TIgSnapshot } from "@/lib/contracts";
import { env } from "@/lib/env";

// Reads an Instagram professional account through one of two official hosts, both checked
// against developers.facebook.com on 2026-11-07 (latest version v27.0):
// - facebook: graph.facebook.com (Instagram API with Facebook Login / Unified Login). The IG
//   account id comes from /me/accounts?fields=instagram_business_account. caption and
//   media_product_type are available here.
// - instagram: graph.instagram.com (Instagram API with Instagram Login). caption and
//   media_product_type are documented as Facebook Login only, so a 400 retries without them.
// This module only reads. Tokens, URLs carrying tokens and comment texts are never logged.

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;
const PAGE_SIZE = 50;
const TOP_MEDIA_FOR_COMMENTS = 10;
const COMMENTS_PER_MEDIA = 20;

const PROFILE_FIELDS = "username,name,biography,website,followers_count,media_count";
const PROFILE_FIELDS_MIN_IG = "user_id,username,name,followers_count,media_count";
const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,permalink,thumbnail_url,timestamp,like_count,comments_count";
const MEDIA_FIELDS_MIN = "id,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count";
const MEDIA_METRICS = "reach,saved,shares,views,total_interactions";

export type GraphHost = "facebook" | "instagram";

export class InstagramApiError extends Error {
  name = "InstagramApiError";
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
    readonly type?: string,
  ) {
    super(message);
  }
}

type Json = Record<string, unknown>;
type Client = { host: GraphHost; base: string; token: string };

const ORIGIN: Record<GraphHost, string> = {
  facebook: "https://graph.facebook.com",
  instagram: "https://graph.instagram.com",
};

function client(host: GraphHost, token: string): Client {
  return { host, base: `${ORIGIN[host]}/${env.IG_API_VERSION}`, token };
}

export type RequestTrace = { url: string; status: number; code?: number; message?: string };
let trace: ((t: RequestTrace) => void) | null = null;

// Diagnostics for scripts/ig-probe.ts. The access_token parameter is removed before tracing.
export function setRequestTrace(fn: ((t: RequestTrace) => void) | null) {
  trace = fn;
}

function withoutToken(url: string): string {
  const u = new URL(url);
  u.searchParams.delete("access_token");
  return u.toString();
}

// GET with a 10 s timeout and one retry on 429/5xx or a network error. Errors never contain the URL.
async function request(url: string): Promise<Json> {
  const result = await requestOnce(url).catch((err: unknown) => {
    if (err instanceof InstagramApiError) trace?.({ url: withoutToken(url), status: err.status, code: err.code, message: err.message });
    throw err;
  });
  trace?.({ url: withoutToken(url), status: 200 });
  return result;
}

async function requestOnce(url: string): Promise<Json> {
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
    const error = (body.error ?? {}) as { message?: string; code?: number; type?: string };
    throw new InstagramApiError(
      error.message ?? `Instagram API error (HTTP ${response.status})`,
      response.status,
      error.code,
      error.type,
    );
  }
}

function get(c: Client, path: string, params: Record<string, string>): Promise<Json> {
  const query = new URLSearchParams({ ...params, access_token: c.token });
  return request(`${c.base}/${path}?${query}`);
}

async function getWithFallback(c: Client, path: string, fields: string, fallback: string, extra: Record<string, string> = {}) {
  try {
    return { body: await get(c, path, { fields, ...extra }), full: true };
  } catch (err) {
    if (!(err instanceof InstagramApiError) || err.status !== 400 || fields === fallback) throw err;
    return { body: await get(c, path, { fields: fallback, ...extra }), full: false };
  }
}

// Token problems on graph.facebook.com (code 190 or 102, OAuthException) mean "try the other host".
export function isAuthError(err: unknown): boolean {
  return (
    err instanceof InstagramApiError &&
    (err.code === 190 || err.code === 102 || err.type === "OAuthException" || err.status === 401)
  );
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

type Profile = { userId: string; me: Json; full: boolean };

async function facebookProfile(c: Client): Promise<Profile> {
  let userId = env.IG_MAIN_USER_ID ?? null;
  if (!userId) {
    const pages = await get(c, "me/accounts", { fields: "instagram_business_account" });
    const linked = ((pages.data ?? []) as Json[]).find((p) => (p.instagram_business_account as Json | undefined)?.id);
    userId = linked ? String((linked.instagram_business_account as Json).id) : null;
  }
  if (!userId) {
    // A system user token (Unified Login) has no linked Pages, and its /me is the system user,
    // not the Instagram account, so the account id must come from configuration.
    throw new InstagramApiError(
      "No Instagram account found via /me/accounts. Set IG_MAIN_USER_ID to the Instagram professional account id.",
      400,
    );
  }
  const { body, full } = await getWithFallback(c, userId, PROFILE_FIELDS, "username,followers_count,media_count");
  return { userId, me: body, full };
}

async function instagramProfile(c: Client): Promise<Profile> {
  const { body, full } = await getWithFallback(c, "me", `user_id,${PROFILE_FIELDS}`, PROFILE_FIELDS_MIN_IG);
  const userId = env.IG_MAIN_USER_ID ?? str(body.user_id) ?? str(body.id);
  if (!userId) throw new InstagramApiError("Instagram did not return a user id", 502);
  return { userId, me: body, full };
}

// Picks the host. auto tries graph.facebook.com first and falls back on token errors only.
export async function connect(token: string): Promise<{ c: Client; profile: Profile }> {
  if (env.IG_GRAPH_HOST === "instagram") {
    const c = client("instagram", token);
    return { c, profile: await instagramProfile(c) };
  }
  const fb = client("facebook", token);
  try {
    return { c: fb, profile: await facebookProfile(fb) };
  } catch (err) {
    if (env.IG_GRAPH_HOST === "facebook" || !isAuthError(err)) throw err;
  }
  const ig = client("instagram", token);
  return { c: ig, profile: await instagramProfile(ig) };
}

function metricValue(entry: Json): number | null {
  const values = entry.values as Array<{ value?: unknown }> | undefined;
  return int((entry.total_value as { value?: unknown } | undefined)?.value ?? values?.[0]?.value);
}

// An error or an empty data set means insights are unavailable for this media.
async function fetchInsights(c: Client, mediaId: string): Promise<TIgMedia["insights"]> {
  try {
    const body = await get(c, `${mediaId}/insights`, { metric: MEDIA_METRICS });
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

function toMedia(m: Json): TIgMedia {
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
  };
}

async function fetchMedia(c: Client, userId: string, limit: number): Promise<TIgMedia[]> {
  const first = await getWithFallback(c, `${userId}/media`, MEDIA_FIELDS, c.host === "instagram" ? MEDIA_FIELDS_MIN : MEDIA_FIELDS, {
    limit: String(Math.min(PAGE_SIZE, limit)),
  });
  const rows: Json[] = [];
  let page: Json = first.body;
  for (;;) {
    rows.push(...((page.data ?? []) as Json[]));
    const next = (page.paging as { next?: string } | undefined)?.next;
    if (rows.length >= limit || !next || !next.startsWith(`${ORIGIN[c.host]}/`)) break;
    page = await request(next);
  }
  const media = rows.slice(0, limit).map(toMedia);
  const insights = await mapLimit(media, CONCURRENCY, (m) => fetchInsights(c, m.id));
  return media.map((m, i) => ({ ...m, insights: insights[i] }));
}

// Comment text only: usernames are never requested.
async function fetchComments(c: Client, media: TIgMedia[]): Promise<TIgSnapshot["comments"]> {
  const top = [...media]
    .filter((m) => (m.commentsCount ?? 0) > 0)
    .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    .slice(0, TOP_MEDIA_FOR_COMMENTS);
  const perMedia = await mapLimit(top, CONCURRENCY, async (m) => {
    try {
      const { body } = await getWithFallback(c, `${m.id}/comments`, "id,text,timestamp,like_count", "id,text,timestamp", {
        limit: String(COMMENTS_PER_MEDIA),
      });
      return ((body.data ?? []) as Json[]).slice(0, COMMENTS_PER_MEDIA).flatMap((x) =>
        str(x.text)
          ? [{ id: String(x.id), mediaId: m.id, text: String(x.text), likeCount: int(x.like_count), timestamp: String(x.timestamp) }]
          : [],
      );
    } catch {
      return [];
    }
  });
  return perMedia.flat();
}

type Breakdown = Array<{ dims: string[]; value: number }>;

async function followerBreakdown(c: Client, userId: string, breakdown: string): Promise<Breakdown> {
  const body = await get(c, `${userId}/insights`, {
    metric: "follower_demographics",
    period: "lifetime",
    metric_type: "total_value",
    timeframe: "last_30_days",
    breakdown,
  });
  const results = (((body.data as Json[] | undefined)?.[0]?.total_value as Json | undefined)?.breakdowns as Json[] | undefined)?.[0]
    ?.results as Array<{ dimension_values?: string[]; value?: number }> | undefined;
  if (!results?.length) throw new Error("no demographics");
  return results.map((r) => ({ dims: r.dimension_values ?? [], value: r.value ?? 0 }));
}

function toShares(rows: Breakdown, name: (dims: string[]) => string) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return rows.map((r) => ({ name: name(r.dims), share: r.value / total })).sort((a, b) => b.share - a.share);
}

// Optional: Meta returns no demographics under 100 followers. Any failure gives null.
async function fetchDemographics(c: Client, userId: string): Promise<TIgSnapshot["demographics"]> {
  try {
    const [ageGender, cities, countries] = await Promise.all([
      followerBreakdown(c, userId, "age,gender"),
      followerBreakdown(c, userId, "city"),
      followerBreakdown(c, userId, "country"),
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
async function fetchOnlineHours(c: Client, userId: string): Promise<number[] | null> {
  try {
    const body = await get(c, `${userId}/insights`, { metric: "online_followers", period: "lifetime" });
    const values = ((body.data as Json[] | undefined)?.[0]?.values ?? []) as Array<{ value?: Record<string, number> }>;
    const byHour = values.at(-1)?.value;
    if (!byHour) return null;
    const hours = Array.from({ length: 24 }, (_, h) => Number(byHour[String(h)] ?? 0));
    return hours.some((v) => v > 0) ? hours : null;
  } catch {
    return null;
  }
}

function requireToken(): string {
  const token = env.IG_MAIN_ACCESS_TOKEN;
  if (!token) throw new Error("IG_MAIN_ACCESS_TOKEN is not set");
  return token;
}

async function fetchLive(limit: number): Promise<TIgSnapshot> {
  const { c, profile } = await connect(requireToken());
  console.info(`instagram: reading from graph.${c.host}.com`);
  const { userId, me, full } = profile;

  const media = await fetchMedia(c, userId, limit);
  const [comments, demographics, onlineHours] = await Promise.all([
    fetchComments(c, media),
    fetchDemographics(c, userId),
    fetchOnlineHours(c, userId),
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

// Minimal read for scripts/ig-probe.ts: profile plus one media with insights.
export async function probeInstagram() {
  const { c, profile } = await connect(requireToken());
  const page = await getWithFallback(c, `${profile.userId}/media`, MEDIA_FIELDS, c.host === "instagram" ? MEDIA_FIELDS_MIN : MEDIA_FIELDS, {
    limit: "1",
  });
  const first = ((page.body.data ?? []) as Json[])[0];
  const media = first ? toMedia(first) : null;
  return {
    host: c.host,
    userId: profile.userId,
    username: str(profile.me.username),
    followers: int(profile.me.followers_count),
    hasCaption: media ? media.caption !== null : null,
    hasMediaProductType: media ? media.mediaProductType !== null : null,
    latestPost: media?.timestamp ?? null,
    insights: media ? await fetchInsights(c, media.id) : null,
    demographics: await fetchDemographics(c, profile.userId),
  };
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
