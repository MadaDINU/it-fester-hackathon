import { describe, expect, it } from "vitest";
import { BrandWithContext, Community, Dashboard } from "@/lib/contracts";
import {
  mockFreshBrand,
  mockFreshCommunity,
  mockFreshDashboard,
} from "./fresh-account";

describe("fresh-account fixtures", () => {
  it("validates mockFreshBrand conforms to BrandWithContext schema with 0 media and empty audience stats", () => {
    expect(() => BrandWithContext.parse(mockFreshBrand)).not.toThrow();
    expect(mockFreshBrand.importedPosts).toBe(0);
    expect(mockFreshBrand.audience?.demographics).toBeNull();
    expect(mockFreshBrand.audience?.bestHours).toEqual([]);
    expect(mockFreshBrand.audience?.formatPerformance).toEqual([]);
    expect(mockFreshBrand.audience?.pillarPerformance).toEqual([]);
    expect(mockFreshBrand.audience?.audienceVoice).toBeNull();
  });

  it("validates mockFreshDashboard conforms to Dashboard schema with samples 0 and r2 null", () => {
    expect(() => Dashboard.parse(mockFreshDashboard)).not.toThrow();
    expect(mockFreshDashboard.totals.posts).toBe(0);
    expect(mockFreshDashboard.series).toHaveLength(0);
    expect(mockFreshDashboard.topPosts).toHaveLength(0);
    expect(mockFreshDashboard.model).not.toBeNull();
    expect(mockFreshDashboard.model?.samples).toBe(0);
    expect(mockFreshDashboard.model?.r2).toBeNull();
    expect(Object.keys(mockFreshDashboard.model?.weights ?? {})).toHaveLength(0);
  });

  it("validates mockFreshCommunity conforms to Community schema with 0 comments, null summary, and 3 loyalty ideas", () => {
    expect(() => Community.parse(mockFreshCommunity)).not.toThrow();
    expect(mockFreshCommunity.comments).toHaveLength(0);
    expect(mockFreshCommunity.summary).toBeNull();
    expect(mockFreshCommunity.loyaltyIdeas).toHaveLength(3);
    for (const idea of mockFreshCommunity.loyaltyIdeas) {
      expect(idea.title).toBeTruthy();
      expect(idea.description).toBeTruthy();
      expect(idea.why).toBeTruthy();
    }
  });
});
