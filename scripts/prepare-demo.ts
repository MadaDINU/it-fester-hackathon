// Prepares the demo fallback: brand, learnings, one ready campaign and community insights.
// Usage: node --env-file=.env.local --import tsx scripts/prepare-demo.ts
// Idempotent: reruns reuse the brand's learnings and demo campaign, and the community agent
// only classifies new comments. With AI_PROVIDER=anthropic the first run spends tokens.
import { runCommunityAgent } from "../src/lib/core/community";
import { createCampaign } from "../src/lib/core/campaign";
import { buildBrandFromInstagram } from "../src/lib/core/instagramBrand";
import { runLearning } from "../src/lib/core/learn";
import { listCampaigns } from "../src/lib/db/campaigns";
import { env } from "../src/lib/env";

const DEMO_BRIEF = "Grow followers with content our audience asks for in the comments";

async function main() {
  console.log(`AI=${env.AI_PROVIDER} IG=${env.IG_DATA_MODE}`);

  const brand = await buildBrandFromInstagram(50);
  console.log(`brand     ${brand.id}  @${brand.instagram?.username}  ${brand.importedPosts} posts`);

  if (brand.learnings.length === 0) {
    const result = await runLearning(brand.id);
    console.log(`learn     ${result?.learnings.length} learnings, r2=${result?.model.r2}`);
  } else {
    console.log(`learn     skipped, ${brand.learnings.length} learnings exist`);
  }

  const existing = (await listCampaigns(brand.id)).find(
    (c) => c.brief === DEMO_BRIEF && c.status === "ready",
  );
  const campaign =
    existing ??
    (await createCampaign({
      brandId: brand.id,
      goal: "followers",
      platform: "instagram",
      brief: DEMO_BRIEF,
      formats: ["reel", "post"],
      variantCount: 4,
    }));
  if (!campaign) throw new Error("Brand disappeared while creating the campaign");
  console.log(`campaign  ${campaign.id}  ${existing ? "reused" : "created"}`);

  const community = await runCommunityAgent(brand.id);
  console.log(`community ${community?.comments.length} comments, ${community?.loyaltyIdeas.length} loyalty ideas`);

  console.log(`\nbrandId=${brand.id}\ncampaignId=${campaign.id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
