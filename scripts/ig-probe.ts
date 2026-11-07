// Minimal read-only check of the Instagram token: profile plus one post with insights.
// Usage: node --env-file=.env.local --import tsx scripts/ig-probe.ts   (the token is never printed)
import { probeInstagram } from "../src/lib/integrations/instagram";

const mask = (id: string) => (id.length > 6 ? `${id.slice(0, 3)}…${id.slice(-3)}` : "***");

probeInstagram()
  .then((p) => {
    console.log(`host              graph.${p.host}.com`);
    console.log(`IG user id        ${mask(p.userId)}`);
    console.log(`username          @${p.username}`);
    console.log(`followers         ${p.followers}`);
    console.log(`latest post       ${p.latestPost ?? "none"}`);
    console.log(`caption           ${p.hasCaption === null ? "no posts" : p.hasCaption ? "yes" : "NO"}`);
    console.log(`media_product_type ${p.hasMediaProductType === null ? "no posts" : p.hasMediaProductType ? "yes" : "NO"}`);
    console.log(`insights          ${p.insights ? JSON.stringify(p.insights) : "none (null)"}`);
  })
  .catch((err) => {
    console.error(`FAILED: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  });
