import { expect, it } from "vitest";
import { mockDashboard } from "@/lib/mock/fixtures";
import { formatAverages, lineSegments, topModelWeights } from "./analytics-data";
it("ranks model weights by absolute contribution without mutating the model", () => {
  expect(topModelWeights({ small: 1, negative: -9, medium: 3, tiny: 0.2 }).map(x => x.name)).toEqual(["negative", "medium", "small"]);
});
it("averages actual observed values per format rather than predictions", () => {
  const averages = formatAverages(mockDashboard.series);
  expect(averages.find(x => x.format === "reel")?.rate).toBeCloseTo(0.058);
  expect(formatAverages([])).toEqual([]);
});
it("does not connect a prediction line across missing samples", () => {
  expect(lineSegments([null, 0.1, 0.2, null, 0.3])).toEqual([[{ index: 1, value: 0.1 }, { index: 2, value: 0.2 }], [{ index: 4, value: 0.3 }]]);
});
