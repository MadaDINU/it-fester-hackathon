"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, BarChart3, HeartHandshake, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import type { TBrand, TCostValue } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { AppShell, NewBrandButton } from "@/components/app/app-shell";
import { LoopRing } from "@/components/app/loop-ring";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/page-states";
import { RoiCalculator } from "@/components/app/roi-panels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const agents = [
  { number: "01", name: "Analyst", icon: BarChart3, action: "Read the signals", detail: "Bring your account history and audience insights into focus." },
  { number: "02", name: "Audience", icon: HeartHandshake, action: "Understand people", detail: "Turn audience data into clear, grounded personas." },
  { number: "03", name: "Creator", icon: Sparkles, action: "Make something", detail: "Develop posts and reel scripts for your specific audience." },
  { number: "04", name: "Critic", icon: Lightbulb, action: "Test before posting", detail: "Compare ideas with a focus group and a performance model." },
  { number: "05", name: "Community", icon: MessageCircle, action: "Keep listening", detail: "Learn from conversations and find ideas that build loyalty." },
] as const;
const plans = [
  { name: "Starter", price: 19, accounts: "1 account", campaigns: "20 campaigns / month" },
  { name: "Growth", price: 49, accounts: "3 accounts", campaigns: "40 campaigns / month" },
  { name: "Agency", price: 149, accounts: "10+ accounts", campaigns: "150 campaigns / month" },
] as const;

export default function LandingPage() {
  const [brands, setBrands] = useState<TBrand[]>([]); const [brandId, setBrandId] = useState(""); const [costValue, setCostValue] = useState<TCostValue | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; api.listBrands().then(result => { if (!active) return; setBrands(result); setBrandId(result[0]?.id ?? ""); setLoading(false); }).catch(e => { if (active) { setError(e instanceof Error ? e.message : "Unable to load brands"); setLoading(false); } }); return () => { active = false; }; }, []);
  useEffect(() => { if (!brandId) return; let active = true; setLoading(true); setError(""); setCostValue(null); api.getDashboard(brandId).then(result => { if (active) setCostValue(result.costValue); }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load cost assumptions"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [brandId]);
  return <AppShell><main>
    <section className="grid items-center gap-10 pb-16 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-10">
      <div className="lw-rise">
        <p className="mb-4 text-sm font-medium text-[#6D28D9]">Your AI growth team for social media</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-[#20232D] sm:text-5xl xl:text-6xl">Predict before you post. <span className="text-[#5B6170]">Learn after you post.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5B6170] sm:text-lg">Understand your audience, test ideas before you post, and make every campaign a little wiser.</p>
        <div className="mt-8 flex flex-wrap gap-3"><NewBrandButton /><Button variant="outline" className="min-h-11" nativeButton={false} render={<a href="#how-it-works" />}>See how it works <ArrowDown aria-hidden="true" /></Button></div>
        <p className="mt-5 text-xs leading-relaxed text-[#5B6170]">Built for small businesses and creators. Predictions and time savings are estimates.</p>
      </div>
      <div className="flex flex-col items-center gap-8 sm:flex-row lg:flex-col xl:flex-row">
        <LoopRing value={1} size={240} stroke={18} label="The Loopwise loop" className="max-w-full" />
        <ol className="w-full max-w-xs space-y-3">{["Import real account data", "Understand the audience", "Create and test ideas", "Measure, learn and engage"].map((step, index) => <li key={step} className="lw-rise flex items-center gap-3 text-sm font-medium text-[#20232D]" style={{ "--lw-delay": `${300 + index * 120}ms` } as CSSProperties}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F3EEFF] text-xs font-semibold text-[#6D28D9]">{index + 1}</span>{step}</li>)}</ol>
      </div>
    </section>
    <section className="grid gap-6 border-t border-slate-200 py-16 lg:grid-cols-2"><div><p className="text-xs font-semibold text-violet-700">The problem</p><h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Posting more should not mean guessing more.</h2></div><p className="max-w-xl text-base leading-relaxed text-slate-600">Small teams compete for attention without the time or budget for an agency. Generic content cannot tell you who is listening, why an idea works, or what to try next. Loopwise brings those questions into one repeatable workflow.</p></section>
    <section id="how-it-works" className="border-t border-slate-200 py-16"><p className="text-xs font-semibold text-violet-700">Five agents. One learning loop.</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A team that learns with you.</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{agents.map(agent => <Card key={agent.name} className="border bg-slate-50 shadow-none ring-0"><CardContent className="flex h-full flex-col p-5"><div className="flex items-center justify-between"><agent.icon className="size-6 text-violet-700" aria-hidden="true" /><span className="font-mono text-xs text-slate-500">{agent.number}</span></div><p className="mt-8 text-xs font-semibold uppercase tracking-wider text-violet-700">{agent.name}</p><h3 className="mt-2 text-lg font-semibold">{agent.action}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{agent.detail}</p></CardContent></Card>)}</div></section>
    <section id="calculator" className="border-t border-slate-200 py-16"><p className="mb-5 text-xs font-semibold text-violet-700">Cost vs value</p>{process.env.NEXT_PUBLIC_USE_MOCKS === "true" && <p className="mb-6 text-sm text-violet-800">Demo calculator uses illustrative seeded costs; these are not measured live results.</p>}{brands.length > 0 && <div className="mb-6 max-w-md"><label htmlFor="roi-brand" className="mb-2 block text-sm font-medium">Cost assumptions from</label><select id="roi-brand" value={brandId} onChange={e => setBrandId(e.target.value)} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm">{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>}{error && <ErrorState message={error} />}{loading ? <LoadingState label="Loading cost assumptions…" /> : costValue ? <RoiCalculator key={brandId} value={costValue} /> : !error && <EmptyState title="Start with a brand" description="Connect a brand to load cost assumptions for the calculator." action={<NewBrandButton />} />}</section>
    <section className="border-t border-slate-200 py-16"><p className="text-xs font-semibold text-violet-700">Plans</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Room to grow, at your pace.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{plans.map(plan => <Card key={plan.name} className="border shadow-none ring-0"><CardContent className="flex h-full flex-col p-6"><h3 className="text-lg font-semibold">{plan.name}</h3><p className="mt-4 text-4xl font-semibold tracking-tight">€{plan.price}<span className="text-sm font-normal text-slate-500"> / month</span></p><p className="mt-5 text-sm text-slate-600">{plan.accounts}</p><p className="mt-2 text-sm text-slate-600">{plan.campaigns}</p></CardContent></Card>)}</div><p className="mt-4 text-xs text-slate-500">Planned tiers for the hackathon concept; availability and billing are not enabled in this demo.</p></section>
    <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-violet-700 p-7 text-white sm:p-10"><div><h2 className="text-2xl font-semibold tracking-tight">Ready to make your next move?</h2><p className="mt-2 text-sm text-violet-100">Start with the brand you know. Learn what your audience loves.</p></div><Button variant="outline" className="min-h-11 bg-white px-5 text-violet-900 hover:bg-violet-50" nativeButton={false} render={<Link href="/brands/new" />}>Connect a brand <ArrowRight aria-hidden="true" /></Button></section>
  </main></AppShell>;
}
