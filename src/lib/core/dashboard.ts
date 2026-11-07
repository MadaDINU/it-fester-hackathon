import { Dashboard, type TDashboard } from "@/lib/contracts";
import { getBrandWithContext } from "@/lib/db/brands";
import { countFinishedCampaigns, listDashboardPosts, type DashboardPost } from "@/lib/db/imports";
import { getModel } from "@/lib/db/model";
import { getBrandAiCost } from "@/lib/db/usage";
import { env } from "@/lib/env";
import { computeCostValue } from "./costValue";

const TOP_POSTS = 5;

// Pure aggregation over measured posts (reach > 0 already guaranteed by the query).
export function summarizePosts(posts: DashboardPost[]) {
  const byDate = [...posts].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const totals = {
    posts: posts.length,
    reach: posts.reduce((sum, p) => sum + p.reach, 0),
    avgEngagementRate: posts.length ? posts.reduce((sum, p) => sum + p.engagementRate, 0) / posts.length : 0,
  };
  const series = byDate.map((p) => ({
    date: p.publishedAt,
    actual: p.engagementRate,
    predicted: p.predictedEngagementRate,
    variantId: p.variantId,
    format: p.format,
    source: p.source,
  }));
  const topPosts = [...posts]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, TOP_POSTS)
    .map((p) => ({
      variantId: p.variantId,
      caption: p.caption,
      format: p.format,
      imageUrl: p.imageUrl,
      permalink: p.permalink,
      engagementRate: p.engagementRate,
      source: p.source,
    }));
  return { totals, series, topPosts };
}

export async function getDashboard(brandId: string): Promise<TDashboard | null> {
  const brand = await getBrandWithContext(brandId);
  if (!brand) return null;

  const [posts, model, cost, campaigns] = await Promise.all([
    listDashboardPosts(brandId),
    getModel(brandId),
    getBrandAiCost(brandId),
    countFinishedCampaigns(brandId),
  ]);

  return Dashboard.parse({
    brandId,
    ...summarizePosts(posts),
    model,
    costValue: computeCostValue({
      aiCostEur: cost.totalEur,
      campaignAiCostEur: cost.campaignEur,
      campaigns,
      assumptions: {
        hourlyRateEur: env.VALUE_HOURLY_RATE_EUR,
        minutesSavedPerCampaign: env.VALUE_MINUTES_SAVED_PER_CAMPAIGN,
        priceInputEurPerMTok: env.AI_PRICE_INPUT_EUR_PER_MTOK,
        priceOutputEurPerMTok: env.AI_PRICE_OUTPUT_EUR_PER_MTOK,
      },
    }),
  });
}
