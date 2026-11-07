import { describe, expect, it } from "vitest";
import type { TCommentInsight } from "@/lib/contracts";
import { summarizeComments } from "@/lib/core/community";

const c = (p: Partial<TCommentInsight>) => ({ sentiment: null, topic: null, isQuestion: null, ...p }) as TCommentInsight;

describe("summarizeComments", () => {
  it("returns null when nothing is processed", () => {
    expect(summarizeComments([])).toBeNull();
    expect(summarizeComments([c({})])).toBeNull();
  });

  it("computes shares over processed comments and ranks topics", () => {
    const s = summarizeComments([
      c({ sentiment: "positive", topic: "Back pain", isQuestion: false }),
      c({ sentiment: "positive", topic: "back pain", isQuestion: false }),
      c({ sentiment: "negative", topic: "price", isQuestion: true }),
      c({ sentiment: "neutral", topic: "plans", isQuestion: true }),
      c({}),
    ]);
    expect(s).toEqual({ positiveShare: 0.5, negativeShare: 0.25, questionShare: 0.5, topTopics: ["back pain", "price", "plans"] });
  });

  it("keeps at most 5 topics", () => {
    const s = summarizeComments(["a", "b", "c", "d", "e", "f"].map((t) => c({ sentiment: "neutral", topic: t })));
    expect(s?.topTopics).toHaveLength(5);
  });
});
