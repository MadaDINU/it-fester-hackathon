import { z } from "zod";
import { runLearning } from "@/lib/core/learn";
import { fail, failFromError, ok } from "@/lib/http";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = z.string().uuid().safeParse(id).success ? await runLearning(id) : null;
    return result ? ok(result) : fail("not_found", "Brand not found", 404);
  } catch (err) {
    return failFromError(err);
  }
}
