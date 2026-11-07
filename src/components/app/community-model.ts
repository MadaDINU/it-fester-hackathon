import type { TCommunity } from "@/lib/contracts";

type Comment = TCommunity["comments"][number];
type Filters = { sentiment: "all" | "positive" | "neutral" | "negative"; query: string; questionsOnly: boolean };

export function filterComments<T extends Pick<Comment, "text" | "sentiment" | "isQuestion">>(comments: T[], filters: Filters): T[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return comments.filter(comment =>
    (filters.sentiment === "all" || comment.sentiment === filters.sentiment) &&
    (!filters.questionsOnly || comment.isQuestion === true) &&
    (!query || comment.text.toLocaleLowerCase().includes(query))
  );
}

export function loyaltyCampaignUrl(brandId: string, idea: { title: string; description: string }) {
  const query = new URLSearchParams({ goal: "loyalty", brief: `${idea.title}\n\n${idea.description}` });
  return `/brands/${encodeURIComponent(brandId)}/campaigns/new?${query}`;
}
