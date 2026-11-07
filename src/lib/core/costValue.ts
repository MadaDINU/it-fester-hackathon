import type { TCostValue } from "@/lib/contracts";

export type CostValueInput = {
  aiCostEur: number; // all AI cost of the brand, imports and learning included
  campaignAiCostEur: number; // cost of ai_usage rows tied to a campaign
  campaigns: number; // generated campaigns that are ready or published
  assumptions: TCostValue["assumptions"];
};

// Pure: our cost is measured from ai_usage, the value comes from explicit assumptions.
export function computeCostValue(input: CostValueInput): TCostValue {
  const { aiCostEur, campaignAiCostEur, campaigns, assumptions } = input;
  const minutesSaved = campaigns * assumptions.minutesSavedPerCampaign;
  const valueEur = (minutesSaved / 60) * assumptions.hourlyRateEur;
  return {
    aiCostEur,
    costPerCampaignEur: campaigns > 0 ? campaignAiCostEur / campaigns : 0,
    campaigns,
    minutesSaved,
    valueEur,
    roiMultiple: aiCostEur > 0 ? valueEur / aiCostEur : 0,
    assumptions,
  };
}
