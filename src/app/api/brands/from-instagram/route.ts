import { FromInstagramRequest } from "@/lib/contracts";
import { buildBrandFromInstagram } from "@/lib/core/instagramBrand";
import { failFromError, ok } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { limit } = FromInstagramRequest.parse(await request.json().catch(() => ({})));
    return ok(await buildBrandFromInstagram(limit), 201);
  } catch (err) {
    return failFromError(err);
  }
}
