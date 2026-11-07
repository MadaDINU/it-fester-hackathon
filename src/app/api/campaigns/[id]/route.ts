import { z } from "zod";
import { getCampaign } from "@/lib/db/campaigns";
import { fail, failFromError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = z.string().uuid().safeParse(id).success ? await getCampaign(id) : null;
    return campaign ? ok(campaign) : fail("not_found", "Campaign not found", 404);
  } catch (err) {
    return failFromError(err);
  }
}
