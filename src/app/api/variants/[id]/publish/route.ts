import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Publication, PublishRequest } from "@/lib/contracts";
import { getCreativeContext } from "@/lib/db/creatives";
import { savePublication } from "@/lib/db/publications";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return fail("VALIDATION", "Invalid variant ID", 400);
  let body: z.infer<typeof PublishRequest>;
  try { body = PublishRequest.parse(await request.json()); }
  catch { return fail("VALIDATION", "Invalid publication request", 400); }
  if (body.account === "main" && body.confirmMainAccount !== true) return fail("MAIN_CONFIRMATION_REQUIRED", "Main account requires explicit confirmation", 400);
  // Live Meta writes stay disabled until official endpoint verification and Fane's approval.
  if ((process.env.PUBLISH_MODE || "mock") !== "mock") return fail("LIVE_PUBLISH_DISABLED", "Live Instagram publishing is not enabled; Fane's explicit approval and verified integration are required", 501);
  try {
    const context = await getCreativeContext(id);
    if (!context) return fail("NOT_FOUND", "Variant not found", 404);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const publication = Publication.parse({
      id: randomUUID(), variantId: id, platform: body.platform, mode: "mock", account: body.account,
      externalId: `mock_${randomUUID()}`, permalink: null, status: "published", error: null,
      publishedAt: new Date().toISOString(),
    });
    return ok(await savePublication(publication, context.variant.campaignId), 201);
  } catch { return fail("PUBLISH_FAILED", "Unable to save mock publication", 500); }
}
