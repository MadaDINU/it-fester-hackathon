import { describe, expect, it } from "vitest";
import { computeCostValue } from "./costValue";

const base = {
  aiCostEur: 0.5,
  campaignAiCostEur: 0.4,
  campaigns: 4,
  assumptions: { hourlyRateEur: 20, minutesSavedPerCampaign: 120, priceInputEurPerMTok: 1.74, priceOutputEurPerMTok: 8.7 },
};

describe("computeCostValue", () => {
  it("computes cost, value and ROI", () => {
    const r = computeCostValue(base);
    expect(r.minutesSaved).toBe(480);
    expect(r.valueEur).toBeCloseTo(160);
    expect(r.costPerCampaignEur).toBeCloseTo(0.1);
    expect(r.roiMultiple).toBeCloseTo(320);
  });

  it("changes with assumptions and prices", () => {
    const r = computeCostValue({
      ...base,
      aiCostEur: 1,
      assumptions: { ...base.assumptions, hourlyRateEur: 40, minutesSavedPerCampaign: 60, priceInputEurPerMTok: 3 },
    });
    expect(r.valueEur).toBeCloseTo(160);
    expect(r.roiMultiple).toBeCloseTo(160);
    expect(r.assumptions.priceInputEurPerMTok).toBe(3);
  });

  it("returns zeros without campaigns or cost", () => {
    const r = computeCostValue({ ...base, aiCostEur: 0, campaigns: 0 });
    expect(r.costPerCampaignEur).toBe(0);
    expect(r.roiMultiple).toBe(0);
  });
});
