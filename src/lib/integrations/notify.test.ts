import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockCampaign } from "@/lib/mock/fixtures";
import { buildCampaignNotification, notifyCampaignReady } from "./notify";

beforeEach(() => {
  vi.stubEnv("DISCORD_WEBHOOK_URL", "");
  vi.stubEnv("SLACK_WEBHOOK_URL", "");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://loopwise.example");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("buildCampaignNotification", () => {
  it("returns null when campaign has no variants", () => {
    expect(
      buildCampaignNotification(
        { ...mockCampaign, variants: [] },
        "https://loopwise.example"
      )
    ).toBeNull();
  });

  it("prepares both payloads with the top-ranked variant and Studio link", () => {
    const payload = buildCampaignNotification(
      { ...mockCampaign, variants: [...mockCampaign.variants].reverse() },
      "https://loopwise.example"
    );
    expect(payload).not.toBeNull();
    expect(payload!.discord.embeds[0].description).toContain(mockCampaign.brief);
    expect(JSON.stringify(payload)).toContain(mockCampaign.variants[0].caption);
    expect(JSON.stringify(payload)).toContain(`/campaigns/${mockCampaign.id}`);
  });
});

describe("notifyCampaignReady", () => {
  it("does nothing when no webhook is configured (fetch is not called)", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    await notifyCampaignReady(mockCampaign);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends a single POST with embed to Discord when DISCORD_WEBHOOK_URL is configured", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/123/xyz");
    const fetcher = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    await notifyCampaignReady(mockCampaign);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/123/xyz",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("Campaign ready"),
      })
    );

    const callBody = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(callBody.embeds).toBeDefined();
    expect(callBody.embeds[0].title).toBe("Campaign ready");
  });

  it("sends a single POST with text to Slack when SLACK_WEBHOOK_URL is configured", async () => {
    vi.stubEnv("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/T00/B00/X00");
    const fetcher = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    await notifyCampaignReady(mockCampaign);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T00/B00/X00",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("Campaign ready"),
      })
    );

    const callBody = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(callBody.text).toContain("Campaign ready");
  });

  it("sends to both Discord and Slack in parallel when both are configured", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discordapp.com/api/webhooks/123/xyz");
    vi.stubEnv("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/T00/B00/X00");
    const fetcher = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    await notifyCampaignReady(mockCampaign);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("swallows errors and does not throw when fetch rejects", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/123/xyz");
    const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", fetcher);

    await expect(notifyCampaignReady(mockCampaign)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("swallows abort/timeout errors and does not throw", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/123/xyz");
    const fetcher = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The user aborted a request.", "AbortError"));
          });
        }
      });
    });
    vi.stubGlobal("fetch", fetcher);

    vi.useFakeTimers();
    const promise = notifyCampaignReady(mockCampaign);
    vi.advanceTimersByTime(5000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it("ignores non-https webhooks or wrong hostnames for Discord and Slack", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    // Non-https
    vi.stubEnv("DISCORD_WEBHOOK_URL", "http://discord.com/api/webhooks/123/xyz");
    vi.stubEnv("SLACK_WEBHOOK_URL", "http://hooks.slack.com/services/T00/B00/X00");
    await notifyCampaignReady(mockCampaign);
    expect(fetcher).not.toHaveBeenCalled();

    // Wrong hosts
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://attacker.com/discord.com");
    vi.stubEnv("SLACK_WEBHOOK_URL", "https://slack.attacker.com/webhook");
    await notifyCampaignReady(mockCampaign);
    expect(fetcher).not.toHaveBeenCalled();

    // Invalid URLs
    vi.stubEnv("DISCORD_WEBHOOK_URL", "not-a-valid-url");
    vi.stubEnv("SLACK_WEBHOOK_URL", "also-not-valid");
    await notifyCampaignReady(mockCampaign);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("swallows errors if appUrl is invalid", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/123/xyz");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "invalid-app-url");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    await expect(notifyCampaignReady(mockCampaign)).resolves.toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
