import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandWithContext, Campaign, Community, Dashboard } from "@/lib/contracts";
import { mockBrand, mockCampaign, mockCommunity, mockDashboard } from "./fixtures";
import { api, ApiClientError } from "../api-client";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("M1 fixtures", () => {
  it("validates the four contracts and keeps related IDs consistent", () => {
    expect(BrandWithContext.parse(mockBrand).audience).not.toBeNull();
    expect(Campaign.parse(mockCampaign).variants.map(v => v.format)).toEqual(["reel", "reel", "post", "post"]);
    expect(Dashboard.parse(mockDashboard).brandId).toBe(mockBrand.id);
    expect(Community.parse(mockCommunity).brandId).toBe(mockBrand.id);
    expect(mockCampaign.variants.every(v => v.campaignId === mockCampaign.id)).toBe(true);
  });
});

describe("API client", () => {
  it("preserves the backend HTTP status and error code for M2's 422 fallback", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "UNREACHABLE", message: "Add a description" } }), { status: 422 })));
    const error = await api.analyzeBrand({ name: "Cafe", url: "https://example.com" }).catch(e => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status: 422, code: "UNREACHABLE", message: "Add a description" });
  });
  it("uses mocks without network and returns isolated copies", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const brands = await api.listBrands(); brands[0].name = "Changed";
    expect((await api.listBrands())[0].name).toBe(mockBrand.name);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(api.getBrand("missing")).rejects.toThrow("not found");
  });
  it("validates successful responses and preserves backend error messages", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([mockBrand])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "UPSTREAM", message: "Try again later" } }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ invalid: true }))));
    expect((await api.listBrands())[0].id).toBe(mockBrand.id);
    await expect(api.listBrands()).rejects.toThrow("Try again later");
    await expect(api.listBrands()).rejects.toThrow("Invalid API response");
  });
  it("rejects invalid requests before network and guards the main account in mock mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(api.createCampaign({ brandId: mockBrand.id, brief: "x", goal: "followers", platform: "instagram" })).rejects.toThrow();
    await expect(api.publishVariant(mockCampaign.variants[0].id, { platform: "instagram", account: "main" })).rejects.toThrow("confirmation");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reports invalid JSON and transport failures without silently switching to mocks", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("not json"))
      .mockRejectedValueOnce(new Error("offline")));
    await expect(api.listBrands()).rejects.toThrow("Invalid JSON");
    await expect(api.listBrands()).rejects.toThrow("offline");
  });
  it("covers mock reads and actions with valid response contracts", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    expect((await api.health()).db).toBe(false);
    expect((await api.fromInstagram()).id).toBe(mockBrand.id);
    expect((await api.analyzeBrand({ name: "Cafe", description: "Local cafe" })).name).toBe("Cafe");
    expect((await api.learn(mockBrand.id)).model.trainedOn).toBe("seeded");
    expect(await api.getDashboard(mockBrand.id)).toEqual(mockDashboard);
    expect(await api.getCommunity(mockBrand.id)).toEqual(mockCommunity);
    expect(await api.runCommunity(mockBrand.id)).toEqual(mockCommunity);
    expect(await api.listCampaigns(mockBrand.id)).toEqual([mockCampaign]);
    expect(await api.getCampaign(mockCampaign.id)).toEqual(mockCampaign);
    const created = await api.createCampaign({ brandId: mockBrand.id, brief: "A new coffee ritual", platform: "instagram", goal: "loyalty", formats: ["reel", "carousel"], variantCount: 5 });
    expect(created.variants).toHaveLength(5);
    expect(created.variants[1].format).toBe("carousel");
    expect(created.variants[0].reelScript).not.toBeNull();
    const variantId = mockCampaign.variants[0].id;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ imageUrl: "data:image/jpeg;base64,/9j/" }))));
    expect((await api.renderVariant(variantId)).imageUrl).toMatch(/^data:image/);
    expect(api.creativeUrl(variantId)).toBe(`/api/creative/${variantId}`);
    const publication = await api.publishVariant(variantId, { platform: "instagram" });
    expect(publication.account).toBe("publish");
    expect(publication.mode).toBe("mock");
    expect((await api.simulatePublication(publication.id)).source).toBe("simulated");
    expect((await api.replyToComment(mockCommunity.comments[0].id, { text: "Thank you!" })).ok).toBe(true);
  });
  it("sends validated defaults to the backend as JSON", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockBrand), { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    await api.fromInstagram();
    expect(fetcher).toHaveBeenCalledWith("/api/brands/from-instagram", expect.objectContaining({ method: "POST", body: JSON.stringify({ limit: 50 }), headers: { Accept: "application/json", "Content-Type": "application/json" } }));
  });
});
