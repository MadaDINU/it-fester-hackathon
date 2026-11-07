"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Camera as Instagram, ArrowRight, ShieldCheck } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader, ErrorState } from "@/components/app/page-states";
import { StagedLoader } from "@/components/app/staged-loader";
import { websiteRequest } from "@/components/app/onboarding";

const stages = ["Importing 50 posts & reels…", "Reading audience demographics…", "Listening to comments…", "Building personas…", "Training the model…"];
const websiteStages = ["Reading the business website…", "Understanding your brand…", "Building audience personas…"];

export default function ConnectBrandPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<"instagram" | "website" | null>(null);
  const [error, setError] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  async function connectInstagram() {
    setBusy("instagram"); setError("");
    try { const brand = await api.fromInstagram({ limit: 50 }); router.push(`/brands/${brand.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to connect Instagram"); }
    finally { setBusy(null); }
  }
  async function analyze(event: FormEvent) {
    event.preventDefault(); setError("");
    const parsed = (() => { try { return websiteRequest(name, url, description); } catch { return null; } })();
    if (!parsed) { setError("Enter a brand name and a valid website URL, or add a description."); return; }
    setBusy("website");
    try { const brand = await api.analyzeBrand(parsed); router.push(`/brands/${brand.id}`); }
    catch (e) { if (e instanceof ApiClientError && e.status === 422) setShowDescription(true); setError(e instanceof Error ? e.message : "Unable to analyse website"); }
    finally { setBusy(null); }
  }
  return <main>
    <PageHeader title="Start with your brand" description="Give your growth team the context it needs. Connect an Instagram account, or introduce your business with a website." />
    {process.env.NEXT_PUBLIC_USE_MOCKS === "true" && <p className="mb-6 rounded-lg bg-violet-50 p-4 text-sm text-violet-900">Demo mode: both options open the sample brand. No Instagram account is connected and no website is fetched.</p>}
    {error && <div className="mb-6"><ErrorState message={error} /></div>}
    {busy && <div className="mb-6"><StagedLoader stages={busy === "instagram" ? stages : websiteStages} /></div>}
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card className="border border-violet-200 bg-violet-50/40 shadow-none ring-0"><CardHeader className="p-6 pb-0"><Instagram aria-hidden="true" className="mb-5 size-9 text-violet-600" /><CardTitle className="text-2xl font-semibold">Your audience is already talking</CardTitle><CardDescription className="mt-2 leading-relaxed">Learn from real posts, reels, demographics and comments. Turn your account history into your next creative advantage.</CardDescription></CardHeader><CardContent className="space-y-6 p-6"><ul className="space-y-3 text-sm text-slate-600">{["50 recent posts and reels", "Audience intelligence and grounded personas", "A performance model trained on your history"].map(text => <li key={text} className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-violet-600" aria-hidden="true" />{text}</li>)}</ul><Button disabled={busy !== null} onClick={connectInstagram} className="min-h-11 w-full bg-[#7C3AED] text-white hover:bg-[#6D28D9]">Connect Instagram (@ironcladwind)<ArrowRight aria-hidden="true" /></Button><p className="text-xs text-slate-600">Reads data using the server-configured account. This action does not publish content.</p></CardContent></Card>
      <Card className="border shadow-none ring-0"><CardHeader className="p-6 pb-0"><Globe2 aria-hidden="true" className="mb-5 size-8 text-slate-500" /><CardTitle>Analyse a business website</CardTitle><CardDescription className="mt-2">No account history yet? Start with your business and its audience.</CardDescription></CardHeader><CardContent className="p-6"><form onSubmit={analyze} className="space-y-5"><div className="space-y-2"><Label htmlFor="brand-name">Brand name</Label><Input id="brand-name" required maxLength={200} value={name} onChange={e => setName(e.target.value)} disabled={busy !== null} className="min-h-11" placeholder="Your business name" /></div><div className="space-y-2"><Label htmlFor="brand-url">Website URL</Label><Input id="brand-url" type="url" required={!showDescription} value={url} onChange={e => setUrl(e.target.value)} disabled={busy !== null} className="min-h-11" placeholder="https://your-business.com" /></div>{showDescription ? <div className="space-y-2"><Label htmlFor="brand-description">Business description</Label><Textarea id="brand-description" value={description} onChange={e => setDescription(e.target.value)} disabled={busy !== null} placeholder="What do you offer, and who do you serve?" /><p className="text-xs text-slate-500">If your website cannot be reached, clear its URL and describe your business instead.</p></div> : <Button type="button" variant="link" className="min-h-11 px-0" onClick={() => setShowDescription(true)}>Add a description instead</Button>}<Button type="submit" variant="outline" disabled={busy !== null} className="min-h-11 w-full">Analyse business<ArrowRight aria-hidden="true" /></Button></form></CardContent></Card>
    </div>
  </main>;
}
