import type { TCommunity } from "@/lib/contracts";

export type CommunityComment = TCommunity["comments"][number];
export type SentimentFilter = "all" | "positive" | "neutral" | "negative";
export type StatusFilter = "all" | "pending" | "replied";

export type CommentFilters = {
  sentiment: SentimentFilter;
  query: string;
  questionsOnly: boolean;
  status?: StatusFilter;
};

export function filterComments<
  T extends Pick<CommunityComment, "text" | "sentiment" | "isQuestion"> & {
    topic?: string | null;
    replied?: boolean;
  },
>(comments: T[], filters: CommentFilters): T[] {
  const query = filters.query.trim().toLowerCase();
  return comments.filter((comment) => {
    if (filters.sentiment !== "all" && comment.sentiment !== filters.sentiment) {
      return false;
    }
    if (filters.questionsOnly && comment.isQuestion !== true) {
      return false;
    }
    if (filters.status === "pending" && comment.replied === true) {
      return false;
    }
    if (filters.status === "replied" && comment.replied !== true) {
      return false;
    }
    if (query) {
      const matchText = comment.text.toLowerCase().includes(query);
      const matchTopic = comment.topic ? comment.topic.toLowerCase().includes(query) : false;
      if (!matchText && !matchTopic) {
        return false;
      }
    }
    return true;
  });
}

export function loyaltyCampaignUrl(brandId: string, idea: { title: string; description: string }) {
  const query = new URLSearchParams({ goal: "loyalty", brief: `${idea.title}\n\n${idea.description}` });
  return `/brands/${encodeURIComponent(brandId)}/campaigns/new?${query.toString()}`;
}

const MECHANIC_LABELS: Record<string, string> = {
  series: "Recurring Series",
  qna: "Community Q&A",
  challenge_ugc: "UGC Challenge",
  giveaway: "Community Giveaway",
  reply_reel: "Reply Reel",
  behind_scenes: "Behind the Scenes",
  poll_story: "Interactive Poll Story",
};

export function formatMechanic(mechanic: string): string {
  return MECHANIC_LABELS[mechanic] ?? mechanic.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function computeCommentStats(
  comments: Pick<CommunityComment, "sentiment" | "isQuestion" | "replied">[]
) {
  const total = comments.length;
  const replied = comments.filter((c) => c.replied).length;
  const pending = total - replied;
  const questions = comments.filter((c) => c.isQuestion === true).length;
  const positive = comments.filter((c) => c.sentiment === "positive").length;
  const negative = comments.filter((c) => c.sentiment === "negative").length;
  const neutral = comments.filter((c) => c.sentiment === "neutral").length;

  return {
    total,
    replied,
    pending,
    questions,
    positive,
    negative,
    neutral,
    positiveShare: total > 0 ? positive / total : 0,
    negativeShare: total > 0 ? negative / total : 0,
    questionShare: total > 0 ? questions / total : 0,
  };
}
