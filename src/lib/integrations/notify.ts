import type { TCampaign } from "@/lib/contracts";

function isValidDiscordWebhook(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return (
      h === "discord.com" ||
      h === "discordapp.com" ||
      h.endsWith(".discord.com") ||
      h.endsWith(".discordapp.com")
    );
  } catch {
    return false;
  }
}

function isValidSlackWebhook(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return h === "hooks.slack.com";
  } catch {
    return false;
  }
}

async function sendWebhook(url: string, body: unknown): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    // errors swallowed
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function notifyCampaignReady(campaign: TCampaign): Promise<void> {
  try {
    const discordUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
    const slackUrl = process.env.SLACK_WEBHOOK_URL?.trim();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.APP_URL?.trim() ||
      "http://localhost:3000";

    const payload = buildCampaignNotification(campaign, appUrl);
    if (!payload) return;

    const tasks: Promise<unknown>[] = [];

    if (discordUrl && isValidDiscordWebhook(discordUrl)) {
      tasks.push(sendWebhook(discordUrl, payload.discord));
    }

    if (slackUrl && isValidSlackWebhook(slackUrl)) {
      tasks.push(sendWebhook(slackUrl, payload.slack));
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  } catch {
    // errors swallowed — notify nu are voie să pice niciodată generarea campaniei
  }
}

export function buildCampaignNotification(campaign: TCampaign, appUrl: string) {
  const winner = [...campaign.variants].sort((a, b) => a.rank - b.rank)[0];
  if (!winner) return null;
  const base = new URL(appUrl);
  if (!["http:", "https:"].includes(base.protocol)) throw new Error("Invalid application URL");
  const studio = new URL(`/campaigns/${encodeURIComponent(campaign.id)}`, base).toString();
  const score = winner.panelScore === null ? "Unavailable" : `${winner.panelScore}/100`;
  const predicted =
    winner.predictedEngagementRate === null
      ? "Unavailable"
      : `${(winner.predictedEngagementRate * 100).toFixed(1)}%`;
  const brief = campaign.brief.slice(0, 3000);
  const caption = winner.caption.slice(0, 1000) || "No caption";
  return {
    discord: {
      embeds: [
        {
          title: "Campaign ready",
          description: brief || "Campaign ready",
          color: 0x7c3aed,
          fields: [
            { name: "Winning caption", value: caption },
            { name: "Format", value: winner.format, inline: true },
            { name: "Panel score", value: score, inline: true },
            { name: "Predicted ER", value: predicted, inline: true },
            { name: "Studio", value: studio },
          ],
        },
      ],
    },
    slack: {
      text: `Campaign ready\n${brief}\n\nWinning ${winner.format}: ${caption}\nPanel: ${score} · Predicted ER: ${predicted}\nStudio: ${studio}`,
    },
  };
}
