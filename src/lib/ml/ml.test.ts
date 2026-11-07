import { describe, expect, it } from "vitest";
import { extractFeatures, FEATURE_NAMES, type FeatureInput } from "@/lib/ml/features";
import { DEFAULT_WEIGHTS, fit, predict } from "@/lib/ml/predictor";
import { dot, fitRidge, r2 } from "@/lib/ml/regression";
import { simulateMetrics } from "@/lib/ml/simulate";

const input: FeatureInput = {
  caption: "Which move? 💪",
  hashtags: ["a", "b", "c"],
  panelScore: 70,
  format: "reel",
  postHour: 19,
};

describe("regression", () => {
  it("recovers known weights", () => {
    const truth = [2, -1, 0.5];
    const X = Array.from({ length: 60 }, (_, i) => [1, Math.sin(i), Math.cos(i * 2)]);
    const y = X.map((x) => dot(x, truth));
    const w = fitRidge(X, y);
    w.forEach((v, i) => expect(v).toBeCloseTo(truth[i], 1));
    expect(r2(y, X.map((x) => dot(x, w)))).toBeGreaterThan(0.9);
  });
});

describe("features", () => {
  it("are deterministic and named", () => {
    expect(extractFeatures(input)).toEqual(extractFeatures(input));
    expect(extractFeatures(input)).toHaveLength(FEATURE_NAMES.length);
    expect(extractFeatures(input)).toEqual([1, 0.7, 14 / 600, 0.3, 1, 1, 0, 1, 0, 1]);
  });
});

describe("predictor", () => {
  it("clamps predictions", () => {
    expect(predict(input, { ...DEFAULT_WEIGHTS, intercept: 50 })).toBe(0.3);
    expect(predict(input, { ...DEFAULT_WEIGHTS, intercept: -50 })).toBe(0.002);
  });

  it("uses default weights below 8 samples", () => {
    const model = fit([{ input, engagementRate: 0.05 }], "seeded");
    expect(model.weights).toEqual(DEFAULT_WEIGHTS);
    expect(model.r2).toBeNull();
  });

  it("learns from simulated history", () => {
    const formats = ["reel", "post", "carousel"] as const;
    const samples = Array.from({ length: 60 }, (_, i) => {
      const v: FeatureInput = {
        caption: i % 2 ? "Short question?" : "Plain statement. ".repeat(12),
        hashtags: Array.from({ length: i % 8 }, () => "x"),
        panelScore: null,
        format: formats[i % 3],
        postHour: i % 4 ? 19 : 8,
      };
      return { input: v, engagementRate: simulateMetrics(v, i).engagementRate };
    });
    const model = fit(samples, "seeded");
    expect(model.samples).toBe(60);
    expect(model.r2).toBeGreaterThan(0.5);
    expect(model.weights.isReel).toBeGreaterThan(0);
  });
});

describe("simulateMetrics", () => {
  it("is deterministic with a seed and stays in range", () => {
    const m = simulateMetrics(input, 42);
    expect(m).toEqual(simulateMetrics(input, 42));
    expect(m.reach).toBeGreaterThanOrEqual(2000);
    expect(m.reach).toBeLessThanOrEqual(20000);
    expect(m.engagementRate).toBeGreaterThan(0);
    expect(m.engagementRate).toBeLessThan(1);
  });
});
