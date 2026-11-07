import { FromInstagramRequest } from "@/lib/contracts";
import { buildBrandFromInstagram } from "@/lib/core/instagramBrand";
import { failFromError, ok, parseBody } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { limit } = await parseBody(request, FromInstagramRequest);
    return ok(await buildBrandFromInstagram(limit), 201);
  } catch (err) {
    return failFromError(err);
  }
}
