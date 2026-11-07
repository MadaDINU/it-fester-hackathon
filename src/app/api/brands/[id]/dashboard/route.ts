import { z } from "zod";
import { getDashboard } from "@/lib/core/dashboard";
import { fail, failFromError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = z.string().uuid().safeParse(id).success ? await getDashboard(id) : null;
    return result ? ok(result) : fail("not_found", "Brand not found", 404);
  } catch (err) {
    return failFromError(err);
  }
}
