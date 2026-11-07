import { describe, expect, it } from "vitest";
import type { TCommunity } from "@/lib/contracts";
import {
  computeCommentStats,
  filterComments,
  formatMechanic,
  isFreshCommunity,
  loyaltyCampaignUrl,
} from "./community-model";

type SampleComment = Pick<
  TCommunity["comments"][number],
  "id" | "text" | "sentiment" | "isQuestion" | "replied" | "topic"
>;

const comments: SampleComment[] = [
  {
    id: "1",
    text: "Can I brew this at home?",
    sentiment: "positive",
    isQuestion: true,
    replied: false,
    topic: "Brewing",
  },
  {
    id: "2",
    text: "The queue is long and slow",
    sentiment: "negative",
    isQuestion: false,
    replied: true,
    topic: "Service",
  },
  {
    id: "3",
    text: "Thank you for the wonderful coffee",
    sentiment: "positive",
    isQuestion: false,
    replied: true,
    topic: "Tasting",
  },
  {
    id: "4",
    text: "Where is the branch located?",
    sentiment: "neutral",
    isQuestion: true,
    replied: false,
    topic: "Locations",
  },
];

describe("community-model", () => {
  it("identifies a fresh community when comments are empty and summary is null", () => {
    expect(isFreshCommunity({ comments: [], summary: null })).toBe(true);
    expect(isFreshCommunity({ comments: [{ id: "1" }], summary: null })).toBe(false);
    expect(
      isFreshCommunity({
        comments: [],
        summary: { positiveShare: 1, negativeShare: 0, questionShare: 0, topTopics: [] },
      })
    ).toBe(false);
  });

  it("filters comments by sentiment, case-insensitive text, topic, and questions without mutation", () => {
    expect(
      filterComments(comments, { sentiment: "all", query: "BREW", questionsOnly: true }).map((c) => c.id)
    ).toEqual(["1"]);

    expect(
      filterComments(comments, { sentiment: "negative", query: "", questionsOnly: false }).map((c) => c.id)
    ).toEqual(["2"]);

    expect(
      filterComments(comments, { sentiment: "all", query: "Service", questionsOnly: false }).map((c) => c.id)
    ).toEqual(["2"]);

    expect(
      filterComments(comments, { sentiment: "all", query: "", questionsOnly: true }).map((c) => c.id)
    ).toEqual(["1", "4"]);

    expect(
      filterComments(comments, { sentiment: "all", query: "", questionsOnly: false }).map((c) => c.id)
    ).toEqual(["1", "2", "3", "4"]);

    expect(comments).toHaveLength(4);
  });

  it("filters comments by reply status (pending vs replied)", () => {
    const pending = filterComments(comments, {
      sentiment: "all",
      query: "",
      questionsOnly: false,
      status: "pending",
    });
    expect(pending.map((c) => c.id)).toEqual(["1", "4"]);

    const replied = filterComments(comments, {
      sentiment: "all",
      query: "",
      questionsOnly: false,
      status: "replied",
    });
    expect(replied.map((c) => c.id)).toEqual(["2", "3"]);
  });

  it("encodes loyalty title and description into the existing campaign form query", () => {
    const url = new URL(
      loyaltyCampaignUrl("brand/1", { title: "Q&A Session", description: "Coffee & friends discussion" }),
      "https://example.com"
    );
    expect(url.pathname).toBe("/brands/brand%2F1/campaigns/new");
    expect(url.searchParams.get("goal")).toBe("loyalty");
    expect(url.searchParams.get("brief")).toBe("Q&A Session\n\nCoffee & friends discussion");
  });

  it("formats mechanics into user-friendly labels", () => {
    expect(formatMechanic("challenge_ugc")).toBe("UGC Challenge");
    expect(formatMechanic("qna")).toBe("Community Q&A");
    expect(formatMechanic("series")).toBe("Recurring Series");
    expect(formatMechanic("giveaway")).toBe("Community Giveaway");
    expect(formatMechanic("reply_reel")).toBe("Reply Reel");
    expect(formatMechanic("behind_scenes")).toBe("Behind the Scenes");
    expect(formatMechanic("poll_story")).toBe("Interactive Poll Story");
    expect(formatMechanic("custom_idea")).toBe("Custom Idea");
  });

  it("computes accurate community comment stats", () => {
    const stats = computeCommentStats(comments);
    expect(stats.total).toBe(4);
    expect(stats.pending).toBe(2);
    expect(stats.replied).toBe(2);
    expect(stats.questions).toBe(2);
    expect(stats.positive).toBe(2);
    expect(stats.negative).toBe(1);
    expect(stats.neutral).toBe(1);
    expect(stats.positiveShare).toBe(0.5);
    expect(stats.negativeShare).toBe(0.25);
    expect(stats.questionShare).toBe(0.5);
  });
});
