import { AnalyzeBrandRequest } from "@/lib/contracts";
import { analyzeBrandFromWebsite } from "@/lib/core/brand";
import { UnreachableUrlError } from "@/lib/core/scrape";
import { fail, failFromError, ok, parseBody } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, AnalyzeBrandRequest);
    return ok(await analyzeBrandFromWebsite(body), 201);
  } catch (err) {
    if (err instanceof UnreachableUrlError) {
      return fail("unreachable_url", `${err.message}. Provide a description of the business instead.`, 422);
    }
    return failFromError(err);
  }
}
