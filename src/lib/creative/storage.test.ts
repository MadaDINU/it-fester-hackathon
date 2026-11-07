import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(), maybeSingle: vi.fn(), update: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: {
  storage: { from: () => ({ upload: mocks.upload, getPublicUrl: mocks.getPublicUrl }) },
  from: mocks.from,
} }));
import { saveCreative } from "@/lib/db/creatives";
const id = "00000000-0000-4000-8000-000000000030";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.getPublicUrl.mockReturnValue({ data: { publicUrl: "https://example.com/creatives/test.jpg" } });
  mocks.maybeSingle.mockResolvedValue({ data: { id }, error: null });
  mocks.from.mockReturnValue({ update: mocks.update });
  mocks.update.mockReturnValue({ eq: () => ({ select: () => ({ maybeSingle: mocks.maybeSingle }) }) });
});

it("upserts JPEG bytes and persists the public URL only after upload succeeds", async () => {
  const bytes = Buffer.from("test-jpeg");
  expect(await saveCreative(id, bytes)).toBe("https://example.com/creatives/test.jpg");
  expect(mocks.upload).toHaveBeenCalledWith(`${id}.jpg`, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "0" });
  expect(mocks.from).toHaveBeenCalledWith("variants");
  expect(mocks.update).toHaveBeenCalledWith({ image_url: "https://example.com/creatives/test.jpg" });
});

it("does not persist a URL after a failed upload", async () => {
  mocks.upload.mockResolvedValue({ error: { message: "failure" } });
  await expect(saveCreative(id, Buffer.from("test"))).rejects.toThrow("upload failed");
  expect(mocks.update).not.toHaveBeenCalled();
});

it("rejects a missing database update instead of reporting success", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  await expect(saveCreative(id, Buffer.from("test"))).rejects.toThrow("save creative URL");
});
