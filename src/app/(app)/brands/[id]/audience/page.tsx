"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { TBrandWithContext } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { AudienceDemographics, AudienceWhatWorks, BrandDnaPanel, PersonaCards } from "@/components/app/intelligence-panels";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { NewCampaignButton } from "@/components/app/brand-sidebar";
import { InfoTip } from "@/components/app/info-tip";
import { audienceSeenKey } from "@/components/app/loop-progress";

function Section({ id, title, delay, children }: { id: string; title: string; delay: number; children: ReactNode }) {
  return <section aria-labelledby={id} className="lw-rise" style={{ "--lw-delay": `${delay}ms` } as CSSProperties}><h2 id={id} className="mb-4 text-xl font-semibold tracking-tight text-[#20232D]">{title}</h2>{children}</section>;
}

export default function AudiencePage() {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<TBrandWithContext | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setBrand(await api.getBrand(id)); try { window.localStorage.setItem(audienceSeenKey(id), "1"); } catch { /* storage blocked */ } }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load audience"); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  return <main>
    <PageHeader title="Audience" description={brand ? `Who follows ${brand.name}, what they respond to and when they show up.` : "Who follows you, what they respond to and when they show up."} action={<NewCampaignButton brandId={id} />} />
    {error && <ErrorState message={error} onRetry={() => void load()} />}
    {loading ? <LoadingState label="Loading audience…" /> : brand && <div className="space-y-8">
      <Section id="personas-title" title="Meet your audience" delay={0}>{brand.personas.length ? <PersonaCards personas={brand.personas} /> : <EmptyState title="No personas yet" description="Personas appear after Loopwise analyses your Instagram history." />}</Section>
      <Section id="demographics-title" title="Demographics" delay={60}><AudienceDemographics audience={brand.audience} /></Section>
      <Section id="works-title" title="What works" delay={120}><AudienceWhatWorks audience={brand.audience} erTip={<InfoTip id="er" />} /></Section>
      <Section id="dna-title" title="Your brand" delay={180}><BrandDnaPanel dna={brand.dna} /></Section>
    </div>}
  </main>;
}
