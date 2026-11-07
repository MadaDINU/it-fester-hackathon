"use client";

import { useEffect, useState } from "react";
import type { TBrand, TCostValue } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { AppShell, NewBrandButton } from "@/components/app/app-shell";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { RoiCalculator } from "@/components/app/roi-panels";

export default function LandingPage() {
  const [brands, setBrands] = useState<TBrand[]>([]); const [brandId, setBrandId] = useState(""); const [costValue, setCostValue] = useState<TCostValue | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; api.listBrands().then(result => { if (!active) return; setBrands(result); setBrandId(result[0]?.id ?? ""); setLoading(false); }).catch(e => { if (active) { setError(e instanceof Error ? e.message : "Unable to load brands"); setLoading(false); } }); return () => { active = false; }; }, []);
  useEffect(() => { if (!brandId) return; let active = true; setLoading(true); setError(""); setCostValue(null); api.getDashboard(brandId).then(result => { if (active) setCostValue(result.costValue); }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load cost assumptions"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [brandId]);
  return <AppShell><main><PageHeader title="Your next campaign. A little wiser." description="Explore the value of a growth team that learns from every post. Start with your brand’s cost assumptions and adjust the calculator." action={<NewBrandButton />} />{process.env.NEXT_PUBLIC_USE_MOCKS === "true" && <p className="mb-6 text-sm text-violet-800">Demo calculator uses illustrative seeded costs; these are not measured live results.</p>}{brands.length > 0 && <div className="mb-6 max-w-md"><label htmlFor="roi-brand" className="mb-2 block text-sm font-medium">Cost assumptions from</label><select id="roi-brand" value={brandId} onChange={e => setBrandId(e.target.value)} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm">{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>}{error && <ErrorState message={error} />}{loading ? <LoadingState label="Loading cost assumptions…" /> : costValue ? <RoiCalculator key={brandId} value={costValue} /> : !error && <EmptyState title="Start with a brand" description="Connect a brand to load real cost assumptions. No financial totals are invented when data is missing." action={<NewBrandButton />} />}</main></AppShell>;
}
