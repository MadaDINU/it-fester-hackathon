import { expect, it } from "vitest";
import type { TCommunity } from "@/lib/contracts";
import { filterComments, loyaltyCampaignUrl } from "./community-model";

type SampleComment = Pick<TCommunity["comments"][number], "id" | "text" | "sentiment" | "isQuestion">;
const comments: SampleComment[] = [
  { id: "1", text: "Can I brew this at home?", sentiment: "positive", isQuestion: true },
  { id: "2", text: "The queue is long", sentiment: "negative", isQuestion: false },
  { id: "3", text: "Thank you", sentiment: null, isQuestion: null },
];
it("filters comments by sentiment, case-insensitive text and questions without mutation", () => {
  expect(filterComments(comments, { sentiment: "all", query: "BREW", questionsOnly: true }).map(c => c.id)).toEqual(["1"]);
  expect(filterComments(comments, { sentiment: "negative", query: "", questionsOnly: false }).map(c => c.id)).toEqual(["2"]);
  expect(filterComments(comments, { sentiment: "all", query: "", questionsOnly: false }).map(c => c.id)).toEqual(["1", "2", "3"]);
  expect(comments).toHaveLength(3);
});
it("encodes loyalty title and description into the existing campaign form query", () => {
  const url = new URL(loyaltyCampaignUrl("brand/1", { title: "Q&A", description: "Coffee & friends" }), "https://example.com");
  expect(url.pathname).toBe("/brands/brand%2F1/campaigns/new");
  expect(url.searchParams.get("goal")).toBe("loyalty");
  expect(url.searchParams.get("brief")).toBe("Q&A\n\nCoffee & friends");
});
