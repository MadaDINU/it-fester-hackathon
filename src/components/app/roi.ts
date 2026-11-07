export function calculateRoi(input: { campaigns: number; minutesSavedPerCampaign: number; hourlyRate: number; aiCostPerCampaign: number; planPrice: number }) {
  if (!Object.values(input).every(value => Number.isFinite(value) && value >= 0) || !Number.isInteger(input.campaigns)) throw new Error("Invalid ROI assumptions");
  const hoursSaved = input.campaigns * input.minutesSavedPerCampaign / 60;
  const value = hoursSaved * input.hourlyRate;
  const aiCost = input.campaigns * input.aiCostPerCampaign;
  return { hoursSaved, value, aiCost, netValue: value - input.planPrice, roiMultiple: aiCost > 0 ? value / aiCost : null };
}
