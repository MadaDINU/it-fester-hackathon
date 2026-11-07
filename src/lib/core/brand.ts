import { generateJSON } from "@/lib/ai/client";
import { WEBSITE_SYSTEM, WebsiteOutput } from "@/lib/ai/prompts";
import type { TAnalyzeBrandRequest, TBrandWithContext } from "@/lib/contracts";
import { PLACEHOLDER_DNA } from "@/lib/core/instagramBrand";
import { scrapeWebsite, UnreachableUrlError } from "@/lib/core/scrape";
import { deleteBrand, getBrandWithContext, insertWebsiteBrand, replacePersonas, updateBrandProfile } from "@/lib/db/brands";

const MIN_USEFUL_TEXT = 50;

async function readWebsite(req: TAnalyzeBrandRequest): Promise<string | null> {
  if (!req.url) return null;
  try {
    const text = await scrapeWebsite(req.url);
    if (text.length >= MIN_USEFUL_TEXT) return text;
    throw new UnreachableUrlError("Website has no readable text");
  } catch (err) {
    // With a description we can still build the brand; without one the UI must ask for it.
    if (err instanceof UnreachableUrlError && req.description) return null;
    throw err;
  }
}

export async function analyzeBrandFromWebsite(req: TAnalyzeBrandRequest): Promise<TBrandWithContext> {
  const websiteText = await readWebsite(req);

  // Placeholder brand first so the AI cost is attributed to it (same pattern as instagramBrand).
  const brandId = await insertWebsiteBrand({ name: req.name, websiteUrl: req.url ?? null, dna: PLACEHOLDER_DNA });
  try {
    const output = await generateJSON({
      system: WEBSITE_SYSTEM,
      prompt: JSON.stringify({
        name: req.name,
        url: req.url ?? null,
        description: req.description ?? null,
        websiteText,
      }),
      schema: WebsiteOutput,
      maxTokens: 8000,
      fixture: "brandAnalysis",
      usage: { operation: "brandAnalysis", brandId },
    });

    const totalShare = output.personas.reduce((s, p) => s + p.segmentShare, 0) || 1;
    await replacePersonas(
      brandId,
      output.personas.map((p) => ({
        ...p,
        segmentShare: p.segmentShare / totalShare,
        groundedIn: "website + assumptions",
      })),
    );
    await updateBrandProfile(brandId, { dna: output.dna });
  } catch (err) {
    await deleteBrand(brandId).catch(() => undefined);
    throw err;
  }

  const brand = await getBrandWithContext(brandId);
  if (!brand) throw new Error("Brand disappeared after analysis");
  return brand;
}
