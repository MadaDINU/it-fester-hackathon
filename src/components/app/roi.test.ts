import { expect, it } from "vitest";
import { calculateRoi } from "./roi";
it("converts saved minutes into hours and value, and subtracts the plan once", () => {
  const result = calculateRoi({ campaigns: 10, minutesSavedPerCampaign: 115, hourlyRate: 20, aiCostPerCampaign: 0.025, planPrice: 19 });
  expect(result.hoursSaved).toBeCloseTo(1150 / 60);
  expect(result.value).toBeCloseTo(1150 / 60 * 20);
  expect(result.aiCost).toBeCloseTo(0.25);
  expect(result.netValue).toBeCloseTo(result.value - 19);
});
it("does not show infinite ROI for free AI calls or zero campaigns", () => {
  expect(calculateRoi({ campaigns: 0, minutesSavedPerCampaign: 120, hourlyRate: 20, aiCostPerCampaign: 0, planPrice: 19 }).roiMultiple).toBeNull();
});
it("rejects negative, non-finite and fractional campaign assumptions", () => {
  const input = { campaigns: 1, minutesSavedPerCampaign: 120, hourlyRate: 20, aiCostPerCampaign: 0.025, planPrice: 19 };
  expect(() => calculateRoi({ ...input, hourlyRate: -1 })).toThrow();
  expect(() => calculateRoi({ ...input, campaigns: 1.5 })).toThrow();
  expect(() => calculateRoi({ ...input, aiCostPerCampaign: Infinity })).toThrow();
});
