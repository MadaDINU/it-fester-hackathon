import { listBrands } from "@/lib/db/brands";
import { failFromError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listBrands());
  } catch (err) {
    return failFromError(err);
  }
}
