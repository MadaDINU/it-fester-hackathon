import { Community, CommentInsight, type TCommentInsight, type TCommunity, type TIgSnapshot } from "@/lib/contracts";
import { supabaseAdmin } from "@/lib/supabase";

// Omitted columns (sentiment, suggested_reply, replied) keep their values on re-import.
export async function upsertComments(brandId: string, comments: TIgSnapshot["comments"]): Promise<void> {
  if (comments.length === 0) return;
  const { error } = await supabaseAdmin.from("comments").upsert(
    comments.map((c) => ({
      brand_id: brandId,
      external_id: c.id,
      media_external_id: c.mediaId,
      text: c.text,
      like_count: c.likeCount,
      created_at: c.timestamp,
    })),
    { onConflict: "external_id" },
  );
  if (error) throw new Error(error.message);
}

export async function markCommentReplied(id: string, externalReplyId: string): Promise<void> {
  // The reply id is not stored: the schema only tracks whether a comment was answered.
  void externalReplyId;
  const { error } = await supabaseAdmin.from("comments").update({ replied: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

type CommentRow = {
  id: string;
  brand_id: string;
  external_id: string;
  media_external_id: string;
  text: string;
  sentiment: string | null;
  topic: string | null;
  is_question: boolean | null;
  suggested_reply: string | null;
  replied: boolean;
  created_at: string;
};

function toCommentInsight(r: CommentRow): TCommentInsight {
  return CommentInsight.parse({
    id: r.id,
    brandId: r.brand_id,
    externalId: r.external_id,
    mediaExternalId: r.media_external_id,
    text: r.text,
    sentiment: r.sentiment,
    topic: r.topic,
    isQuestion: r.is_question,
    suggestedReply: r.suggested_reply,
    replied: r.replied,
    createdAt: r.created_at,
  });
}

export async function brandExists(brandId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("brands").select("id").eq("id", brandId).maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

// Newest first.
export async function listComments(brandId: string, limit = 50): Promise<TCommentInsight[]> {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data.map(toCommentInsight);
}

// Comments the Community agent has not classified yet (sentiment is null), newest first.
export async function listUnprocessedComments(
  brandId: string,
  limit: number,
): Promise<Array<{ id: string; text: string }>> {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("id, text")
    .eq("brand_id", brandId)
    .is("sentiment", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function saveCommentAnalysis(
  brandId: string,
  items: Array<Pick<TCommentInsight, "id" | "sentiment" | "topic" | "isQuestion" | "suggestedReply">>,
): Promise<void> {
  const results = await Promise.all(
    items.map((c) =>
      supabaseAdmin
        .from("comments")
        .update({
          sentiment: c.sentiment,
          topic: c.topic,
          is_question: c.isQuestion,
          suggested_reply: c.suggestedReply,
        })
        .eq("id", c.id)
        .eq("brand_id", brandId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function insertLoyaltyIdeas(brandId: string, ideas: TCommunity["loyaltyIdeas"]): Promise<void> {
  if (ideas.length === 0) return;
  const { error } = await supabaseAdmin.from("loyalty_ideas").insert(ideas.map((i) => ({ brand_id: brandId, ...i })));
  if (error) throw new Error(error.message);
}

// Latest ideas first.
export async function listLoyaltyIdeas(brandId: string, limit = 3): Promise<TCommunity["loyaltyIdeas"]> {
  const { data, error } = await supabaseAdmin
    .from("loyalty_ideas")
    .select("title, mechanic, description, why")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return Community.shape.loyaltyIdeas.parse(data);
}
