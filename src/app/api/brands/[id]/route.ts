import { z } from "zod";
import { getBrandWithContext } from "@/lib/db/brands";
import { fail, failFromError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const brand = z.string().uuid().safeParse(id).success ? await getBrandWithContext(id) : null;
    return brand ? ok(brand) : fail("not_found", "Brand not found", 404);
  } catch (err) {
    return failFromError(err);
  }
}
