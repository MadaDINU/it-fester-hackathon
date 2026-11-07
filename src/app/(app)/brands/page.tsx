"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Camera as Instagram, RefreshCw, Users } from "lucide-react";
import type { TBrand } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { NewBrandButton } from "@/components/app/app-shell";

export default function BrandsPage() {
  const [brands, setBrands] = useState<TBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setBrands(await api.listBrands()); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load brands"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function refresh(id: string) {
    setRefreshing(id); setError("");
    try { await api.fromInstagram(); setBrands(await api.listBrands()); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to refresh brand"); }
    finally { setRefreshing(null); }
  }
  return <main><PageHeader title="Your brands." description="A clearer picture of your audience. A stronger starting point for every campaign." action={<NewBrandButton />} />
    {error && <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div>}
    {loading ? <LoadingState label="Loading your brands…" /> : brands.length === 0 ? !error && <EmptyState title="Your growth story starts here" description="Connect your first brand to understand its audience and start creating with purpose." action={<NewBrandButton />} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{brands.map(brand => <Card key={brand.id} className="border border-slate-200 shadow-none ring-0"><CardHeader className="p-6 pb-3"><div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Instagram aria-hidden="true" /></div><CardTitle className="text-xl"><Link className="inline-flex items-center gap-2 hover:text-violet-700" href={`/brands/${brand.id}`}>{brand.name}<ArrowUpRight className="size-4" aria-hidden="true" /></Link></CardTitle><p className="text-sm text-slate-500">{brand.instagram ? `@${brand.instagram.username}` : "Website brand"}</p></CardHeader><CardContent className="space-y-5 p-6 pt-0"><p className="text-sm leading-relaxed text-slate-600">{brand.dna.niche}</p><div className="flex items-center gap-2 text-sm"><Users className="size-4 text-violet-600" aria-hidden="true" /><strong>{brand.instagram ? brand.instagram.followers.toLocaleString("en-US") : "—"}</strong><span className="text-slate-500">followers</span></div><p className="border-t pt-4 text-xs text-slate-500">{brand.audience ? `Audience updated ${new Date(brand.audience.updatedAt).toLocaleDateString("en-GB")}` : "Audience data not available yet"}</p>{brand.instagram && <Button className="min-h-11 w-full" variant="outline" disabled={refreshing !== null} onClick={() => void refresh(brand.id)}><RefreshCw aria-hidden="true" className={refreshing === brand.id ? "animate-spin motion-reduce:animate-none" : ""} />{refreshing === brand.id ? "Refreshing…" : "Refresh data"}</Button>}</CardContent></Card>)}</div>}
  </main>;
}
