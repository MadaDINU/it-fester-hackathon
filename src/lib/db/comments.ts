import type { TIgSnapshot } from "@/lib/contracts";
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
