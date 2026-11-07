import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api-client";
import { mockBrand, mockCampaign } from "@/lib/mock/fixtures";
import { loadBrandWorkspace } from "./brand-data";
afterEach(() => vi.restoreAllMocks());
it("keeps the brand usable if the campaigns backend is unavailable", async () => {
  vi.spyOn(api, "getBrand").mockResolvedValue(mockBrand);
  vi.spyOn(api, "listCampaigns").mockRejectedValue(new Error("Not implemented"));
  expect(await loadBrandWorkspace(mockBrand.id)).toEqual({ brand: mockBrand, campaigns: [], campaignError: "Not implemented" });
});
it("propagates brand failures and returns campaigns when both endpoints work", async () => {
  vi.spyOn(api, "getBrand").mockRejectedValueOnce(new Error("Brand not found")).mockResolvedValue(mockBrand);
  vi.spyOn(api, "listCampaigns").mockResolvedValue([mockCampaign]);
  await expect(loadBrandWorkspace(mockBrand.id)).rejects.toThrow("Brand not found");
  expect((await loadBrandWorkspace(mockBrand.id)).campaigns).toEqual([mockCampaign]);
});
