import { expect, it } from "vitest";
import { mockCampaign } from "@/lib/mock/fixtures";
import { publicationRequest, rankVariants, reelScriptText } from "./campaign-tools";
it("sorts variants without mutating the server response", () => {
  const variants = [...mockCampaign.variants].reverse();
  expect(rankVariants(variants).map(v => v.rank)).toEqual([1, 2, 3, 4]);
  expect(variants[0].rank).toBe(4);
});
it("defaults to the test account and requires explicit main confirmation", () => {
  expect(publicationRequest("instagram")).toEqual({ platform: "instagram", account: "publish" });
  expect(() => publicationRequest("instagram", "main", false)).toThrow();
  expect(publicationRequest("instagram", "main", true).confirmMainAccount).toBe(true);
});
it("copies the complete reel plan including timing and editing notes", () => {
  const text = reelScriptText(mockCampaign.variants[0].reelScript!);
  expect(text).toContain("0-3"); expect(text).toContain("Your morning deserves this moment.");
  expect(text).toContain("Use captions and soft cuts"); expect(text).toContain("TikTok");
});
