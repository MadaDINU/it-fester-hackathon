import { z } from "zod";
import { CreateCampaignRequest } from "@/lib/contracts";
import { createCampaign } from "@/lib/core/campaign";
import { listCampaigns } from "@/lib/db/campaigns";
import { fail, failFromError, ok } from "@/lib/http";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const brandId = z.string().uuid().parse(new URL(request.url).searchParams.get("brandId"));
    return ok(await listCampaigns(brandId));
  } catch (err) {
    return failFromError(err);
  }
}

export async function POST(request: Request) {
  try {
    const campaign = await createCampaign(CreateCampaignRequest.parse(await request.json()));
    return campaign ? ok(campaign, 201) : fail("not_found", "Brand not found", 404);
  } catch (err) {
    if (err instanceof SyntaxError) return fail("invalid_request", "Body must be JSON", 400);
    return failFromError(err);
  }
}
