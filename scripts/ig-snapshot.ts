// Caches a live Instagram snapshot as the demo fallback (BLUEPRINT 5.6).
// Usage: node --env-file=.env.local --import tsx scripts/ig-snapshot.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { IgSnapshot } from "../src/lib/contracts";
import { fetchInstagramSnapshot } from "../src/lib/integrations/instagram";

async function main() {
  const snapshot = IgSnapshot.parse(await fetchInstagramSnapshot({ limit: 50 }));
  // A mock result must never replace the cached real data.
  if (snapshot.mode !== "live") {
    throw new Error(`Got a "${snapshot.mode}" snapshot; set IG_DATA_MODE=live and use the real M6a client`);
  }
  mkdirSync("data", { recursive: true });
  writeFileSync("data/ig-snapshot.json", JSON.stringify(snapshot, null, 2));
  console.log(
    `Wrote data/ig-snapshot.json: @${snapshot.profile.username}, ${snapshot.media.length} media, ${snapshot.comments.length} comments`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
