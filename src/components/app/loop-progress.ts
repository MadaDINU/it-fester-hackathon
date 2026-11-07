import type { TBrandWithContext, TCampaign, TDashboard } from "@/lib/contracts";
import { copy } from "./copy";

export type Step<K extends string = string> = { key: K; label: string; done: boolean };
export type BrandStepKey = "import" | "audience" | "campaign" | "publish" | "simulate" | "learn";
export type StudioStepKey = "generated" | "creative" | "published" | "simulated" | "learned";

// Index of the first unfinished step; -1 when every step is done.
export const currentStep = (steps: Step[]) => steps.findIndex(step => !step.done);

export const generatedCampaigns = (campaigns: TCampaign[]) => campaigns.filter(c => c.kind === "generated").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const isPublishedCampaign = (c: TCampaign) => c.status === "published" || c.variants.some(v => v.status === "published");

// A later step being done implies the earlier ones are (e.g. publishing renders the creative itself).
function cascade<K extends string>(raw: Step<K>[]): Step<K>[] {
  return raw.map((step, i) => ({ ...step, done: raw.slice(i).some(s => s.done) }));
}

// The brand loop from data the API already returns.
export function brandLoop({ brand, campaigns, dashboard, audienceSeen }: { brand: TBrandWithContext; campaigns: TCampaign[]; dashboard: TDashboard | null; audienceSeen: boolean }): Step<BrandStepKey>[] {
  const generated = generatedCampaigns(campaigns);
  const simulatedDates = (dashboard?.series ?? []).filter(point => point.source === "simulated").map(point => point.date).sort();
  const lastSimulated = simulatedDates.at(-1);
  const raw: Step<BrandStepKey>[] = [
    { key: "import", label: copy.loop.brand.import, done: brand.importedPosts > 0 },
    { key: "audience", label: copy.loop.brand.audience, done: audienceSeen || generated.length > 0 },
    { key: "campaign", label: copy.loop.brand.campaign, done: generated.length > 0 },
    { key: "publish", label: copy.loop.brand.publish, done: generated.some(isPublishedCampaign) },
    { key: "simulate", label: copy.loop.brand.simulate, done: lastSimulated !== undefined },
    { key: "learn", label: copy.loop.brand.learn, done: lastSimulated !== undefined && brand.learnings.some(l => l.createdAt >= lastSimulated) },
  ];
  return cascade(raw);
}

export function studioLoop({ campaign, rendered, published, simulated, learned }: { campaign: TCampaign; rendered: boolean; published: boolean; simulated: boolean; learned: boolean }): Step<StudioStepKey>[] {
  const raw: Step<StudioStepKey>[] = [
    { key: "generated", label: copy.loop.studio.generated, done: campaign.variants.length > 0 },
    { key: "creative", label: copy.loop.studio.creative, done: rendered || campaign.variants.some(v => v.imageUrl !== null) },
    { key: "published", label: copy.loop.studio.published, done: published || isPublishedCampaign(campaign) },
    { key: "simulated", label: copy.loop.studio.simulated, done: simulated },
    { key: "learned", label: copy.loop.studio.learned, done: learned },
  ];
  return cascade(raw);
}

// Per-viewer convenience: the Audience page marks itself as reviewed for this browser.
export const audienceSeenKey = (brandId: string) => `loopwise:audience-seen:${brandId}`;
