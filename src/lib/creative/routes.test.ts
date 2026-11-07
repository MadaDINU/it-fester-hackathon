import { afterEach, describe, expect, it, vi } from "vitest";
import { mockBrand, mockCampaign } from "@/lib/mock/fixtures";
import sharp from "sharp";

vi.mock("@/lib/db/creatives", () => ({ getCreativeContext: vi.fn(), saveCreative: vi.fn() }));
import { getCreativeContext, saveCreative } from "@/lib/db/creatives";
import { GET } from "@/app/api/creative/[id]/route";
import { POST } from "@/app/api/variants/[id]/render/route";

const params = () => ({ params: Promise.resolve({ id: mockCampaign.variants[0].id }) });
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe("M5 routes", () => {
  it("returns 400 for invalid IDs and 404 for missing variants", async () => {
    expect((await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "bad" }) })).status).toBe(400);
    vi.mocked(getCreativeContext).mockResolvedValue(null);
    expect((await GET(new Request("http://localhost"), params())).status).toBe(404);
  });
  it("renders a real mock JPEG without uploading to Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.mocked(getCreativeContext).mockResolvedValue({ brand: mockBrand, variant: mockCampaign.variants[0] });
    const response = await POST(new Request("http://localhost", { method: "POST", body: "{}" }), params());
    expect(response.status).toBe(200);
    const { imageUrl } = await response.json();
    expect(imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect((await sharp(Buffer.from(imageUrl.split(",")[1], "base64")).metadata()).width).toBe(1080);
    expect(saveCreative).not.toHaveBeenCalled();
  }, 20000);
  it("uploads converted Adobe image bytes in live data mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.mocked(getCreativeContext).mockResolvedValue({ brand: mockBrand, variant: mockCampaign.variants[2] });
    vi.mocked(saveCreative).mockResolvedValue("https://example.com/creative.jpg");
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "white" } }).png().toBuffer();
    const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ imageBase64: png.toString("base64") }) }), params());
    expect(await response.json()).toEqual({ imageUrl: "https://example.com/creative.jpg" });
    expect(saveCreative).toHaveBeenCalledWith(mockCampaign.variants[0].id, expect.any(Buffer));
  });
  it("rejects malformed JSON and unsupported images", async () => {
    expect((await POST(new Request("http://localhost", { method: "POST", body: "broken" }), params())).status).toBe(400);
    vi.mocked(getCreativeContext).mockResolvedValue({ brand: mockBrand, variant: mockCampaign.variants[0] });
    expect((await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ imageBase64: "aGVsbG8=" }) }), params())).status).toBe(422);
  });
});
