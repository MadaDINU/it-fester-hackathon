"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { TCommunity } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { filterComments, loyaltyCampaignUrl } from "@/components/app/community-model";

type Sentiment = "all" | "positive" | "neutral" | "negative";
const isMock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<TCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sentiment, setSentiment] = useState<Sentiment>("all");
  const [query, setQuery] = useState("");
  const [questionsOnly, setQuestionsOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setCommunity(await api.getCommunity(id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load community"); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function runAgent() {
    setBusy("agent"); setError(""); setNotice("");
    try {
      setCommunity(await api.runCommunity(id));
      setNotice(isMock ? "Demo insights loaded; no real comments were processed." : "Community insights updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to run Community agent"); }
    finally { setBusy(null); }
  }

  async function sendMockReply(commentId: string, text: string) {
    if (!isMock || !text.trim() || text.length > 500 || !window.confirm("Simulate this reply? Nothing will be sent to Instagram.")) return;
    setBusy(commentId); setError(""); setNotice("");
    try {
      await api.replyToComment(commentId, { text: text.trim() });
      setCommunity(current => current ? { ...current, comments: current.comments.map(comment => comment.id === commentId ? { ...comment, replied: true } : comment) } : current);
      setNotice("Mock reply recorded in this view only; nothing was sent or saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to simulate reply"); }
    finally { setBusy(null); }
  }

  const comments = community ? filterComments(community.comments, { sentiment, query, questionsOnly }) : [];
  return <>
    <PageHeader title="Listen. Respond. Build loyalty." description="Understand your community and turn its questions into useful conversations." action={<Button className="min-h-11" disabled={busy !== null || loading} onClick={() => void runAgent()}>{busy === "agent" ? "Running…" : "Run Community agent"}</Button>} />
    <div className="mb-6"><Button variant="outline" className="min-h-11" render={<Link href={`/brands/${encodeURIComponent(id)}`} />}>Back to brand</Button></div>
    {isMock ? <p className="mb-6 rounded-lg bg-violet-50 p-4 text-sm text-violet-900">Demo mode: sample comments and replies are illustrative; nothing is sent to Instagram.</p> : <p className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Live replies are unavailable until the reply route and explicit approval are in place.</p>}
    {error && <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div>}
    {notice && <p role="status" className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    {loading ? <LoadingState label="Loading community…" /> : community && <div className="space-y-8">
      <section aria-labelledby="community-summary">
        <h2 id="community-summary" className="mb-4 text-xl font-semibold">Community pulse</h2>
        {community.summary ? <div className="grid gap-4 sm:grid-cols-3">{[
          ["Positive", community.summary.positiveShare], ["Negative", community.summary.negativeShare], ["Questions", community.summary.questionShare],
        ].map(([label, share]) => <Card key={String(label)} className="border shadow-none ring-0"><CardContent className="p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-semibold">{(Number(share) * 100).toFixed(0)}%</p></CardContent></Card>)}</div> : <p className="text-sm text-slate-500">Summary unavailable.</p>}
        {community.summary?.topTopics.length ? <p className="mt-4 text-sm text-slate-600">Top topics: {community.summary.topTopics.join(" · ")}</p> : null}
      </section>
      <section aria-labelledby="comments-title">
        <h2 id="comments-title" className="mb-4 text-xl font-semibold">Comments</h2>
        <div className="mb-5 flex flex-wrap items-end gap-4 rounded-xl bg-slate-50 p-4">
          <label className="flex flex-col gap-2 text-sm">Search comments<input type="search" value={query} onChange={e => setQuery(e.target.value)} className="min-h-11 rounded-lg border bg-white px-3" /></label>
          <label className="flex flex-col gap-2 text-sm">Sentiment<select value={sentiment} onChange={e => setSentiment(e.target.value as Sentiment)} className="min-h-11 rounded-lg border bg-white px-3"><option value="all">All</option><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option></select></label>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={questionsOnly} onChange={e => setQuestionsOnly(e.target.checked)} />Questions only</label>
        </div>
        {!comments.length ? <EmptyState title="No comments to show" description="Try another filter or run the Community agent when data is available." /> : <div className="space-y-4">{comments.map(comment => {
          const draft = drafts[comment.id] ?? comment.suggestedReply ?? "";
          return <Card key={comment.id} className="border shadow-none ring-0"><CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-3 py-1 ${comment.sentiment === "positive" ? "bg-emerald-100 text-emerald-900" : comment.sentiment === "negative" ? "bg-red-100 text-red-900" : "bg-slate-100 text-slate-800"}`}>{comment.sentiment ?? "Unclassified"}</span>{comment.topic && <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-900">{comment.topic}</span>}{comment.isQuestion && <span className="rounded-full bg-slate-100 px-3 py-1">Question</span>}</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.text}</p>
            <label htmlFor={`reply-${comment.id}`} className="block text-sm font-medium">Suggested reply</label>
            <Textarea id={`reply-${comment.id}`} maxLength={500} value={draft} onChange={e => setDrafts(current => ({ ...current, [comment.id]: e.target.value }))} disabled={comment.replied || busy !== null} />
            <div className="flex flex-wrap items-center gap-3"><Button className="min-h-11" variant="outline" disabled={!isMock || comment.replied || busy !== null || !draft.trim() || draft.length > 500} onClick={() => void sendMockReply(comment.id, draft)}>{comment.replied ? "Replied" : "Send mock reply"}</Button><span className="text-xs text-slate-500">{draft.length}/500</span></div>
          </CardContent></Card>;
        })}</div>}
      </section>
      <section aria-labelledby="loyalty-title"><h2 id="loyalty-title" className="mb-4 text-xl font-semibold">Loyalty ideas</h2>{community.loyaltyIdeas.length ? <div className="grid gap-4 md:grid-cols-2">{community.loyaltyIdeas.map((idea, index) => <Card key={index} className="border shadow-none ring-0"><CardHeader className="p-5 pb-0"><CardTitle>{idea.title}</CardTitle><p className="text-xs text-violet-700">{idea.mechanic.replaceAll("_", " ")}</p></CardHeader><CardContent className="space-y-4 p-5"><p className="text-sm">{idea.description}</p><p className="text-sm text-slate-600">{idea.why}</p><Button variant="outline" className="min-h-11" render={<Link href={loyaltyCampaignUrl(id, idea)} />}>Turn into campaign</Button></CardContent></Card>)}</div> : <p className="text-sm text-slate-500">No loyalty ideas yet.</p>}</section>
    </div>}
  </>;
}
