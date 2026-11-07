import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Metrics } from "@/lib/contracts";
vi.mock("@/lib/db/metrics", () => ({ getSimulationContext: vi.fn(), saveSimulatedMetrics: vi.fn() }));
import { getSimulationContext, saveSimulatedMetrics } from "@/lib/db/metrics";
import { POST } from "./route";
const id = "00000000-0000-4000-8000-000000000050";
const params = { params: Promise.resolve({ id }) };
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://example.com"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.mocked(getSimulationContext).mockResolvedValue({ status: "published", features: { caption: "A quick coffee ritual?", hashtags: ["#coffee", "#ritual", "#local"], format: "reel", panelScore: 80, postHour: 18 } });
  vi.mocked(saveSimulatedMetrics).mockImplementation(async input => Metrics.parse({ ...input, id: "00000000-0000-4000-8000-000000000051", source: "simulated", capturedAt: "2026-11-07T08:00:00.000Z" }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
it("uses the actual F4 simulator and returns schema-valid simulated metrics", async () => {
  const response = await POST(new Request("http://localhost", { method: "POST" }), params);
  expect(response.status).toBe(200); const metrics = Metrics.parse(await response.json());
  expect(metrics.source).toBe("simulated"); expect(metrics.publicationId).toBe(id);
  expect(metrics.engagementRate).toBeCloseTo((metrics.likes + metrics.comments + metrics.shares + metrics.saves) / metrics.reach);
  expect(saveSimulatedMetrics).toHaveBeenCalledOnce();
});
it("handles missing or unpublished publications without storing metrics", async () => {
  vi.mocked(getSimulationContext).mockResolvedValueOnce(null).mockResolvedValueOnce({ status: "failed", features: null });
  expect((await POST(new Request("http://localhost"), params)).status).toBe(404);
  expect((await POST(new Request("http://localhost"), params)).status).toBe(409);
  expect(saveSimulatedMetrics).not.toHaveBeenCalled();
});
it("rejects invalid IDs and reports missing database configuration without IO", async () => {
  expect((await POST(new Request("http://localhost"), { params: Promise.resolve({ id: "bad" }) })).status).toBe(400);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  expect((await POST(new Request("http://localhost"), params)).status).toBe(503);
  expect(getSimulationContext).not.toHaveBeenCalled();
});
