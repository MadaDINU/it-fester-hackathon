import { describe, expect, it } from "vitest";
import { mockBrand, mockCampaign, mockDashboard } from "@/lib/mock/fixtures";
import { mockFreshBrand } from "@/lib/mock/fresh-account";
import { brandLoop, currentStep, studioLoop } from "./loop-progress";

describe("brandLoop", () => {
  it("points the demo brand at Publish: imported, campaign generated, nothing published", () => {
    const steps = brandLoop({ brand: mockBrand, campaigns: [mockCampaign], dashboard: mockDashboard, audienceSeen: false });
    expect(steps[currentStep(steps)].key).toBe("publish");
  });
  it("asks a brand with no campaigns to review its audience, then to create a campaign", () => {
    expect(brandLoop({ brand: mockBrand, campaigns: [], dashboard: mockDashboard, audienceSeen: false }).find(s => !s.done)?.key).toBe("audience");
    expect(brandLoop({ brand: mockBrand, campaigns: [], dashboard: mockDashboard, audienceSeen: true }).find(s => !s.done)?.key).toBe("campaign");
  });
  it("needs a learning newer than the last simulation to finish the loop", () => {
    const published = { ...mockCampaign, status: "published" as const };
    const dashboard = { ...mockDashboard, series: [{ ...mockDashboard.series[0], date: "2026-11-08T10:00:00.000Z", source: "simulated" as const }] };
    const before = brandLoop({ brand: mockBrand, campaigns: [published], dashboard, audienceSeen: true });
    expect(before[currentStep(before)].key).toBe("learn");
    const after = brandLoop({ brand: { ...mockBrand, learnings: [{ ...mockBrand.learnings[0], createdAt: "2026-11-08T11:00:00.000Z" }] }, campaigns: [published], dashboard, audienceSeen: true });
    expect(currentStep(after)).toBe(-1);
  });
  it("ignores imported history when counting campaigns", () => {
    const steps = brandLoop({ brand: mockFreshBrand, campaigns: [{ ...mockCampaign, kind: "imported_history" }], dashboard: null, audienceSeen: true });
    expect(steps.find(s => !s.done)?.key).toBe("campaign");
  });
});

describe("studioLoop", () => {
  const base = { campaign: mockCampaign, rendered: false, published: false, simulated: false, learned: false };
  it("starts at Creative for a fresh campaign", () => expect(studioLoop(base)[currentStep(studioLoop(base))].key).toBe("creative"));
  it("treats a publication as implying the creative step", () => {
    const steps = studioLoop({ ...base, published: true });
    expect(steps.map(s => s.done)).toEqual([true, true, true, false, false]);
  });
});
