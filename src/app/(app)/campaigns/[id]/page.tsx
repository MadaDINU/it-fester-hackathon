"use client";

import { formatPercent, formatR2, formatScore } from "@/components/app/format";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, Brain, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { TBrandWithContext, TCampaign, TPublication, TCostValue, TVariant, TMetrics } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { CampaignRoi } from "@/components/app/roi-panels";
import { ReelStoryboard } from "@/components/app/reel-storyboard";
import { AdobeEditButton } from "@/components/app/adobe-edit-button";
import { LoopRing } from "@/components/app/loop-ring";
import { CountUp } from "@/components/app/count-up";
import { publicationRequest, rankVariants } from "@/components/app/campaign-tools";
import { BrandFrame } from "@/components/app/brand-sidebar";
import { LoopSteps } from "@/components/app/loop-steps";
import { InfoTip } from "@/components/app/info-tip";
import { StatusBadge } from "@/components/app/status-badge";
import { currentStep, studioLoop, type StudioStepKey } from "@/components/app/loop-progress";

const NEXT_TEXT: Record<StudioStepKey | "done", string> = {
  generated: "Variants are being generated.",
  creative: "Render the recommended variant to check how the post will look, or edit it in Adobe Express.",
  published: "Publish the recommended variant to the test account.",
  simulated: "Generate results for the test post so the model can compare them with its prediction.",
  learned: "Let the model compare its prediction with the result and keep what it learned.",
  done: "Loop complete for this campaign. See what the model learned.",
};

const mockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
export default function CampaignStudioPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<TCampaign | null>(null); const [brand, setBrand] = useState<TBrandWithContext | null>(null);
  const [costValue, setCostValue] = useState<TCostValue | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({}); const [publications, setPublications] = useState<Record<string, TPublication>>({});
  const [simulated, setSimulated] = useState<Record<string, TMetrics>>({}); const [learned, setLearned] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const result = await api.getCampaign(id); setCampaign(result); setBrand(await api.getBrand(result.brandId)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load campaign"); } finally { setLoading(false); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!campaign) return; let active = true; setCostValue(null); api.getDashboard(campaign.brandId).then(result => { if (active) setCostValue(result.costValue); }).catch(() => { if (active) setCostValue(null); }); return () => { active = false; }; }, [campaign]);
  async function action(variantId: string, kind: "render" | "publish" | "main" | "simulate") {
    if (!campaign) return;
    if (kind === "main") {
      const username = brand?.instagram?.username;
      if (!username) { setError("The main Instagram account is unavailable for this brand."); return; }
      if (!window.confirm(`${mockMode ? "DEMO ONLY: simulate" : "Confirm real publication:"} a post to the main @${username} account?`)) return;
    }
    setBusy(variantId); setError("");
    try {
      if (kind === "render") { const result = await api.renderVariant(variantId); setImages(current => ({ ...current, [variantId]: result.imageUrl })); toast.success(mockMode ? "Demo JPEG rendered locally; not uploaded" : "Creative saved"); }
      else if (kind === "simulate") { const publication = publications[variantId]; if (!publication) throw new Error("Publish a mock result first"); const metrics = await api.simulatePublication(publication.id); setSimulated(current => ({ ...current, [variantId]: metrics })); toast.success(`Simulated ER ${formatPercent(metrics.engagementRate)} · ${metrics.reach} reach`); }
      else { const result = await api.publishVariant(variantId, publicationRequest(campaign.platform, kind === "main" ? "main" : "publish", kind === "main")); setPublications(current => ({ ...current, [variantId]: result })); toast.success(`${result.mode === "mock" ? "Simulated publication" : "Published"} · ${result.account} account`); }
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(null); }
  }
  async function learn() {
    if (!campaign) return;
    setBusy("learn"); setError("");
    try { const result = await api.learn(campaign.brandId); setLearned(true); setBrand(current => current ? { ...current, learnings: result.learnings } : current); toast.success(`Learning loop complete${result.model.r2 === null ? "" : ` · R² ${formatR2(result.model.r2)}`}${mockMode ? " · demo model" : ""}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to run learning loop"); }
    finally { setBusy(null); }
  }
  if (loading || campaign?.status === "generating") return <main><LoadingState label={loading ? "Loading Campaign Studio…" : "Generating campaign…"} /></main>;
  if (campaign?.status === "failed") return <main><ErrorState message="Campaign generation failed. Please try again." onRetry={() => void load()} /></main>;
  const src = (v: TVariant) => images[v.id] ?? v.imageUrl ?? api.creativeUrl(v.id);
  const pct = (v: number | null) => v === null ? "—" : `${formatPercent(v)}`;
  if (!campaign) return <main>{error && <ErrorState message={error} onRetry={() => void load()} />}</main>;
  const top = rankVariants(campaign.variants)[0];
  const publishedId = Object.keys(publications)[0];
  const steps = studioLoop({ campaign, rendered: Object.keys(images).length > 0, published: publishedId !== undefined, simulated: Object.keys(simulated).length > 0, learned });
  const next = steps[currentStep(steps)]?.key;
  const brandBase = `/brands/${encodeURIComponent(campaign.brandId)}`;
  const nextAction = !top ? null
    : next === "creative" ? <Button className="min-h-11" disabled={busy !== null} onClick={() => void action(top.id, "render")}>{mockMode ? "Render demo JPEG" : "Render & save creative"}</Button>
    : next === "published" || (next === "simulated" && !publishedId) ? <Button className="min-h-11" disabled={busy !== null} onClick={() => void action(top.id, "publish")}>Publish · test account{mockMode ? " (mock)" : ""}</Button>
    : next === "simulated" ? <Button className="min-h-11" disabled={busy !== null} onClick={() => void action(publishedId!, "simulate")}>Simulate results</Button>
    : next === "learned" ? <Button className="min-h-11" disabled={busy !== null} onClick={() => void learn()}><Brain aria-hidden="true" />{busy === "learn" ? "Learning…" : "Run learning loop"}</Button>
    : next === undefined ? <Button className="min-h-11" nativeButton={false} render={<Link href={`${brandBase}/analytics`} />}>See what the model learned<ArrowRight aria-hidden="true" /></Button> : null;
  return <BrandFrame brandId={campaign.brandId} section="campaigns"><main>
    <PageHeader crumbs={[{ label: brand?.name ?? "Brand", href: brandBase }, { label: "Campaigns", href: `${brandBase}/campaigns` }, { label: campaign.brief }]} title="Campaign Studio" description={campaign.brief} action={<Button variant="outline" className="min-h-11" nativeButton={false} render={<Link href={`${brandBase}/campaigns/new`} />}>New campaign</Button>} />
    {error && <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div>}
    <section aria-label="Campaign progress" className="mb-6 rounded-xl border border-[#E6E7ED] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#5B6170]"><StatusBadge status={campaign.status} />{[campaign.goal, campaign.platform].map(tag => <span key={tag} className="rounded-full border border-[#E6E7ED] px-3 py-1">{tag}</span>)}</div>
      <div className="mt-4"><LoopSteps steps={steps} label="Campaign progress" /></div>
      <div className="mt-4 flex flex-col gap-3 border-t border-[#E6E7ED] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5B6170]"><strong className="font-semibold text-[#20232D]">Next: </strong>{NEXT_TEXT[next ?? "done"]}{next === "simulated" && !publishedId && " Simulation needs a publication from this session, so publish to the test account again."}</p>
        <div className="shrink-0">{nextAction}</div>
      </div>
    </section>
    <CampaignRoi campaign={campaign} costValue={costValue} />
    {campaign.variants.length === 0 ? <EmptyState title="No variants yet" description="This campaign has not returned creative variants. Reload when generation completes." action={<Button onClick={() => void load()}>Reload campaign</Button>} /> : <div className="space-y-6">{rankVariants(campaign.variants).map((variant, index) => {
      const winner = index === 0;
      return <article key={variant.id} aria-label={winner ? `Recommended variant: ${variant.angle}` : variant.angle} style={{ "--lw-delay": `${index * 80}ms` } as CSSProperties} className={`rounded-xl bg-white ${winner ? "lw-settle border-2 border-[#7C3AED] p-6" : "lw-rise border border-[#E6E7ED] p-4 sm:p-6"}`}>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {winner ? <><span className="rounded-full bg-[#7C3AED] px-3 py-1 text-white">Recommended</span><span className="font-medium text-[#5B6170]">Panel {formatScore(variant.panelScore)}/100 + predicted ER {pct(variant.predictedEngagementRate)}</span><InfoTip id="panelScore" /></> : <span className="rounded-full bg-[#F3EEFF] px-3 py-1 text-[#6D28D9]">Rank {variant.rank}</span>}
          <span className="rounded-full border border-[#E6E7ED] px-3 py-1 text-[#5B6170]">{variant.format}</span>
        </div>
        <h2 className={`${winner ? "text-xl" : "text-base"} mb-4 font-semibold text-[#20232D]`}>{variant.angle}</h2>
        <div className={`grid gap-6 ${winner ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]"}`}>
          <div>
            <Image unoptimized width={1080} height={1350} className="aspect-[4/5] w-full rounded-xl border border-[#E6E7ED] bg-[#F3EEFF] object-contain" src={src(variant)} alt={`Creative preview: ${variant.imageHeadline}`} />
            <p className="mt-2 text-xs text-[#5B6170]">{variant.format === "reel" ? "Reel cover preview; no video is generated." : "1080 × 1350 creative preview"}</p>
          </div>
          <div className="space-y-4">
            {winner && variant.panelScore !== null && <div className="flex items-center gap-4"><LoopRing value={variant.panelScore / 100} size={88} label={`Panel score ${formatScore(variant.panelScore)} out of 100`} /><div><p className="text-3xl font-semibold text-[#20232D]"><CountUp value={variant.panelScore} format={n => `${Math.round(n)}/100`} /></p><p className="flex items-center gap-1.5 text-xs text-[#5B6170]">Focus group panel score<InfoTip id="panelScore" /></p></div></div>}
            <div><p className="whitespace-pre-wrap text-sm leading-relaxed text-[#20232D]">{variant.caption}</p><p className="mt-2 break-words text-sm text-[#6D28D9]">{variant.hashtags.join(" ")}</p></div>
            <dl className={`grid gap-4 rounded-xl border border-[#E6E7ED] p-4 ${winner && variant.panelScore !== null ? "grid-cols-1" : "grid-cols-2"}`}>
              {!(winner && variant.panelScore !== null) && <div><dt className="flex items-center gap-1.5 text-xs text-[#5B6170]">Panel score<InfoTip id="panelScore" /></dt><dd className="mt-1 text-2xl font-semibold">{variant.panelScore === null ? "—" : <CountUp value={variant.panelScore} format={n => `${Math.round(n)}/100`} />}</dd><meter className="mt-2 w-full accent-violet-600" min={0} max={100} value={variant.panelScore ?? 0} aria-label={`Panel score for ${variant.angle}`} /></div>}
              <div><dt className="flex items-center gap-1.5 text-xs text-[#5B6170]">Predicted ER<InfoTip id="predictedEr" /></dt><dd className="mt-1 text-2xl font-semibold">{variant.predictedEngagementRate === null ? "—" : <CountUp value={variant.predictedEngagementRate * 100} format={n => formatPercent(n, "en-US", { alreadyPercent: true })} />}</dd><p className="mt-2 text-xs text-[#5B6170]">Suggested hour: {variant.suggestedPostHour === null ? "unavailable" : `${String(variant.suggestedPostHour).padStart(2, "0")}:00`}</p></div>
            </dl>
            {variant.appliedLearningIds.length > 0 && <div className="flex flex-wrap gap-2">{variant.appliedLearningIds.map(learningId => <Tooltip key={learningId}><TooltipTrigger className="min-h-11 rounded-full bg-[#F3EEFF] px-3 text-xs font-medium text-[#6D28D9]">Uses learning</TooltipTrigger><TooltipContent>{brand?.learnings.find(l => l.id === learningId)?.insight ?? "Learning details unavailable"}</TooltipContent></Tooltip>)}</div>}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#E6E7ED] pt-4">
          <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void action(variant.id, "render")}>{busy === variant.id ? "Working…" : mockMode ? "Render demo JPEG" : "Render & save creative"}</Button>
          <AdobeEditButton variant={variant} imageSrc={src(variant)} disabled={busy !== null} onSaved={imageUrl => setImages(current => ({ ...current, [variant.id]: imageUrl }))} />
          <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void action(variant.id, "publish")}>Publish · test account{mockMode ? " (mock)" : ""}</Button>
          {publications[variant.id] && <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void action(variant.id, "simulate")}>Simulate results</Button>}
          <Button variant="destructive" className="min-h-11 sm:ml-auto" disabled={busy !== null || !brand?.instagram?.username} onClick={() => void action(variant.id, "main")}>Post to {brand?.instagram?.username ? `@${brand.instagram.username}` : "main account"}{mockMode ? " (mock)" : ""}</Button>
        </div>
        {publications[variant.id] && <p role="status" className="mt-2 text-xs text-[#5B6170]">{publications[variant.id].mode} publication · {publications[variant.id].account} account · {publications[variant.id].status}</p>}
        <div className="mt-4 space-y-3">
          {variant.reelScript && <details open={winner} className="rounded-xl border border-[#E6E7ED]"><summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-semibold">Reel storyboard · {variant.reelScript.durationSeconds}s<ChevronDown className="lw-chevron ml-auto size-4 text-[#5B6170]" aria-hidden="true" /></summary><div className="px-4 pb-4"><ReelStoryboard script={variant.reelScript} /></div></details>}
          <details className="rounded-xl border border-[#E6E7ED]"><summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-semibold"><span className="flex items-center gap-2">Focus group · {variant.panel.length} reactions<InfoTip id="focusGroup" /></span><ChevronDown className="lw-chevron ml-auto size-4 text-[#5B6170]" aria-hidden="true" /></summary><div className="grid gap-3 px-4 pb-4 md:grid-cols-2">{variant.panel.map(reaction => <blockquote key={reaction.personaId} className="rounded-lg border border-[#E6E7ED] p-4"><p className={`text-xs font-semibold ${reaction.sentiment === "positive" ? "text-emerald-800" : reaction.sentiment === "negative" ? "text-red-800" : "text-[#5B6170]"}`}>{reaction.personaName} · {reaction.sentiment}</p><p className="my-3 text-sm leading-relaxed">“{reaction.quote}”</p><label className="text-xs">Stop score {formatScore(reaction.stopScore)}/10<meter className="mt-1 block w-full accent-violet-600" min={0} max={10} value={reaction.stopScore} /></label>{reaction.objection && <p className="mt-3 text-xs text-[#5B6170]">Objection: {reaction.objection}</p>}</blockquote>)}</div></details>
        </div>
      </article>;
    })}</div>}</main></BrandFrame>;
}
