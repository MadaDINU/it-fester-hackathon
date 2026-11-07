import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn(), maybeSingle: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: { from: mocks.from } }));
import { savePublication } from "@/lib/db/publications";
import type { TPublication } from "@/lib/contracts";
const publication: TPublication = { id: "00000000-0000-4000-8000-000000000050", variantId: "00000000-0000-4000-8000-000000000030", platform: "instagram", mode: "mock", account: "publish", externalId: "mock-test", permalink: null, status: "published", error: null, publishedAt: "2026-11-07T08:00:00.000Z" };
const campaignId = "00000000-0000-4000-8000-000000000002";
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });
it("keeps demo publications ephemeral without contacting Supabase", async () => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
  expect(await savePublication(publication, campaignId)).toEqual(publication);
  expect(mocks.from).not.toHaveBeenCalled();
});
it("persists snake-case fields and marks the variant and campaign published", async () => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  mocks.insert.mockResolvedValue({ error: null }); mocks.maybeSingle.mockResolvedValue({ data: { id: campaignId }, error: null });
  mocks.update.mockReturnValue({ eq: () => ({ select: () => ({ maybeSingle: mocks.maybeSingle }) }) });
  mocks.from.mockReturnValue({ insert: mocks.insert, update: mocks.update });
  await savePublication(publication, campaignId);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ variant_id: publication.variantId, external_id: "mock-test", mode: "mock" }));
  expect(mocks.update).toHaveBeenCalledTimes(2);
});
it("stops status updates when saving the publication fails", async () => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false"); mocks.insert.mockResolvedValue({ error: { message: "failure" } });
  mocks.from.mockReturnValue({ insert: mocks.insert, update: mocks.update });
  await expect(savePublication(publication, campaignId)).rejects.toThrow("Unable to save publication");
  expect(mocks.update).not.toHaveBeenCalled();
});
