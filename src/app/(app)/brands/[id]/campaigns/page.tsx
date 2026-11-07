"use client";

import { formatMoney, formatMultiple, formatScore } from "@/components/app/format";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { TCampaign, TCostValue } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/page-states";
import { NewCampaignButton } from "@/components/app/brand-sidebar";
import { StatusBadge, STATUS_LABEL } from "@/components/app/status-badge";
import { generatedCampaigns } from "@/components/app/loop-progress";
import { rankVariants } from "@/components/app/campaign-tools";
import { calculateRoi } from "@/components/app/roi";

type Filter = "all" | TCampaign["status"];
const FILTERS: Filter[] = ["all", "ready", "published", "generating", "failed"];
const eur = (v: number) => formatMoney(v);
function roi(c: TCampaign, cv: TCostValue | null) {
  if (!cv) return null;
  try { return calculateRoi({ campaigns: 1, minutesSavedPerCampaign: cv.assumptions.minutesSavedPerCampaign, hourlyRate: cv.assumptions.hourlyRateEur, aiCostPerCampaign: c.aiCost.costEur, planPrice: 0 }).roiMultiple; } catch { return null; }
}

export default function CampaignsPage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [campaigns, setCampaigns] = useState<TCampaign[]>([]); const [costValue, setCostValue] = useState<TCostValue | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [list, dash] = await Promise.all([api.listCampaigns(id), api.getDashboard(id).catch(() => null)]); setCampaigns(generatedCampaigns(list)); setCostValue(dash?.costValue ?? null); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load campaigns"); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  const shown = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);
  const winner = (c: TCampaign) => rankVariants(c.variants)[0];
  const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB");
  return <main>
    <PageHeader title="Campaigns" description="Every campaign you created, its status and the variant the focus group recommends." action={campaigns.length > 0 && <NewCampaignButton brandId={id} />} />
    {error && <ErrorState message={error} onRetry={() => void load()} />}
    {loading ? <LoadingState label="Loading campaigns…" /> : !error && (campaigns.length === 0
      ? <EmptyState title="No campaigns yet" description="Describe one idea. AI writes variants and your audience focus group scores them before you post." action={<Button className="min-h-11" nativeButton={false} render={<Link href={`/brands/${encodeURIComponent(id)}/campaigns/new`} />}>Create your first campaign</Button>} />
      : <div className="space-y-4">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">{FILTERS.map(f => {
          const count = f === "all" ? campaigns.length : campaigns.filter(c => c.status === f).length;
          return <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${filter === f ? "border-[#7C3AED] bg-[#F3EEFF] text-[#6D28D9]" : "border-[#E6E7ED] bg-white text-[#5B6170] hover:border-[#A78BFA]"}`}>{f === "all" ? "All" : STATUS_LABEL(f)}<span className="tabular-nums text-xs">{count}</span></button>;
        })}</div>
        {shown.length === 0 ? <EmptyState title={`No ${STATUS_LABEL(filter as TCampaign["status"]).toLowerCase()} campaigns`} description="Try another status or show all campaigns." action={<Button variant="outline" className="min-h-11" onClick={() => setFilter("all")}>Show all</Button>} />
          : <>
            <div className="hidden overflow-x-auto rounded-xl border border-[#E6E7ED] bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E6E7ED] text-xs text-[#5B6170]"><tr>{["Brief", "Formats", "Status", "Recommended", "AI cost · ROI", "Created"].map(h => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}<th scope="col"><span className="sr-only">Open</span></th></tr></thead>
                <tbody className="divide-y divide-[#E6E7ED]">{shown.map(c => {
                  const top = winner(c); const multiple = roi(c, costValue);
                  return <tr key={c.id} onClick={() => router.push(`/campaigns/${c.id}`)} className="cursor-pointer hover:bg-[#F7F8FA]">
                    <td className="max-w-xs px-4 py-3"><Link href={`/campaigns/${c.id}`} onClick={e => e.stopPropagation()} className="line-clamp-2 font-medium text-[#20232D] hover:text-[#6D28D9]">{c.brief}</Link></td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5B6170]">{c.formats.join(" + ")}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="max-w-[14rem] px-4 py-3">{top ? <><p className="line-clamp-1 text-[#20232D]">{top.angle}</p><p className="text-xs text-[#5B6170]">Panel {formatScore(top.panelScore)}/100</p></> : <span className="text-[#5B6170]">—</span>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5B6170]">{eur(c.aiCost.costEur)}{multiple !== null && <> · <strong className="font-semibold text-[#6D28D9]">{formatMultiple(multiple)}</strong></>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5B6170]">{date(c.createdAt)}</td>
                    <td className="pr-4"><ChevronRight className="size-4 text-[#5B6170]" aria-hidden="true" /></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            <ul className="space-y-3 md:hidden">{shown.map(c => { const top = winner(c); const multiple = roi(c, costValue); return <li key={c.id}><Link href={`/campaigns/${c.id}`} className="block rounded-xl border border-[#E6E7ED] bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="line-clamp-2 text-sm font-medium text-[#20232D]">{c.brief}</p><StatusBadge status={c.status} /></div>{top && <p className="mt-2 line-clamp-1 text-xs text-[#5B6170]">Recommended: {top.angle} · panel {formatScore(top.panelScore)}/100</p>}<p className="mt-2 text-xs text-[#5B6170]">{c.formats.join(" + ")} · {eur(c.aiCost.costEur)}{multiple !== null && ` · ROI ${formatMultiple(multiple)}`} · {date(c.createdAt)}</p></Link></li>; })}</ul>
          </>}
        <p className="text-xs text-[#5B6170]">ROI is an estimate of time saved against AI cost, not revenue. Imported post history is in Analytics.</p>
      </div>)}
  </main>;
}
