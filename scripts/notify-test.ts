// Sends the campaign-ready notification once for a campaign, to test the Discord/Slack webhooks.
// Usage: node --env-file=.env.local --import tsx scripts/notify-test.ts <campaignId>
import { getCampaign } from "../src/lib/db/campaigns";
import { notifyCampaignReady } from "../src/lib/integrations/notify";

async function main() {
  const id = process.argv[2];
  if (!id) throw new Error("Usage: notify-test.ts <campaignId>");
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error("Campaign not found");
  const targets = ["DISCORD_WEBHOOK_URL", "SLACK_WEBHOOK_URL"].filter((k) => process.env[k]);
  console.log(`Sending for "${campaign.brief}" to: ${targets.join(", ") || "no webhook configured"}`);
  await notifyCampaignReady(campaign); // swallows delivery errors by design
  console.log("Done. Check the channel: delivery errors are not reported by notify.ts.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
