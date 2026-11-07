import type { TCampaign } from "@/lib/contracts";

// Delivery remains disabled pending explicit approval for the configured destinations.
export async function notifyCampaignReady(campaign: TCampaign): Promise<void> {
  void campaign;
}

export function buildCampaignNotification(campaign: TCampaign, appUrl: string) {
  const winner = [...campaign.variants].sort((a, b) => a.rank - b.rank)[0];
  if (!winner) return null;
  const base = new URL(appUrl);
  if (!["http:", "https:"].includes(base.protocol)) throw new Error("Invalid application URL");
  const studio = new URL(`/campaigns/${encodeURIComponent(campaign.id)}`, base).toString();
  const score = winner.panelScore === null ? "Unavailable" : `${winner.panelScore}/100`;
  const predicted = winner.predictedEngagementRate === null ? "Unavailable" : `${(winner.predictedEngagementRate * 100).toFixed(1)}%`;
  const brief = campaign.brief.slice(0, 3000);
  const caption = winner.caption.slice(0, 1000) || "No caption";
  return {
    discord: { embeds: [{ title: "Campaign ready", description: brief || "Campaign ready", color: 0x7c3aed, fields: [
      { name: "Winning caption", value: caption }, { name: "Format", value: winner.format, inline: true },
      { name: "Panel score", value: score, inline: true }, { name: "Predicted ER", value: predicted, inline: true },
      { name: "Studio", value: studio },
    ] }] },
    slack: { text: `Campaign ready\n${brief}\n\nWinning ${winner.format}: ${caption}\nPanel: ${score} · Predicted ER: ${predicted}\nStudio: ${studio}` },
  };
}
