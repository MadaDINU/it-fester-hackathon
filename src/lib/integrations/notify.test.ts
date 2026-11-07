import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mockCampaign } from "@/lib/mock/fixtures";
import { buildCampaignNotification, notifyCampaignReady } from "./notify";

beforeEach(() => { vi.stubEnv("DISCORD_WEBHOOK_URL", ""); vi.stubEnv("SLACK_WEBHOOK_URL", ""); vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://loopwise.example"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("does nothing when no webhook is configured and returns no payload without a winner", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await notifyCampaignReady(mockCampaign);
  expect(buildCampaignNotification({ ...mockCampaign, variants: [] }, "https://loopwise.example")).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});
it("prepares both payloads with the top-ranked variant and Studio link", () => {
  const payload = buildCampaignNotification({ ...mockCampaign, variants: [...mockCampaign.variants].reverse() }, "https://loopwise.example");
  expect(payload!.discord.embeds[0].description).toContain(mockCampaign.brief);
  expect(JSON.stringify(payload)).toContain(mockCampaign.variants[0].caption);
  expect(JSON.stringify(payload)).toContain(`/campaigns/${mockCampaign.id}`);
});
it("never sends notifications while delivery is disabled, even with configured webhooks", async () => {
  vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.example/hook"); vi.stubEnv("SLACK_WEBHOOK_URL", "https://slack.example/hook");
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await expect(notifyCampaignReady(mockCampaign)).resolves.toBeUndefined();
  expect(fetcher).not.toHaveBeenCalled();
});
