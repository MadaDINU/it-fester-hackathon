import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Route = (url: URL) => { status?: number; body: unknown } | undefined;

function stubFetch(route: Route) {
  const calls: URL[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const url = new URL(input);
      calls.push(url);
      const result = route(url) ?? { status: 400, body: { error: { message: "unexpected", code: 100 } } };
      return new Response(JSON.stringify(result.body), { status: result.status ?? 200 });
    }),
  );
  return calls;
}

async function loadLive(userId = "") {
  vi.resetModules();
  vi.stubEnv("IG_DATA_MODE", "live");
  vi.stubEnv("IG_MAIN_ACCESS_TOKEN", "test-token");
  vi.stubEnv("IG_MAIN_USER_ID", userId);
  vi.stubEnv("IG_API_VERSION", "v27.0");
  return import("@/lib/integrations/instagram");
}

const media = (i: number, extra: Record<string, unknown> = {}) => ({
  id: `m${i}`,
  caption: `post ${i} #tag`,
  media_type: i % 3 === 0 ? "VIDEO" : i % 3 === 1 ? "IMAGE" : "CAROUSEL_ALBUM",
  media_product_type: i % 3 === 0 ? "REELS" : "FEED",
  permalink: `https://www.instagram.com/p/m${i}/`,
  timestamp: `2025-0${(i % 9) + 1}-01T10:00:00+0000`,
  like_count: 10 + i,
  comments_count: 2,
  ...extra,
});

const insightBody = {
  data: [
    { name: "reach", values: [{ value: 500 }] },
    { name: "views", values: [{ value: 800 }] },
    { name: "saved", values: [{ value: 5 }] },
    { name: "shares", values: [{ value: 3 }] },
    { name: "total_interactions", values: [{ value: 40 }] },
  ],
};

function baseRoute(overrides: Route = () => undefined): Route {
  return (url) => {
    const override = overrides(url);
    if (override) return override;
    const path = url.pathname.replace("/v27.0/", "");
    if (path === "me") return { body: { user_id: "123", username: "acct", name: "Acct", followers_count: 134000, media_count: 3 } };
    if (path === "123/media") return { body: { data: [media(0), media(1), media(2)] } };
    if (path.endsWith("/insights") && path.startsWith("m")) return { body: insightBody };
    if (path.endsWith("/comments")) return { body: { data: [{ id: `c-${path}`, text: "nice", timestamp: "2025-01-01T10:00:00+0000", like_count: 1 }] } };
    if (path === "123/insights") return { status: 400, body: { error: { message: "not available", code: 100 } } };
    return undefined;
  };
}

beforeEach(() => vi.unstubAllEnvs());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchInstagramSnapshot live", () => {
  it("maps profile, media, insights and comments, and resolves the user id from /me", async () => {
    const calls = stubFetch(baseRoute());
    const { fetchInstagramSnapshot } = await loadLive();
    const snap = await fetchInstagramSnapshot({ limit: 10 });
    expect(snap.mode).toBe("live");
    expect(snap.profile).toMatchObject({ id: "123", username: "acct", followers: 134000 });
    expect(snap.media.map((m) => m.mediaType)).toEqual(["VIDEO", "IMAGE", "CAROUSEL_ALBUM"]);
    expect(snap.media[0].insights).toEqual({ reach: 500, views: 800, saved: 5, shares: 3, totalInteractions: 40 });
    expect(snap.comments.length).toBe(3);
    expect(JSON.stringify(snap.comments)).not.toContain("username");
    expect(calls.every((u) => !u.searchParams.get("fields")?.includes("username") || u.pathname.endsWith("/me"))).toBe(true);
    expect(snap.demographics).toBeNull();
    expect(snap.onlineHours).toBeNull();
  });

  it("follows pagination up to the limit", async () => {
    stubFetch(
      baseRoute((url) => {
        if (url.pathname === "/v27.0/123/media")
          return { body: { data: [media(1), media(2)], paging: { next: "https://graph.instagram.com/v27.0/page2?after=x" } } };
        if (url.pathname === "/v27.0/page2") return { body: { data: [media(4), media(5), media(7)] } };
      }),
    );
    const { fetchInstagramSnapshot } = await loadLive("123");
    const snap = await fetchInstagramSnapshot({ limit: 10 });
    expect(snap.media.map((m) => m.id)).toEqual(["m1", "m2", "m4", "m5", "m7"]);
  });

  it("sets insights to null when one media fails or has no data", async () => {
    stubFetch(
      baseRoute((url) => {
        if (url.pathname === "/v27.0/m1/insights") return { status: 400, body: { error: { message: "(#10) Not enough viewers", code: 10 } } };
        if (url.pathname === "/v27.0/m2/insights") return { body: { data: [] } };
      }),
    );
    const { fetchInstagramSnapshot } = await loadLive("123");
    const snap = await fetchInstagramSnapshot({ limit: 10 });
    expect(snap.media.map((m) => m.insights === null)).toEqual([false, true, true]);
  });

  it("maps demographics to shares and leaves them null when missing", async () => {
    stubFetch(
      baseRoute((url) => {
        if (url.pathname !== "/v27.0/123/insights" || url.searchParams.get("metric") !== "follower_demographics") return;
        const breakdown = url.searchParams.get("breakdown");
        const results =
          breakdown === "age,gender"
            ? [{ dimension_values: ["25-34", "M"], value: 75 }, { dimension_values: ["18-24", "F"], value: 25 }]
            : [{ dimension_values: [breakdown === "city" ? "Cluj-Napoca, Cluj County" : "RO"], value: 10 }];
        return { body: { data: [{ name: "follower_demographics", total_value: { breakdowns: [{ results }] } }] } };
      }),
    );
    const { fetchInstagramSnapshot } = await loadLive("123");
    const snap = await fetchInstagramSnapshot({ limit: 10 });
    expect(snap.demographics?.ageGender).toEqual([
      { bucket: "M.25-34", share: 0.75 },
      { bucket: "F.18-24", share: 0.25 },
    ]);
    expect(snap.demographics?.topCountries).toEqual([{ name: "RO", share: 1 }]);
  });

  it("falls back to confirmed profile and media fields after a 400", async () => {
    stubFetch(
      baseRoute((url) => {
        const fields = url.searchParams.get("fields") ?? "";
        if (url.pathname === "/v27.0/me" && fields.includes("biography"))
          return { status: 400, body: { error: { message: "Tried accessing nonexisting field", code: 100 } } };
        if (url.pathname === "/v27.0/123/media" && fields.includes("caption"))
          return { status: 400, body: { error: { message: "Tried accessing nonexisting field", code: 100 } } };
        if (url.pathname === "/v27.0/123/media")
          return { body: { data: [{ ...media(0), caption: undefined, media_product_type: undefined }] } };
      }),
    );
    const { fetchInstagramSnapshot } = await loadLive();
    const snap = await fetchInstagramSnapshot({ limit: 10 });
    expect(snap.profile.biography).toBeNull();
    expect(snap.media[0]).toMatchObject({ caption: null, mediaType: "VIDEO", mediaProductType: null });
  });

  it("retries once on 5xx and never puts the token in the error", async () => {
    let meCalls = 0;
    stubFetch(
      baseRoute((url) => {
        if (url.pathname === "/v27.0/me") {
          meCalls++;
          return { status: 500, body: { error: { message: "Service unavailable", code: 2 } } };
        }
      }),
    );
    const { fetchInstagramSnapshot } = await loadLive();
    const err = await fetchInstagramSnapshot({ limit: 10 }).catch((e: Error) => e);
    expect(meCalls).toBe(2);
    expect(String(err)).not.toContain("test-token");
  });
});

describe("fetchInstagramSnapshot mock", () => {
  it("returns the fixture when no cache exists", async () => {
    vi.resetModules();
    vi.stubEnv("IG_DATA_MODE", "mock");
    const { fetchInstagramSnapshot } = await import("@/lib/integrations/instagram");
    const snap = await fetchInstagramSnapshot({ limit: 10 });
    expect(snap.media).toHaveLength(10);
  });
});
