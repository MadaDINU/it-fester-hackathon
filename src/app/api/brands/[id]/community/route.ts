import { z } from "zod";
import { getCommunity, runCommunityAgent } from "@/lib/core/community";
import { fail, failFromError, ok } from "@/lib/http";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

async function handle(params: Ctx["params"], run: (id: string) => ReturnType<typeof getCommunity>) {
  try {
    const { id } = await params;
    const result = z.string().uuid().safeParse(id).success ? await run(id) : null;
    return result ? ok(result) : fail("not_found", "Brand not found", 404);
  } catch (err) {
    return failFromError(err);
  }
}

export async function GET(_request: Request, { params }: Ctx) {
  return handle(params, getCommunity);
}

export async function POST(_request: Request, { params }: Ctx) {
  return handle(params, runCommunityAgent);
}
