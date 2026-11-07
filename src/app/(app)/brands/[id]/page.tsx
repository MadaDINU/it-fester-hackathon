"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Brain, RefreshCw, Plus, ArrowUpRight } from "lucide-react";
import type { TBrandWithContext, TCampaign } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { loadBrandWorkspace } from "@/components/app/brand-data";
import { SimulatedBadge, isSimulatedLearning, stripSimulatedPrefix } from "@/components/app/simulated-badge";
import { COLD_START_LABEL, isColdStartModel } from "@/components/app/analytics-data";
import { BrandDnaPanel, AudiencePanels, PersonaCards, SectionCard } from "@/components/app/intelligence-panels";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";

export default function BrandPage() {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<TBrandWithContext | null>(null);
  const [campaigns, setCampaigns] = useState<TCampaign[]>([]);
  const [campaignError, setCampaignError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"refresh" | "learn" | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await loadBrandWorkspace(id); setBrand(result.brand); setCampaigns(result.campaigns); setCampaignError(result.campaignError); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load brand"); }
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
    try { const result = await api.learn(id); setBrand(current => current ? { ...current, learnings: result.learnings } : current); toast.success(`Learning loop complete · ${isColdStartModel(result.model) || result.model.r2 === null ? COLD_START_LABEL : `R² ${result.model.r2.toFixed(2)}`}${process.env.NEXT_PUBLIC_USE_MOCKS === "true" ? " · demo model" : ""}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to run learning loop"); }
    finally { setBusy(null); }
  }
  if (loading) return <main><LoadingState label="Loading brand intelligence…" /></main>;
  return <main>{error && <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div>}{brand && <>
    <PageHeader title={brand.name} description={`${brand.instagram ? `@${brand.instagram.username} · ${brand.instagram.followers.toLocaleString("en-US")} followers · ` : ""}${brand.importedPosts} imported posts`} action={<div className="flex flex-wrap gap-2">{brand.instagram && <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void refresh()}><RefreshCw className={busy === "refresh" ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />Refresh</Button>}<Button className="min-h-11" nativeButton={false} render={<Link href={`/brands/${id}/campaigns/new`} />}><Plus aria-hidden="true" />New campaign</Button></div>} />
    <nav aria-label="Brand views" className="mb-8 flex flex-wrap gap-3 text-sm font-medium text-violet-700"><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4" href={`/brands/${id}/analytics`}>Analytics<ArrowUpRight className="size-4" aria-hidden="true" /></Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4" href={`/brands/${id}/community`}>Community<ArrowUpRight className="size-4" aria-hidden="true" /></Link></nav>
    <div className="space-y-8"><BrandDnaPanel dna={brand.dna} /><section aria-labelledby="audience-title"><h2 id="audience-title" className="mb-4 text-2xl font-semibold tracking-tight">Audience Intelligence</h2><AudiencePanels audience={brand.audience} /></section><section aria-labelledby="personas-title"><h2 id="personas-title" className="mb-4 text-2xl font-semibold tracking-tight">Meet your audience</h2>{brand.personas.length ? <PersonaCards personas={brand.personas} /> : <p className="text-sm text-slate-500">No personas yet.</p>}</section>
    <SectionCard title="Brand Memory"><p className="text-sm text-slate-600">Every campaign is a chance to learn. Keep the insights that should shape the next one.</p>{brand.learnings.length ? <ul className="space-y-3">{brand.learnings.map(learning => <li key={learning.id} className="rounded-lg border bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{stripSimulatedPrefix(learning.insight)}</p>{(isSimulatedLearning(learning.insight) || isSimulatedLearning(learning.evidence)) && <SimulatedBadge />}</div><p className="mt-2 text-sm text-slate-600">{stripSimulatedPrefix(learning.evidence)}</p><p className="mt-2 text-xs text-violet-700">{learning.confidence} confidence · {new Date(learning.createdAt).toLocaleDateString("en-GB")}</p></li>)}</ul> : <p className="text-sm text-slate-500">No learnings yet.</p>}<Button className="min-h-11" variant="outline" disabled={busy !== null} onClick={() => void learn()}><Brain aria-hidden="true" />{busy === "learn" ? "Learning…" : "Run learning loop"}</Button></SectionCard>
    <SectionCard title="Campaigns">{campaignError ? <p role="status" className="text-sm text-amber-800">Campaign list unavailable: {campaignError}</p> : campaigns.length ? <ul className="divide-y">{campaigns.map(campaign => <li key={campaign.id}><Link className="flex min-h-16 items-center justify-between gap-4 py-4 hover:text-violet-700" href={`/campaigns/${campaign.id}`}><div><p className="font-medium">{campaign.brief}</p><p className="mt-1 text-xs text-slate-500">{campaign.formats.join(" + ")} · {campaign.status} · {new Date(campaign.createdAt).toLocaleDateString("en-GB")}</p></div><ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link></li>)}</ul> : <p className="text-sm text-slate-500">No campaigns yet. Start with one clear idea.</p>}</SectionCard></div>
  </>}</main>;
}
