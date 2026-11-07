"use client";

import { formatPercent, formatR2 } from "@/components/app/format";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowRight, Brain, ChevronRight, RefreshCw } from "lucide-react";
import type { TBrandWithContext, TCampaign, TCommunity, TDashboard } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { loadBrandWorkspace } from "@/components/app/brand-data";
import { SimulatedBadge, isSimulatedLearning, isSimulatedSource, isSimulatedTraining, stripSimulatedPrefix } from "@/components/app/simulated-badge";
import { COLD_START_LABEL, isColdStartModel } from "@/components/app/analytics-data";
import { computeCommentStats, formatMechanic } from "@/components/app/community-model";
import { SectionCard } from "@/components/app/intelligence-panels";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { NewCampaignButton } from "@/components/app/brand-sidebar";
import { InfoTip } from "@/components/app/info-tip";
import { LoopRing } from "@/components/app/loop-ring";
import { LoopSteps } from "@/components/app/loop-steps";
import { CountUp } from "@/components/app/count-up";
import { StatusBadge } from "@/components/app/status-badge";
import { audienceSeenKey, brandLoop, currentStep, generatedCampaigns, isPublishedCampaign, type BrandStepKey } from "@/components/app/loop-progress";

const STEP_TEXT: Record<BrandStepKey | "done", string> = {
  import: "Bring in your Instagram posts so Loopwise can learn from real results.",
  audience: "See who follows you and what they respond to before you create anything.",
  campaign: "Describe one idea. AI writes variants and your audience focus group scores them.",
  publish: "Open the latest campaign and publish the recommended variant to the test account.",
  simulate: "Generate results for the test post so the model can compare them with its prediction.",
  learn: "Let the model compare predictions with results and keep what it learned.",
  done: "Loop complete. Start the next campaign; it will use what was learned.",
};
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB");
const rise = (ms: number) => ({ "--lw-delay": `${ms}ms` }) as CSSProperties;
const panelLink = "inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary-ink hover:underline";

function Kpi({ label, tip, children }: { label: string; tip?: ReactNode; children: ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface p-4 sm:p-5"><p className="flex items-center gap-1.5 text-sm text-fg-muted">{label}{tip}</p><div className="mt-3 flex min-h-11 flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-fg sm:gap-3 sm:text-3xl">{children}</div></div>;
}

export default function BrandOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<TBrandWithContext | null>(null);
  const [campaigns, setCampaigns] = useState<TCampaign[]>([]);
  const [campaignError, setCampaignError] = useState("");
  const [dashboard, setDashboard] = useState<TDashboard | null>(null);
  const [community, setCommunity] = useState<TCommunity | null>(null);
  const [audienceSeen, setAudienceSeen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"refresh" | "learn" | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAudienceSeen(window.localStorage.getItem(audienceSeenKey(id)) === "1"); } catch { /* storage blocked: treat as not seen */ }
    try {
      const [workspace, dash, comm] = await Promise.all([loadBrandWorkspace(id), api.getDashboard(id).catch(() => null), api.getCommunity(id).catch(() => null)]);
      setBrand(workspace.brand); setCampaigns(workspace.campaigns); setCampaignError(workspace.campaignError); setDashboard(dash); setCommunity(comm);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load brand"); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  async function refresh() {
    setBusy("refresh"); setError("");
    try { const result = await api.fromInstagram(); if (result.id === id) setBrand(result); else throw new Error("The server-configured Instagram account belongs to another brand."); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to refresh brand"); }
    finally { setBusy(null); }
  }
  async function learn() {
    setBusy("learn"); setError("");
    try {
      const result = await api.learn(id);
      setBrand(current => current ? { ...current, learnings: result.learnings } : current);
      setDashboard(current => current ? { ...current, model: result.model } : current);
      toast.success(`Learning loop complete · ${isColdStartModel(result.model) || result.model.r2 === null ? COLD_START_LABEL : `R² ${formatR2(result.model.r2, "ro-RO")}`}${process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? " · demo model" : ""}`);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to run learning loop"); }
    finally { setBusy(null); }
  }
  if (loading) return <main><LoadingState label="Loading brand overview…" /></main>;
  if (!brand) return <main>{error && <ErrorState message={error} onRetry={() => void load()} />}</main>;

  const base = `/brands/${encodeURIComponent(id)}`;
  const steps = brandLoop({ brand, campaigns, dashboard, audienceSeen });
  const index = currentStep(steps); const step = index === -1 ? null : steps[index];
  const generated = generatedCampaigns(campaigns);
  const studio = (c: TCampaign | undefined) => c ? `/campaigns/${c.id}` : `${base}/campaigns`;
  const model = dashboard?.model ?? null;
  const simulatedData = (model && isSimulatedTraining(model.trainedOn)) || (dashboard?.series.some(p => isSimulatedSource(p.source)) ?? false);
  const learnings = [...brand.learnings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const stats = community?.comments.length ? computeCommentStats(community.comments) : null;
  const linkButton = (href: string, label: string) => <Button className="min-h-11" nativeButton={false} render={<Link href={href} />}>{label}<ArrowRight aria-hidden="true" /></Button>;
  const learnButton = (primary: boolean) => <Button className="min-h-11" variant={primary ? "default" : "outline"} disabled={busy !== null} onClick={() => void learn()}><Brain aria-hidden="true" />{busy === "learn" ? "Learning…" : "Run learning loop"}</Button>;
  const stepAction = !step ? <NewCampaignButton brandId={id} />
    : step.key === "import" ? (brand.instagram ? <Button className="min-h-11" disabled={busy !== null} onClick={() => void refresh()}><RefreshCw className={busy === "refresh" ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />Import account</Button> : linkButton("/brands/new", "Connect Instagram"))
    : step.key === "audience" ? linkButton(`${base}/audience`, "Review audience")
    : step.key === "campaign" ? linkButton(`${base}/campaigns/new`, "Create campaign")
    : step.key === "publish" ? linkButton(studio(generated[0]), "Open Campaign Studio")
    : step.key === "simulate" ? linkButton(studio(generated.find(isPublishedCampaign)), "Open Campaign Studio")
    : learnButton(true);

  return <main>
    <PageHeader title={brand.name}
      leading={<span className="hidden sm:block"><LoopRing value={1} size={56} stroke={3} label={`${brand.name} loop`}><span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary text-base font-semibold text-white">{brand.name.trim().charAt(0).toUpperCase()}</span></LoopRing></span>}
      description={<><p>Overview{brand.instagram && <> · @{brand.instagram.username}</>} · where your growth loop stands and what to do next</p><div className="mt-2 flex flex-wrap gap-2">{[brand.dna.niche, brand.dna.industry].filter(Boolean).map(tag => <span key={tag} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-ink">{tag}</span>)}</div></>}
      action={<>{brand.instagram && step?.key !== "import" && <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void refresh()}><RefreshCw className={busy === "refresh" ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />Refresh</Button>}</>} />
    {error && <div className="mb-8"><ErrorState message={error} onRetry={() => void load()} /></div>}
    <div className="flex flex-col gap-8">
      <section aria-labelledby="kpi-title" className="lw-rise">
        <div className="mb-4 flex flex-wrap items-center gap-3"><h2 id="kpi-title" className="text-base font-semibold text-fg">At a glance</h2>{simulatedData && <SimulatedBadge />}</div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi label="Followers">{brand.instagram ? <CountUp value={brand.instagram.followers} /> : <span className="text-base font-medium text-fg-muted">Not connected</span>}</Kpi>
          <Kpi label="Imported posts"><CountUp value={brand.importedPosts} /></Kpi>
          <Kpi label="Avg. engagement rate" tip={<InfoTip id="er" />}>{dashboard && dashboard.totals.posts > 0 ? <CountUp value={dashboard.totals.avgEngagementRate * 100} format={n => formatPercent(n, "ro-RO", { alreadyPercent: true })} /> : <span className="text-base font-medium text-fg-muted">No results yet</span>}</Kpi>
          <Kpi label="Model" tip={<InfoTip id={isColdStartModel(model) ? "coldStart" : "r2"} />}>{!model || isColdStartModel(model) ? <><LoopRing value={0} pulse size={44} stroke={5} label="Cold start model, no fit yet" /><span className="text-xl">Cold start</span></> : <><LoopRing value={Math.max(0, model.r2 ?? 0)} size={44} stroke={5} label={`Model fit R² ${formatR2(model.r2, "ro-RO")}`} /><span>R² <CountUp value={model.r2 ?? 0} format={n => formatR2(n, "ro-RO")} /></span></>}</Kpi>
        </div>
      </section>

      <section aria-labelledby="next-title" className="lw-rise order-first rounded-xl sm:order-none border-2 border-primary bg-surface p-6" style={rise(60)}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="next-title" className="text-base font-semibold text-fg">Next step</h2><p className="text-xs font-medium text-fg-muted">{step ? `Step ${index + 1} of ${steps.length}` : `All ${steps.length} steps done`}</p></div>
        <div className="mt-4"><LoopSteps steps={steps} label="Growth loop progress" /></div>
        <div className="mt-6 flex flex-col gap-4 rounded-lg bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-lg font-semibold text-fg">{step ? step.label : "Start the next loop"}</p><p className="mt-1 max-w-[60ch] text-sm text-fg-muted">{STEP_TEXT[step?.key ?? "done"]}</p></div>
          <div className="shrink-0">{stepAction}</div>
        </div>
      </section>

      <div className="lw-rise grid gap-6 lg:grid-cols-3" style={rise(120)}>
        <SectionCard title="Recent campaigns" action={generated.length > 0 && <Link href={`${base}/campaigns`} className={panelLink}>View all<ChevronRight className="size-4" aria-hidden="true" /></Link>}>
          {campaignError ? <p role="status" className="text-sm text-warning-ink">Campaign list unavailable: {campaignError}</p>
            : generated.length ? <ul className="-my-2 divide-y divide-border">{generated.slice(0, 3).map(c => <li key={c.id}><Link href={`/campaigns/${c.id}`} className="group flex min-h-16 items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium text-fg group-hover:text-primary-ink">{c.brief}</p><div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-fg-muted"><StatusBadge status={c.status} />{date(c.createdAt)}</div></div><ChevronRight className="size-4 shrink-0 text-fg-muted" aria-hidden="true" /></Link></li>)}</ul>
            : <div className="text-sm text-fg-muted"><p>No campaigns yet. Start with one clear idea.</p><Link href={`${base}/campaigns/new`} className={`${panelLink} mt-2`}>Create your first campaign</Link></div>}
        </SectionCard>
        <SectionCard title="What we learned" action={<Link href={`${base}/analytics`} className={panelLink}>Analytics<ChevronRight className="size-4" aria-hidden="true" /></Link>}>
          {learnings.length ? <ul className="space-y-3">{learnings.map(l => <li key={l.id} className="rounded-lg border border-border p-3"><p className="text-sm font-medium text-fg">{stripSimulatedPrefix(l.insight)}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">{l.confidence} confidence · {date(l.createdAt)}{(isSimulatedLearning(l.insight) || isSimulatedLearning(l.evidence)) && <SimulatedBadge />}</p></li>)}</ul>
            : <p className="text-sm text-fg-muted">No learnings yet. Publish and simulate a campaign, then run the learning loop.</p>}
          {step?.key !== "learn" && learnButton(false)}
        </SectionCard>
        <SectionCard title="Community" action={<Link href={`${base}/community`} className={panelLink}>Open<ChevronRight className="size-4" aria-hidden="true" /></Link>}>
          {stats ? <><dl className="grid grid-cols-3 gap-3 text-center">{([["Positive", stats.positiveShare], ["Negative", stats.negativeShare], ["Questions", stats.questionShare]] as const).map(([label, share]) => <div key={label} className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-fg-muted">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-fg">{formatPercent(share, "ro-RO")}</dd></div>)}</dl><p className="text-sm text-fg-muted">{stats.total} comments · {stats.pending} waiting for a reply</p>{community?.summary?.topTopics.length ? <div className="flex flex-wrap gap-2">{community.summary.topTopics.slice(0, 4).map(t => <span key={t} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-ink">{t}</span>)}</div> : null}</>
            : community?.loyaltyIdeas.length ? <><p className="text-sm text-fg-muted">No comments yet. Loyalty ideas to start the conversation:</p><ul className="space-y-3">{community.loyaltyIdeas.slice(0, 2).map(idea => <li key={idea.title} className="rounded-lg border border-border p-3"><p className="text-sm font-medium text-fg">{idea.title}</p><p className="mt-1 text-xs text-fg-muted">{formatMechanic(idea.mechanic)}</p></li>)}</ul></>
            : <p className="text-sm text-fg-muted">No comments or loyalty ideas yet. Open Community to run the Community agent.</p>}
        </SectionCard>
      </div>
    </div>
  </main>;
}
