import { z } from "zod";
import * as C from "@/lib/contracts";
import { mockBrand, mockCampaign, mockCommunity, mockDashboard } from "@/lib/mock/fixtures";

const renderRequest = z.object({ imageBase64: z.string().min(1).optional() });
const renderResponse = z.object({ imageUrl: z.string().url() });
const replyResponse = z.object({ ok: z.literal(true), externalId: z.string() });
const learnResponse = z.object({ learnings: z.array(C.Learning), model: C.ModelState });
const healthResponse = z.object({ ok: z.boolean(), db: z.boolean(), aiProvider: z.string(), publishMode: z.string(), igDataMode: z.string() });
const segment = (id: string) => encodeURIComponent(z.string().min(1).parse(id));
const mockMode = () => process.env.NEXT_PUBLIC_USE_MOCKS === "true";

async function request<S extends z.ZodType>(path: string, schema: S, mock: () => unknown, body?: unknown, useMock = mockMode()): Promise<z.output<S>> {
  if (useMock) return schema.parse(structuredClone(mock()));
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unable to reach the API");
  }
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new Error(`Invalid JSON from API (HTTP ${response.status})`); }
  const apiError = C.ApiError.safeParse(data);
  if (apiError.success) throw new Error(apiError.data.error.message);
  if (!response.ok) throw new Error(`API request failed (HTTP ${response.status})`);
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error(`Invalid API response for ${path}`);
  return parsed.data;
}

function brand(id: string) {
  if (id !== mockBrand.id) throw new Error("Brand not found in mock data");
  return mockBrand;
}
function campaign(id: string) {
  if (id !== mockCampaign.id) throw new Error("Campaign not found in mock data");
  return mockCampaign;
}
function variant(id: string) {
  const result = mockCampaign.variants.find(v => v.id === id);
  if (!result) throw new Error("Variant not found in mock data");
  return result;
}

// Mock calls are isolated demonstrations; they never publish, persist or call AI.
export const api = {
  health: () => request("/health", healthResponse, () => ({ ok: true, db: false, aiProvider: "mock", publishMode: "mock", igDataMode: "mock" })),
  listBrands: () => request("/brands", z.array(C.Brand), () => [mockBrand]),
  getBrand: (id: string) => request(`/brands/${segment(id)}`, C.BrandWithContext, () => brand(id)),
  fromInstagram: (input: z.input<typeof C.FromInstagramRequest> = {}) => {
    const body = C.FromInstagramRequest.parse(input);
    return request("/brands/from-instagram", C.BrandWithContext, () => mockBrand, body);
  },
  analyzeBrand: (input: z.input<typeof C.AnalyzeBrandRequest>) => {
    const body = C.AnalyzeBrandRequest.parse(input);
    return request("/brands/analyze", C.BrandWithContext, () => ({ ...mockBrand, name: body.name, websiteUrl: body.url ?? null, instagram: null }), body);
  },
  learn: (id: string) => request(`/brands/${segment(id)}/learn`, learnResponse, () => ({ learnings: brand(id).learnings, model: mockDashboard.model }), {}),
  getDashboard: (id: string) => request(`/brands/${segment(id)}/dashboard`, C.Dashboard, () => { brand(id); return mockDashboard; }),
  getCommunity: (id: string) => request(`/brands/${segment(id)}/community`, C.Community, () => { brand(id); return mockCommunity; }),
  runCommunity: (id: string) => request(`/brands/${segment(id)}/community`, C.Community, () => { brand(id); return mockCommunity; }, {}),
  listCampaigns: (brandId: string) => request(`/campaigns?brandId=${segment(brandId)}`, z.array(C.Campaign), () => { brand(brandId); return [mockCampaign]; }),
  getCampaign: (id: string) => request(`/campaigns/${segment(id)}`, C.Campaign, () => campaign(id)),
  createCampaign: async (input: z.input<typeof C.CreateCampaignRequest>) => {
    const body = C.CreateCampaignRequest.parse(input);
    return request("/campaigns", C.Campaign, () => {
      brand(body.brandId);
      const candidates = mockCampaign.variants.filter(v => body.formats.includes(v.format));
      const fallback = mockCampaign.variants[2];
      return { ...mockCampaign, ...body, variants: Array.from({ length: body.variantCount }, (_, i) => {
        const format = body.formats[i % body.formats.length];
        const source = candidates.find(v => v.format === format) ?? fallback;
        return { ...source, id: `00000000-0000-4000-8000-${String(100 + i).padStart(12, "0")}`, format, rank: i + 1, reelScript: format === "reel" ? mockCampaign.variants[0].reelScript : null };
      }) };
    }, body);
  },
  // The local renderer also works in mock mode and returns actual image bytes as a data URL.
  renderVariant: (id: string, input: z.input<typeof renderRequest> = {}) => request(`/variants/${segment(id)}/render`, renderResponse, () => null, renderRequest.parse(input), false),
  // This endpoint returns PNG, so it is an image source rather than a JSON fetch.
  creativeUrl: (id: string) => `/api/creative/${segment(id)}`,
  publishVariant: async (id: string, input: z.input<typeof C.PublishRequest>) => {
    const body = C.PublishRequest.parse(input);
    if (body.account === "main" && body.confirmMainAccount !== true) throw new Error("Main account requires explicit confirmation");
    return request(`/variants/${segment(id)}/publish`, C.Publication, () => {
      variant(id);
      return { id: "00000000-0000-4000-8000-000000000050", variantId: id, platform: body.platform, account: body.account, mode: "mock", externalId: "demo-publication", permalink: null, status: "published", error: null, publishedAt: "2026-11-07T09:00:00.000Z" };
    }, body);
  },
  simulatePublication: (id: string) => request(`/publications/${segment(id)}/simulate`, C.Metrics, () => {
    if (id !== "00000000-0000-4000-8000-000000000050") throw new Error("Publication not found in mock data");
    return { id: "00000000-0000-4000-8000-000000000051", publicationId: id, reach: 1000, views: 1200, likes: 40, comments: 5, shares: 5, saves: 10, engagementRate: 0.06, source: "simulated", capturedAt: "2026-11-07T09:30:00.000Z" };
  }, {}),
  replyToComment: (id: string, input: z.input<typeof C.ReplyRequest>) => request(`/comments/${segment(id)}/reply`, replyResponse, () => {
    if (!mockCommunity.comments.some(c => c.id === id)) throw new Error("Comment not found in mock data");
    return { ok: true, externalId: "demo-reply" };
  }, C.ReplyRequest.parse(input)),
};
