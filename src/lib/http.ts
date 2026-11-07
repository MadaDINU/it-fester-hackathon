import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Marks a failure in an external service (Instagram) so routes answer 502.
export class UpstreamError extends Error {
  name = "UpstreamError";
}

export function failFromError(err: unknown) {
  if (err instanceof ZodError) return fail("invalid_request", err.message, 400);
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (err instanceof Error && (err.name === "AIError" || err.name === "UpstreamError")) {
    return fail("upstream_error", message, 502);
  }
  console.error(err);
  return fail("internal_error", message, 500);
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// Body matches the ApiError contract. Status: 400 | 404 | 422 | 502 (upstream AI or Instagram) | 500.
export function fail(code: string, message: string, status = 500) {
  return NextResponse.json({ error: { code, message } }, { status });
}
