import { mockIgSnapshot } from "@/lib/ai/fixtures";
import { FromInstagramRequest, IgSnapshot, type TIgSnapshot } from "@/lib/contracts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function fetchInstagramSnapshot({ limit = 50 }: { limit?: number } = {}): Promise<TIgSnapshot> {
  const request = FromInstagramRequest.parse({ limit });
  if ((process.env.IG_DATA_MODE || "mock") !== "mock") {
    // Live endpoint/metric verification is blocked by Meta docs rate limits.
    throw new Error("Live Instagram reads are not enabled: official endpoint/metric validation and live credentials are required");
  }
  let snapshot: TIgSnapshot;
  let cached: string | undefined;
  try { cached = await readFile(join(process.cwd(), "data", "ig-snapshot.json"), "utf8"); }
  catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw new Error("Unable to read cached Instagram snapshot");
  }
  try { snapshot = IgSnapshot.parse(cached === undefined ? mockIgSnapshot : JSON.parse(cached.replace(/^\uFEFF/, ""))); }
  catch { throw new Error("Invalid cached Instagram snapshot"); }
  const media = snapshot.media.slice(0, request.limit);
  const ids = new Set(media.map((m) => m.id));
  return IgSnapshot.parse({
    ...snapshot,
    media,
    comments: snapshot.comments.filter((c) => ids.has(c.mediaId)),
    mode: "mock",
  });
}
