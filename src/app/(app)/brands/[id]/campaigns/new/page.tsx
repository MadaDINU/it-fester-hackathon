"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoopRing } from "@/components/app/loop-ring";
import { CreateCampaignRequest, Format, Goal, Platform, type TBrandWithContext } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";

const stages = ["Creator agent writing…", "Focus group reacting…", "Predicting performance…"];
export default function NewCampaignPage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [brand, setBrand] = useState<TBrandWithContext | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [stage, setStage] = useState(0);
  const [goal, setGoal] = useState<string>("engagement"); const [platform, setPlatform] = useState("instagram");
  const [formats, setFormats] = useState<string[]>(["reel", "post"]); const [brief, setBrief] = useState(""); const [count, setCount] = useState(4);
  useEffect(() => { let active = true; api.getBrand(id).then(b => { if (active) setBrand(b); }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load brand"); }); const query = new URLSearchParams(window.location.search); if (query.get("goal") === "loyalty") setGoal("loyalty"); if (query.get("brief")) setBrief(query.get("brief")!); return () => { active = false; }; }, [id]);
  useEffect(() => { if (!busy) return; const timer = setInterval(() => setStage(s => Math.min(s + 1, stages.length - 1)), 4000); return () => clearInterval(timer); }, [busy]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const body = CreateCampaignRequest.safeParse({ brandId: id, goal, platform, formats, brief: brief.trim(), variantCount: count });
    if (!body.success) { setError("Add a brief of at least 5 characters, select a format, and choose 2–5 variants."); return; }
    setStage(0); setBusy(true);
    try { const result = await api.createCampaign(body.data); router.push(`/campaigns/${result.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create campaign"); }
    finally { setBusy(false); }
  }
  return <main><PageHeader title="Make your next move" description={brand ? `Create a campaign for ${brand.name}, grounded in its audience and learnings.` : "Loading brand context…"} />{error && <div className="mb-5"><ErrorState message={error} /></div>}{!brand ? !error && <LoadingState /> : <form onSubmit={submit} className="max-w-xl space-y-6 rounded-xl border border-[#E6E7ED] bg-white p-6">{process.env.NEXT_PUBLIC_USE_MOCKS === "true" && <p className="rounded-lg bg-violet-50 p-4 text-sm text-violet-900">Demo mode opens the fixed sample campaign with two reels and two posts. These settings apply to generated campaigns when the backend is enabled.</p>}<fieldset disabled={busy} className="space-y-6 disabled:opacity-70"><div className="space-y-6"><div className="space-y-2"><Label htmlFor="campaign-goal">Goal</Label><select id="campaign-goal" className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm" value={goal} onChange={e => setGoal(e.target.value)}>{Goal.options.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></div><div className="space-y-2"><Label htmlFor="campaign-platform">Platform</Label><select id="campaign-platform" className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm" value={platform} onChange={e => setPlatform(e.target.value)}>{Platform.options.map(value => <option key={value} value={value}>{value}</option>)}</select></div></div><fieldset><legend className="mb-2 text-sm font-medium">Formats</legend><p className="mb-3 text-xs text-[#5B6170]">Choose at least one.</p><div className="flex flex-wrap gap-3">{Format.options.map(format => <label key={format} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50"><input type="checkbox" checked={formats.includes(format)} onChange={e => setFormats(current => e.target.checked ? [...current, format] : current.filter(f => f !== format))} />{format}</label>)}</div></fieldset><div className="space-y-2"><Label htmlFor="campaign-brief">Creative brief</Label><Textarea id="campaign-brief" aria-describedby="campaign-brief-help" required minLength={5} rows={5} value={brief} onChange={e => setBrief(e.target.value)} placeholder="What should this campaign achieve? What should your audience feel or do?" /><p id="campaign-brief-help" className="text-xs text-[#5B6170]">One or two sentences: the outcome you want and who it is for.</p></div><div className="space-y-2"><Label htmlFor="variant-count">Number of variants</Label><Input id="variant-count" type="number" min={2} max={5} required value={count} onChange={e => setCount(Number(e.target.value))} className="min-h-11" /></div><Button type="submit" className="min-h-11 w-full">Create & test campaign</Button></fieldset>{busy && <div role="status" aria-live="polite" className="flex flex-col items-center rounded-xl border border-[#E6E7ED] bg-[#F3EEFF] p-6 text-center"><LoopRing spinning value={(stage + 1) / stages.length} size={72} label={`Stage ${stage + 1} of ${stages.length}`} /><p className="mt-3 text-sm font-semibold text-[#20232D]">{stages[stage]}</p><ol className="mt-3 flex flex-wrap justify-center gap-2 text-xs">{stages.map((label, i) => <li key={label} aria-current={i === stage ? "step" : undefined} className={`rounded-full px-3 py-1 ${i < stage ? "bg-white text-[#6D28D9]" : i === stage ? "bg-[#7C3AED] text-white" : "bg-white text-[#5B6170]"}`}><span className="inline-flex items-center gap-1">{i < stage && <svg className="lw-check size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}{label.replace("…", "")}</span></li>)}</ol><p className="mt-3 text-xs text-[#5B6170]">Indicative stages; completion is confirmed by the server.</p></div>}</form>}</main>;
}
