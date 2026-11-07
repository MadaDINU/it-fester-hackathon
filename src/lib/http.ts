import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// Body matches the ApiError contract. Status: 400 | 404 | 422 | 502 (upstream AI or Instagram) | 500.
export function fail(code: string, message: string, status = 500) {
  return NextResponse.json({ error: { code, message } }, { status });
}
