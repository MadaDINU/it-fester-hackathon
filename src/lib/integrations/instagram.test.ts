import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mockIgSnapshot } from "@/lib/ai/fixtures";
import { IgSnapshot } from "@/lib/contracts";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));
import { readFile } from "node:fs/promises";
import { fetchInstagramSnapshot } from "./instagram";

beforeEach(() => { vi.stubEnv("IG_DATA_MODE", "mock"); vi.mocked(readFile).mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" })); });
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it("falls back to Fane's fixture, limits media and retains only related comments", async () => {
  const result = await fetchInstagramSnapshot({ limit: 10 });
  expect(IgSnapshot.safeParse(result).success).toBe(true);
  expect(result.media).toHaveLength(10);
  expect(result.comments.every(c => result.media.some(m => m.id === c.mediaId))).toBe(true);
  expect(result.mode).toBe("mock");
});
it("prefers the local snapshot and strips commenter usernames through the contract", async () => {
  const cache = { ...mockIgSnapshot, profile: { ...mockIgSnapshot.profile, name: "Cached account" }, mode: "live", comments: mockIgSnapshot.comments.map(c => ({ ...c, username: "must-not-leave-cache" })) };
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(cache));
  const result = await fetchInstagramSnapshot();
  expect(result.profile.name).toBe("Cached account");
  expect(result.mode).toBe("mock");
  expect(JSON.stringify(result)).not.toContain("must-not-leave-cache");
});
it("does not hide invalid cache data or IO failures with fabricated results", async () => {
  vi.mocked(readFile).mockResolvedValueOnce("{broken");
  await expect(fetchInstagramSnapshot()).rejects.toThrow("Invalid cached Instagram snapshot");
  vi.mocked(readFile).mockRejectedValueOnce(Object.assign(new Error("permission denied"), { code: "EACCES" }));
  await expect(fetchInstagramSnapshot()).rejects.toThrow("Unable to read cached Instagram snapshot");
});
it("returns independent copies and validates request limits", async () => {
  const first = await fetchInstagramSnapshot(); first.profile.username = "changed";
  expect((await fetchInstagramSnapshot()).profile.username).toBe(mockIgSnapshot.profile.username);
  await expect(fetchInstagramSnapshot({ limit: -1 })).rejects.toThrow();
});
it("never silently serves mock data or calls the network when live mode is requested", async () => {
  vi.stubEnv("IG_DATA_MODE", "live"); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  try { await expect(fetchInstagramSnapshot()).rejects.toThrow("Live Instagram reads"); expect(fetcher).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});
