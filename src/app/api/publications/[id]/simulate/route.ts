import { z } from "zod";
import { getSimulationContext, saveSimulatedMetrics } from "@/lib/db/metrics";
import { simulateMetrics } from "@/lib/ml/simulate";
import { fail, ok } from "@/lib/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return fail("VALIDATION", "Invalid publication ID", 400);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("NOT_CONFIGURED", "Supabase must be configured to store simulated metrics", 503);
  try {
    const context = await getSimulationContext(id);
    if (!context) return fail("NOT_FOUND", "Publication or variant not found", 404);
    if (context.status !== "published") return fail("NOT_PUBLISHED", "Only published publications can be simulated", 409);
    const result = simulateMetrics(context.features);
    return ok(await saveSimulatedMetrics({ publicationId: id, ...result }));
  } catch { return fail("SIMULATION_FAILED", "Unable to simulate or save publication metrics", 500); }
}
