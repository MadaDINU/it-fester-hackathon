import { api } from "@/lib/api-client";

export async function loadBrandWorkspace(id: string) {
  const [brand, campaigns] = await Promise.allSettled([api.getBrand(id), api.listCampaigns(id)]);
  if (brand.status === "rejected") throw brand.reason;
  return {
    brand: brand.value,
    campaigns: campaigns.status === "fulfilled" ? campaigns.value : [],
    campaignError: campaigns.status === "rejected" ? (campaigns.reason instanceof Error ? campaigns.reason.message : "Campaigns unavailable") : "",
  };
}
