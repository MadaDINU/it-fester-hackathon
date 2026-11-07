import { z } from "zod";
import { getCreativeContext } from "@/lib/db/creatives";
import { renderCreative } from "@/lib/creative/render";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return fail("VALIDATION", "Invalid variant ID", 400);
  try {
    const context = await getCreativeContext(id);
    if (!context) return fail("NOT_FOUND", "Variant not found", 404);
    return renderCreative(context.brand, context.variant);
  } catch { return fail("CREATIVE_FAILED", "Unable to render creative", 500); }
}
