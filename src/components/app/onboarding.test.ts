import { expect, it } from "vitest";
import { websiteRequest } from "./onboarding";

it("accepts website URLs and a description fallback without inventing a URL", () => {
  expect(websiteRequest(" Cafe ", "https://example.com", "")).toEqual({ name: "Cafe", url: "https://example.com" });
  expect(websiteRequest("Cafe", "", "Neighbourhood coffee shop")).toEqual({ name: "Cafe", description: "Neighbourhood coffee shop" });
});
it("rejects blank names, missing sources and malformed URLs", () => {
  expect(() => websiteRequest(" ", "https://example.com", "")).toThrow();
  expect(() => websiteRequest("Cafe", "", "")).toThrow();
  expect(() => websiteRequest("Cafe", "not a url", "")).toThrow();
});
