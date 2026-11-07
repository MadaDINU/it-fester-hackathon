import { describe, expect, it } from "vitest";
import { panelFor, rankScores } from "@/lib/core/campaign";
import type { TPersona } from "@/lib/contracts";

const persona = (id: string, segmentShare: number) => ({ id, name: id, segmentShare }) as TPersona;
const reaction = (variantIndex: number, personaId: string, stopScore: number) => ({
  variantIndex,
  personaId,
  stopScore,
  sentiment: "neutral" as const,
  quote: "q",
  objection: null,
});

describe("panelFor", () => {
  it("weights stop scores by segment share", () => {
    const { panel, panelScore } = panelFor(
      0,
      [reaction(0, "a", 8), reaction(0, "b", 4), reaction(1, "a", 1)],
      [persona("a", 0.75), persona("b", 0.25)],
    );
    expect(panel).toHaveLength(2);
    expect(panelScore).toBeCloseTo(70);
  });
});

describe("rankScores", () => {
  it("combines panel and prediction", () => {
    expect(rankScores([90, 10, 50], [0.1, 0.01, 0.05])).toEqual([1, 3, 2]);
  });

  it("gives unique ranks on ties", () => {
    expect([...rankScores([50, 50], [0.1, 0.1])].sort()).toEqual([1, 2]);
  });
});
