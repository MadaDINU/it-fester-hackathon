import { describe, expect, it } from "vitest";
import { mockBrand, mockCampaign, mockCommunity } from "@/lib/mock/fixtures";
import { buildNotifications } from "./notifications";

describe("buildNotifications", () => {
  it("lists a ready campaign, the learnings and the unanswered comments, newest first", () => {
    const list = buildNotifications({ brandId: mockBrand.id, campaigns: [mockCampaign], learnings: mockBrand.learnings, comments: mockCommunity.comments });
    expect(list.map(n => n.id.split(":")[0]).sort()).toEqual(["campaign-ready", "comments", "learning"]);
    expect(list.find(n => n.id.startsWith("campaign-ready"))?.href).toBe(`/campaigns/${mockCampaign.id}`);
  });
  it("invents nothing when there is no data", () => {
    expect(buildNotifications({ brandId: mockBrand.id, campaigns: [], learnings: [], comments: [] })).toEqual([]);
  });
  it("skips published and imported campaigns and answered comments", () => {
    const list = buildNotifications({ brandId: mockBrand.id, campaigns: [{ ...mockCampaign, status: "published" }, { ...mockCampaign, kind: "imported_history" }], learnings: [], comments: mockCommunity.comments.map(c => ({ ...c, replied: true })) });
    expect(list).toEqual([]);
  });
  it("marks a failed campaign as danger", () => {
    expect(buildNotifications({ brandId: mockBrand.id, campaigns: [{ ...mockCampaign, status: "failed" }], learnings: [], comments: [] })[0].tone).toBe("danger");
  });
});
