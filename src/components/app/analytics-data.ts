import type { TDashboard } from "@/lib/contracts";

export function topModelWeights(weights: Record<string, number>) {
  return Object.entries(weights).map(([name, value]) => ({ name, value })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 3);
}
export function formatAverages(series: TDashboard["series"]) {
  const groups = new Map<string, { total: number; count: number }>();
  for (const row of series) { const group = groups.get(row.format) ?? { total: 0, count: 0 }; group.total += row.actual; group.count++; groups.set(row.format, group); }
  return Array.from(groups, ([format, { total, count }]) => ({ format, count, rate: total / count }));
}
export function lineSegments(values: (number | null)[]) {
  const segments: { index: number; value: number }[][] = []; let current: { index: number; value: number }[] = [];
  values.forEach((value, index) => { if (value === null) { if (current.length) segments.push(current); current = []; } else current.push({ index, value }); });
  if (current.length) segments.push(current);
  return segments;
}
