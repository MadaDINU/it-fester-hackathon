import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Publication } from "@/lib/contracts";
import { mockBrand, mockCampaign } from "@/lib/mock/fixtures";
vi.mock("@/lib/db/creatives", () => ({ getCreativeContext: vi.fn() }));
vi.mock("@/lib/db/publications", () => ({ savePublication: vi.fn() }));
import { getCreativeContext } from "@/lib/db/creatives";
import { savePublication } from "@/lib/db/publications";
import { POST } from "./route";
const params = () => ({ params: Promise.resolve({ id: mockCampaign.variants[0].id }) });
const request = (body: unknown) => new Request("http://localhost", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.stubEnv("PUBLISH_MODE", "mock"); vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true"); vi.mocked(getCreativeContext).mockResolvedValue({ brand: mockBrand, variant: mockCampaign.variants[0] }); vi.mocked(savePublication).mockImplementation(async p => p); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.resetAllMocks(); });
it("rejects main-account publishing without explicit confirmation before any IO", async () => {
  const response = await POST(request({ platform: "instagram", account: "main" }), params());
  expect(response.status).toBe(400); expect(getCreativeContext).not.toHaveBeenCalled(); expect(savePublication).not.toHaveBeenCalled();
});
it("returns a schema-valid test-account mock publication after 1.5 seconds without network", async () => {
  vi.useFakeTimers(); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  try {
    const result = POST(request({ platform: "instagram" }), params());
    await vi.advanceTimersByTimeAsync(1500);
    const response = await result; expect(response.status).toBe(201);
    const publication = Publication.parse(await response.json());
    expect(publication.account).toBe("publish"); expect(publication.mode).toBe("mock"); expect(publication.externalId?.startsWith("mock_")).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); }
});
it("refuses all live publications even when the main confirmation flag is provided", async () => {
  vi.stubEnv("PUBLISH_MODE", "live");
  expect((await POST(request({ platform: "instagram", account: "main", confirmMainAccount: true }), params())).status).toBe(501);
  expect(getCreativeContext).not.toHaveBeenCalled();
});
it("returns 404 for missing variants and 400 for malformed requests", async () => {
  vi.mocked(getCreativeContext).mockResolvedValue(null);
  expect((await POST(request({ platform: "instagram" }), params())).status).toBe(404);
  expect((await POST(request({}), params())).status).toBe(400);
});
