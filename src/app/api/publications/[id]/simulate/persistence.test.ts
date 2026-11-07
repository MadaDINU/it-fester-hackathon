import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ insert: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: { from: mocks.from } }));
import { saveSimulatedMetrics } from "@/lib/db/metrics";
afterEach(() => vi.resetAllMocks());
const input = { publicationId: "00000000-0000-4000-8000-000000000050", reach: 1000, views: 1300, likes: 70, comments: 10, shares: 10, saves: 10, engagementRate: 0.1, source: "live" };
it("always persists simulated provenance, even if extra input suggests live data", async () => {
  mocks.from.mockReturnValue({ insert: mocks.insert }); mocks.insert.mockResolvedValue({ error: null });
  const result = await saveSimulatedMetrics(input);
  expect(result.source).toBe("simulated");
  expect(mocks.from).toHaveBeenCalledWith("metrics");
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ publication_id: input.publicationId, engagement_rate: 0.1, source: "simulated" }));
});
it("does not return successful metrics when persistence fails", async () => {
  mocks.from.mockReturnValue({ insert: mocks.insert }); mocks.insert.mockResolvedValue({ error: { message: "failure" } });
  await expect(saveSimulatedMetrics(input)).rejects.toThrow("Unable to save simulated metrics");
});
