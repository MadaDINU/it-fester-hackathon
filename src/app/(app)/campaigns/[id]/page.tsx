"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { TBrandWithContext, TCampaign, TPublication, TCostValue, TVariant } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { CampaignRoi } from "@/components/app/roi-panels";
import { ReelStoryboard } from "@/components/app/reel-storyboard";
import { AdobeEditButton } from "@/components/app/adobe-edit-button";
import { publicationRequest, rankVariants } from "@/components/app/campaign-tools";

const mockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
export default function CampaignStudioPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<TCampaign | null>(null); const [brand, setBrand] = useState<TBrandWithContext | null>(null);
  const [costValue, setCostValue] = useState<TCostValue | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({}); const [publications, setPublications] = useState<Record<string, TPublication>>({});
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
      else if (kind === "simulate") { const publication = publications[variantId]; if (!publication) throw new Error("Publish a mock result first"); const metrics = await api.simulatePublication(publication.id); toast.success(`Simulated ER ${(metrics.engagementRate * 100).toFixed(1)}% · ${metrics.reach} reach`); }
      else { const result = await api.publishVariant(variantId, publicationRequest(campaign.platform, kind === "main" ? "main" : "publish", kind === "main")); setPublications(current => ({ ...current, [variantId]: result })); toast.success(`${result.mode === "mock" ? "Simulated publication" : "Published"} · ${result.account} account`); }
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(null); }
  }
  if (loading || campaign?.status === "generating") return <main><LoadingState label={loading ? "Loading Campaign Studio…" : "Generating campaign…"} /></main>;
  if (campaign?.status === "failed") return <main><ErrorState message="Campaign generation failed. Please try again." onRetry={() => void load()} /></main>;
  const src = (v: TVariant) => images[v.id] ?? v.imageUrl ?? api.creativeUrl(v.id);
  const pct = (v: number | null) => v === null ? "—" : `${(v * 100).toFixed(1)}%`;
  return <main>{error && <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div>}{campaign && <>
    <PageHeader title="Campaign Studio" description={campaign.brief} action={<Button variant="outline" className="min-h-11" nativeButton={false} render={<Link href={`/brands/${campaign.brandId}/campaigns/new`} />}>New campaign</Button>} />
    <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium text-[#5B6170]">{[campaign.goal, campaign.platform, campaign.status].map(tag => <span key={tag} className="rounded-full border border-[#E6E7ED] bg-white px-3 py-1">{tag}</span>)}</div>
    <CampaignRoi campaign={campaign} costValue={costValue} />
    {campaign.variants.length === 0 ? <EmptyState title="No variants yet" description="This campaign has not returned creative variants. Reload when generation completes." action={<Button onClick={() => void load()}>Reload campaign</Button>} /> : <div className="space-y-6">{rankVariants(campaign.variants).map((variant, index) => {
      const winner = index === 0;
      return <article key={variant.id} aria-label={winner ? `Recommended variant: ${variant.angle}` : variant.angle} className={`rounded-xl bg-white ${winner ? "border-2 border-[#7C3AED] p-6" : "border border-[#E6E7ED] p-4 sm:p-6"}`}>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {winner ? <><span className="rounded-full bg-[#7C3AED] px-3 py-1 text-white">Recommended</span><span className="font-medium text-[#5B6170]">Panel {variant.panelScore ?? "—"}/100 + predicted ER {pct(variant.predictedEngagementRate)}</span></> : <span className="rounded-full bg-[#F3EEFF] px-3 py-1 text-[#6D28D9]">Rank {variant.rank}</span>}
          <span className="rounded-full border border-[#E6E7ED] px-3 py-1 text-[#5B6170]">{variant.format}</span>
        </div>
        <h2 className={`${winner ? "text-xl" : "text-base"} mb-4 font-semibold text-[#20232D]`}>{variant.angle}</h2>
        <div className={`grid gap-6 ${winner ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]"}`}>
          <div>
            <Image unoptimized width={1080} height={1350} className="aspect-[4/5] w-full rounded-xl border border-[#E6E7ED] bg-[#F3EEFF] object-contain" src={src(variant)} alt={`Creative preview: ${variant.imageHeadline}`} />
            <p className="mt-2 text-xs text-[#5B6170]">{variant.format === "reel" ? "Reel cover preview; no video is generated." : "1080 × 1350 creative preview"}</p>
          </div>
          <div className="space-y-4">
            <div><p className="whitespace-pre-wrap text-sm leading-relaxed text-[#20232D]">{variant.caption}</p><p className="mt-2 break-words text-sm text-[#6D28D9]">{variant.hashtags.join(" ")}</p></div>
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[#E6E7ED] p-4">
              <div><dt className="text-xs text-[#5B6170]">Panel score</dt><dd className="mt-1 text-2xl font-semibold">{variant.panelScore === null ? "—" : `${variant.panelScore}/100`}</dd><meter className="mt-2 w-full accent-violet-600" min={0} max={100} value={variant.panelScore ?? 0} aria-label={`Panel score for ${variant.angle}`} /></div>
              <div><dt className="text-xs text-[#5B6170]">Predicted ER</dt><dd className="mt-1 text-2xl font-semibold">{pct(variant.predictedEngagementRate)}</dd><p className="mt-2 text-xs text-[#5B6170]">Suggested hour: {variant.suggestedPostHour === null ? "unavailable" : `${String(variant.suggestedPostHour).padStart(2, "0")}:00`}</p></div>
            </dl>
            {variant.appliedLearningIds.length > 0 && <div className="flex flex-wrap gap-2">{variant.appliedLearningIds.map(learningId => <Tooltip key={learningId}><TooltipTrigger className="min-h-11 rounded-full bg-[#F3EEFF] px-3 text-xs font-medium text-[#6D28D9]">Uses learning</TooltipTrigger><TooltipContent>{brand?.learnings.find(l => l.id === learningId)?.insight ?? "Learning details unavailable"}</TooltipContent></Tooltip>)}</div>}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#E6E7ED] pt-4">
          <Button className="min-h-11" disabled={busy !== null} onClick={() => void action(variant.id, "render")}>{busy === variant.id ? "Working…" : mockMode ? "Render demo JPEG" : "Render & save creative"}</Button>
          <AdobeEditButton variant={variant} imageSrc={src(variant)} disabled={busy !== null} onSaved={imageUrl => setImages(current => ({ ...current, [variant.id]: imageUrl }))} />
          <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void action(variant.id, "publish")}>Publish · test account{mockMode ? " (mock)" : ""}</Button>
          {publications[variant.id] && <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void action(variant.id, "simulate")}>Simulate results</Button>}
          <Button variant="destructive" className="min-h-11 sm:ml-auto" disabled={busy !== null || !brand?.instagram?.username} onClick={() => void action(variant.id, "main")}>Post to {brand?.instagram?.username ? `@${brand.instagram.username}` : "main account"}{mockMode ? " (mock)" : ""}</Button>
        </div>
        {publications[variant.id] && <p role="status" className="mt-2 text-xs text-[#5B6170]">{publications[variant.id].mode} publication · {publications[variant.id].account} account · {publications[variant.id].status}</p>}
        <div className="mt-4 space-y-3">
          {variant.reelScript && <details open={winner} className="rounded-xl border border-[#E6E7ED]"><summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold">Reel storyboard · {variant.reelScript.durationSeconds}s</summary><div className="px-4 pb-4"><ReelStoryboard script={variant.reelScript} /></div></details>}
          <details className="rounded-xl border border-[#E6E7ED]"><summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold">Focus group · {variant.panel.length} reactions</summary><div className="grid gap-3 px-4 pb-4 md:grid-cols-2">{variant.panel.map(reaction => <blockquote key={reaction.personaId} className="rounded-lg border border-[#E6E7ED] p-4"><p className={`text-xs font-semibold ${reaction.sentiment === "positive" ? "text-emerald-800" : reaction.sentiment === "negative" ? "text-red-800" : "text-[#5B6170]"}`}>{reaction.personaName} · {reaction.sentiment}</p><p className="my-3 text-sm leading-relaxed">“{reaction.quote}”</p><label className="text-xs">Stop score {reaction.stopScore}/10<meter className="mt-1 block w-full accent-violet-600" min={0} max={10} value={reaction.stopScore} /></label>{reaction.objection && <p className="mt-3 text-xs text-[#5B6170]">Objection: {reaction.objection}</p>}</blockquote>)}</div></details>
        </div>
      </article>;
    })}</div>}</>}</main>;
}
