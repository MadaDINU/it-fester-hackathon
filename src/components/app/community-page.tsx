"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { TCommunity } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { mockCommunity } from "@/lib/mock/fixtures";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { NewCampaignButton } from "@/components/app/brand-sidebar";
import {
  computeCommentStats,
  filterComments,
  formatMechanic,
  isFreshCommunity,
  loyaltyCampaignUrl,
  type CommentFilters,
  type CommunityComment,
  type SentimentFilter,
  type StatusFilter,
} from "@/components/app/community-model";

const isMock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<TCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Filter state
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<SentimentFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [questionsOnly, setQuestionsOnly] = useState(false);

  // Reply drafts per comment ID
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Human approval modal state
  const [approvingComment, setApprovingComment] = useState<CommunityComment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setIsFallbackMode(false);
    try {
      const data = await api.getCommunity(id);
      setCommunity(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to load community data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function loadDemoData() {
    setCommunity(mockCommunity);
    setIsFallbackMode(true);
    setError("");
    setNotice("Loaded demo community data. Safe simulation mode is active.");
  }

  async function runAgent() {
    setBusy("agent");
    setError("");
    setNotice("");
    try {
      const data = await api.runCommunity(id);
      setCommunity(data);
      setNotice(
        isMock || isFallbackMode
          ? "Demo insights updated. AI classified comments and generated loyalty ideas safely."
          : "Community agent completed. Classified comments and fresh loyalty ideas are ready."
      );
    } catch (e) {
      if (isFallbackMode || isMock) {
        setCommunity(mockCommunity);
        setNotice("Simulation updated with sample community ideas.");
      } else {
        setError(e instanceof Error ? e.message : "Unable to run Community agent");
      }
    } finally {
      setBusy(null);
    }
  }

  function handleOpenApproval(comment: CommunityComment) {
    setError("");
    setNotice("");
    setApprovingComment(comment);
  }

  async function handleConfirmReply() {
    if (!approvingComment) return;
    const commentId = approvingComment.id;
    const draftText = (drafts[commentId] ?? approvingComment.suggestedReply ?? "").trim();

    if (!draftText || draftText.length > 500) {
      setError("Reply text must be between 1 and 500 characters.");
      setApprovingComment(null);
      return;
    }

    setBusy(commentId);
    setError("");
    setNotice("");

    try {
      await api.replyToComment(commentId, { text: draftText });
      setCommunity((current) =>
        current
          ? {
              ...current,
              comments: current.comments.map((c) =>
                c.id === commentId ? { ...c, replied: true, suggestedReply: draftText } : c
              ),
            }
          : current
      );
      setNotice(
        isMock || isFallbackMode
          ? "Human approval confirmed: mock reply simulated and marked as replied."
          : "Human approval confirmed: reply published successfully to Instagram."
      );
    } catch (e) {
      if (isFallbackMode || isMock) {
        // Fallback simulation in UI if the mock ID wasn't in mockCommunity
        setCommunity((current) =>
          current
            ? {
                ...current,
                comments: current.comments.map((c) =>
                  c.id === commentId ? { ...c, replied: true, suggestedReply: draftText } : c
                ),
              }
            : current
        );
        setNotice("Simulation note: reply approved and marked as replied locally.");
      } else {
        setError(e instanceof Error ? e.message : "Unable to publish reply to Instagram");
      }
    } finally {
      setBusy(null);
      setApprovingComment(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setSentiment("all");
    setStatus("all");
    setQuestionsOnly(false);
  }

  const filters: CommentFilters = { sentiment, query, questionsOnly, status };
  const allComments = community?.comments ?? [];
  const filteredComments = filterComments(allComments, filters);
  const stats = computeCommentStats(allComments);
  const hasActiveFilters = Boolean(
    query || sentiment !== "all" || status !== "all" || questionsOnly
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Community & Loyalty"
        description="Read what your audience says, reply with AI suggestions and turn feedback into loyalty campaigns."
        action={<>
          <NewCampaignButton brandId={id} primary={false} />
          <Button
            className="min-h-11 gap-2"
            disabled={busy !== null || loading}
            onClick={() => void runAgent()}
          >
            {busy === "agent" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Running agent…
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden="true" />
                Run Community agent
              </>
            )}
          </Button></>
        }
      />

      {isFallbackMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Backend Endpoint Standby</p>
          <p className="mt-1 text-xs text-amber-800">
            Displaying sample community data and mock reply simulation because the live backend is offline.
          </p>
        </div>
      )}

      {error && !community && (
        <div className="space-y-4">
          <ErrorState message={error} onRetry={() => void load()} />
          <div className="flex items-center gap-3">
            <Button onClick={loadDemoData} className="min-h-11">
              Load sample community data
            </Button>
          </div>
        </div>
      )}

      {error && community && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertCircle className="size-5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium">Action failed</p>
            <p className="mt-0.5 text-xs text-red-800">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-xs font-semibold text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="flex-1 text-emerald-900">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading community conversations and sentiment…" />
      ) : community ? (
        <div className="space-y-10">
          {isFreshCommunity(community) ? (
            <EmptyState title="No comments yet" description="When people start commenting on your posts, sentiment, questions and AI reply drafts appear here. Until then, use a loyalty idea below to start the conversation." />
          ) : (
          <>
          {/* Section 1: Community Pulse & Sentiment Summary */}
          <section aria-labelledby="community-summary">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="community-summary" className="text-xl font-semibold tracking-tight">
                  Community pulse
                </h2>
                <p className="text-sm text-slate-600">
                  Aggregated sentiment, topics, and question volume from audience comments.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {stats.total} total · {stats.pending} pending · {stats.replied} replied
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border border-slate-200 shadow-none ring-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">Positive sentiment</p>
                    <span className="inline-flex size-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-emerald-700">
                    {(
                      (community.summary?.positiveShare ?? stats.positiveShare) * 100
                    ).toFixed(0)}
                    %
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stats.positive} of {stats.total} comments
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-none ring-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">Negative sentiment</p>
                    <span className="inline-flex size-2 rounded-full bg-rose-500" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-rose-700">
                    {(
                      (community.summary?.negativeShare ?? stats.negativeShare) * 100
                    ).toFixed(0)}
                    %
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stats.negative} of {stats.total} comments
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-none ring-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">Questions share</p>
                    <span className="inline-flex size-2 rounded-full bg-violet-500" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-violet-700">
                    {(
                      (community.summary?.questionShare ?? stats.questionShare) * 100
                    ).toFixed(0)}
                    %
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stats.questions} questions asked
                  </p>
                </CardContent>
              </Card>
            </div>

            {community.summary?.topTopics && community.summary.topTopics.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Top topics:</span>
                {community.summary.topTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setQuery(topic)}
                    className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 transition hover:bg-violet-100"
                    title={`Filter by topic: ${topic}`}
                  >
                    #{topic}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Comments List, Classification & Reply Approval */}
          <section aria-labelledby="comments-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="comments-title" className="text-xl font-semibold tracking-tight">
                  Comments & AI replies
                </h2>
                <p className="text-sm text-slate-600">
                  Review classified comments and approve suggested replies before sending.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Showing {filteredComments.length} of {allComments.length} comments
              </span>
            </div>

            {/* Filter Toolbar */}
            <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-xs font-medium text-slate-700">
                Search text or topic
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Filter comments…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Sentiment
                <select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value as SentimentFilter)}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                >
                  <option value="all">All sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                >
                  <option value="all">All comments</option>
                  <option value="pending">Pending reply</option>
                  <option value="replied">Replied</option>
                </select>
              </label>

              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={questionsOnly}
                  onChange={(e) => setQuestionsOnly(e.target.checked)}
                  className="size-4 rounded text-violet-600 focus:ring-violet-500"
                />
                Questions only
              </label>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="min-h-10 text-xs text-slate-600">
                  <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Comment Cards */}
            {filteredComments.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? "No comments match your filters" : "No comments found"}
                description={
                  hasActiveFilters
                    ? "Try adjusting search terms or resetting filters to see other audience comments."
                    : "No comments have been imported yet. Run the Community agent when real data is available."
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={resetFilters}>
                      Clear all filters
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => void runAgent()} disabled={busy !== null}>
                      Run Community agent
                    </Button>
                  )
                }
              />
            ) : (
              <div className="space-y-5">
                {filteredComments.map((comment) => {
                  const draft = drafts[comment.id] ?? comment.suggestedReply ?? "";
                  const isModified = Boolean(
                    comment.suggestedReply && draft !== comment.suggestedReply
                  );

                  return (
                    <Card key={comment.id} className="border border-slate-200 bg-white shadow-none ring-0">
                      <CardContent className="space-y-4 p-5">
                        {/* Header: Badges & Sentiment */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Sentiment badge */}
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                comment.sentiment === "positive"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : comment.sentiment === "negative"
                                  ? "border-rose-200 bg-rose-50 text-rose-800"
                                  : comment.sentiment === "neutral"
                                  ? "border-slate-200 bg-slate-100 text-slate-800"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {comment.sentiment
                                ? comment.sentiment.charAt(0).toUpperCase() + comment.sentiment.slice(1)
                                : "Unclassified"}
                            </span>

                            {/* Topic badge */}
                            {comment.topic && (
                              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                                {comment.topic}
                              </span>
                            )}

                            {/* Question flag */}
                            {comment.isQuestion && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                                <HelpCircle className="size-3" aria-hidden="true" />
                                Question
                              </span>
                            )}
                          </div>

                          {/* Replied status indicator */}
                          {comment.replied ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <Check className="size-3" aria-hidden="true" />
                              Replied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <MessageSquare className="size-3" aria-hidden="true" />
                              Pending review
                            </span>
                          )}
                        </div>

                        {/* Comment text */}
                        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                            &ldquo;{comment.text}&rdquo;
                          </p>
                        </div>

                        {/* Reply Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <label htmlFor={`reply-${comment.id}`} className="font-medium text-slate-700">
                              {comment.replied ? "Sent reply" : "Suggested reply (editable)"}
                            </label>
                            {!comment.replied && (
                              <span
                                className={`font-mono text-xs ${
                                  draft.length > 500 ? "font-bold text-red-600" : "text-slate-500"
                                }`}
                              >
                                {draft.length}/500
                              </span>
                            )}
                          </div>

                          <Textarea
                            id={`reply-${comment.id}`}
                            rows={3}
                            maxLength={500}
                            value={draft}
                            onChange={(e) =>
                              setDrafts((current) => ({ ...current, [comment.id]: e.target.value }))
                            }
                            disabled={comment.replied || busy !== null}
                            placeholder="Type a thoughtful, on-brand response…"
                            className="text-sm"
                          />

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              {comment.replied ? (
                                <p className="text-xs text-slate-500">
                                  This comment has been marked as answered.
                                </p>
                              ) : (
                                <Button
                                  className="min-h-10 gap-2"
                                  disabled={
                                    busy !== null ||
                                    !draft.trim() ||
                                    draft.length > 500
                                  }
                                  onClick={() => handleOpenApproval(comment)}
                                >
                                  {busy === comment.id ? (
                                    <>
                                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                      Sending…
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="size-4" aria-hidden="true" />
                                      Approve & Send reply
                                    </>
                                  )}
                                </Button>
                              )}

                              {!comment.replied && isModified && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [comment.id]: comment.suggestedReply ?? "",
                                    }))
                                  }
                                  className="text-xs text-slate-600"
                                >
                                  <RotateCcw className="mr-1 size-3" aria-hidden="true" />
                                  Reset to AI suggestion
                                </Button>
                              )}
                            </div>

                            {!comment.replied && (
                              <p className="text-xs text-slate-500">
                                Human review required before publishing
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
          </>
          )}

          {/* Section 3: Loyalty & Community Ideas */}
          <section aria-labelledby="loyalty-title">
            <div className="mb-4">
              <h2 id="loyalty-title" className="text-xl font-semibold tracking-tight">
                Loyalty ideas
              </h2>
              <p className="text-sm text-slate-600">
                AI suggestions derived from recurring themes and questions, designed to deepen audience engagement.
              </p>
            </div>

            {community.loyaltyIdeas.length === 0 ? (
              <EmptyState
                title="No loyalty ideas generated"
                description="Run the Community agent to synthesize audience questions into tailored loyalty campaigns."
                action={
                  <Button variant="outline" onClick={() => void runAgent()} disabled={busy !== null}>
                    Generate ideas
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {community.loyaltyIdeas.map((idea, index) => (
                  <Card key={index} className="flex flex-col justify-between border border-slate-200 bg-white shadow-none ring-0">
                    <CardHeader className="p-5 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-slate-900">
                          {idea.title}
                        </CardTitle>
                        <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                          {formatMechanic(idea.mechanic)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5 pt-2">
                      <p className="text-sm text-slate-700">{idea.description}</p>
                      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                        <strong className="text-slate-800">Why this works:</strong> {idea.why}
                      </div>
                      <Button
                        variant="outline"
                        className="min-h-11 w-full gap-2 border-violet-200 text-violet-900 hover:bg-violet-50"
                        nativeButton={false} render={<Link href={loyaltyCampaignUrl(id, idea)} />}
                      >
                        Turn into campaign
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {/* Human Approval Confirmation Dialog */}
      <Dialog
        open={approvingComment !== null}
        onOpenChange={(open) => {
          if (!open) setApprovingComment(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-violet-600" aria-hidden="true" />
              Approve & Send Reply
            </DialogTitle>
            <DialogDescription>
              Human review is mandatory before responding. Please verify your message before publishing.
            </DialogDescription>
          </DialogHeader>

          {approvingComment && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Original Comment:</span>
                <p className="mt-1 italic">&ldquo;{approvingComment.text}&rdquo;</p>
              </div>

              <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-xs text-violet-950">
                <span className="font-semibold text-violet-900">Your Approved Response:</span>
                <p className="mt-1 font-medium whitespace-pre-wrap">
                  {drafts[approvingComment.id] ?? approvingComment.suggestedReply}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                {isMock || isFallbackMode
                  ? "Simulation Notice: This reply is simulated safely in demo mode. No request will be sent to Instagram."
                  : "Safety Notice: This reply will be published directly to Instagram under your verified brand account. Never make claims or offer discounts not specified in your brand DNA."}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => setApprovingComment(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={busy !== null}
              onClick={() => void handleConfirmReply()}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {busy !== null ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Confirm & Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
