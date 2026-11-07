"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, ChevronsUpDown, CircleHelp, LayoutDashboard, Megaphone, Menu, MessageCircle, Plus, Users } from "lucide-react";
import type { TBrand } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GLOSSARY } from "./info-tip";

export type BrandSection = "overview" | "audience" | "campaigns" | "analytics" | "community";
const SECTIONS: { key: BrandSection; label: string; path: string; icon: typeof Users }[] = [
  { key: "overview", label: "Overview", path: "", icon: LayoutDashboard },
  { key: "audience", label: "Audience", path: "/audience", icon: Users },
  { key: "campaigns", label: "Campaigns", path: "/campaigns", icon: Megaphone },
  { key: "analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
  { key: "community", label: "Community", path: "/community", icon: MessageCircle },
];
const LOOP_HELP = [
  ["Import account", "Loopwise reads your Instagram posts and results."],
  ["Review audience", "See who follows you and what they respond to."],
  ["Create campaign", "AI writes several ideas and an audience focus group scores them."],
  ["Publish", "Post the recommended idea to the test account."],
  ["Simulate", "Generate results for the test post to close the loop in a demo."],
  ["Run learning loop", "The model compares prediction and result and keeps what it learned."],
];

function sectionFrom(pathname: string, base: string): BrandSection {
  const rest = pathname.slice(base.length);
  return SECTIONS.find(s => s.path && rest.startsWith(s.path))?.key ?? "overview";
}

function BrandSwitcher({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [brands, setBrands] = useState<Pick<TBrand, "id" | "name">[]>([]);
  useEffect(() => {
    let active = true;
    api.listBrands().then(async list => list.some(b => b.id === brandId) ? list : [...list, await api.getBrand(brandId)]).then(list => { if (active) setBrands(list); }).catch(() => {});
    return () => { active = false; };
  }, [brandId]);
  const current = brands.find(b => b.id === brandId)?.name ?? "Brand";
  return <DropdownMenu>
    <DropdownMenuTrigger aria-label={`Switch brand, current: ${current}`} className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-[#E6E7ED] bg-white px-3 text-left hover:border-[#A78BFA] focus-visible:outline-2 focus-visible:outline-[#7C3AED]">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-[#7C3AED] text-xs font-semibold text-white">{current.trim().charAt(0).toUpperCase()}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs text-[#5B6170]">Brand</span><span className="block truncate text-sm font-semibold text-[#20232D]">{current}</span></span>
      <ChevronsUpDown className="size-4 shrink-0 text-[#5B6170]" aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="min-w-56">
      {brands.map(b => <DropdownMenuItem key={b.id} className="min-h-10 px-2" onClick={() => router.push(`/brands/${b.id}`)}>{b.name}{b.id === brandId && <span className="ml-auto text-xs text-[#6D28D9]">Current</span>}</DropdownMenuItem>)}
      <DropdownMenuSeparator />
      <DropdownMenuItem className="min-h-10 px-2" onClick={() => router.push("/brands/new")}><Plus aria-hidden="true" />Connect a brand</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto bg-white p-6 sm:max-w-lg">
      <DialogTitle className="text-lg font-semibold text-[#20232D]">How Loopwise works</DialogTitle>
      <DialogDescription className="text-sm text-[#5B6170]">Each campaign goes around the same loop. Overview shows where you are and the next step.</DialogDescription>
      <ol className="space-y-3">{LOOP_HELP.map(([step, text], i) => <li key={step} className="flex gap-3 text-sm"><span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-[#F3EEFF] text-xs font-semibold text-[#6D28D9]">{i + 1}</span><span><strong className="font-semibold text-[#20232D]">{step}</strong> <span className="text-[#5B6170]">{text}</span></span></li>)}</ol>
      <h3 className="pt-2 text-sm font-semibold text-[#20232D]">Terms</h3>
      <dl className="space-y-3 text-sm">{Object.values(GLOSSARY).map(({ term, text }) => <div key={term}><dt className="font-medium text-[#20232D]">{term}</dt><dd className="text-[#5B6170]">{text}</dd></div>)}</dl>
    </DialogContent>
  </Dialog>;
}

function SidebarNav({ brandId, active, onHelp }: { brandId: string; active: BrandSection; onHelp: () => void }) {
  const base = `/brands/${encodeURIComponent(brandId)}`;
  return <div className="flex h-full flex-col gap-4">
    <BrandSwitcher brandId={brandId} />
    <nav aria-label="Brand sections"><ul className="space-y-1">{SECTIONS.map(({ key, label, path, icon: Icon }) => {
      const current = key === active;
      return <li key={key}><Link href={base + path} aria-current={current ? "page" : undefined} className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors motion-reduce:transition-none ${current ? "bg-[#F3EEFF] text-[#6D28D9]" : "text-[#5B6170] hover:bg-[#F7F8FA] hover:text-[#20232D]"}`}>
        {current && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#7C3AED]" />}
        <Icon className="size-4" aria-hidden="true" />{label}
      </Link></li>;
    })}</ul></nav>
    <button type="button" onClick={onHelp} className="mt-auto flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#5B6170] hover:bg-[#F7F8FA] hover:text-[#20232D]"><CircleHelp className="size-4" aria-hidden="true" />Help</button>
  </div>;
}

// Brand pages: a fixed sidebar on desktop, a drawer behind a menu bar on mobile.
export function BrandFrame({ brandId, section, children }: { brandId: string; section?: BrandSection; children: ReactNode }) {
  const pathname = usePathname();
  const active = section ?? sectionFrom(pathname, `/brands/${encodeURIComponent(brandId)}`);
  const [drawer, setDrawer] = useState(false); const [help, setHelp] = useState(false);
  useEffect(() => { setDrawer(false); }, [pathname]);
  const openHelp = () => { setDrawer(false); setHelp(true); };
  return <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-8">
    <aside className="hidden h-[min(640px,calc(100dvh-48px))] rounded-xl border border-[#E6E7ED] bg-white p-3 lg:sticky lg:top-6 lg:block"><SidebarNav brandId={brandId} active={active} onHelp={openHelp} /></aside>
    <div className="mb-6 flex items-center gap-3 lg:hidden">
      <Button variant="outline" className="min-h-11" aria-label="Open brand menu" onClick={() => setDrawer(true)}><Menu aria-hidden="true" />Menu</Button>
      <p className="truncate text-sm font-semibold text-[#20232D]">{SECTIONS.find(s => s.key === active)?.label}</p>
    </div>
    <Dialog open={drawer} onOpenChange={setDrawer}>
      <DialogContent className="top-0 left-0 h-dvh w-[288px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none bg-white p-4 pt-14 sm:max-w-[288px] motion-reduce:animate-none">
        <DialogTitle className="sr-only">Brand menu</DialogTitle>
        <SidebarNav brandId={brandId} active={active} onHelp={openHelp} />
      </DialogContent>
    </Dialog>
    <HelpDialog open={help} onOpenChange={setHelp} />
    <div className="min-w-0">{children}</div>
  </div>;
}

export function NewCampaignButton({ brandId, primary = true }: { brandId: string; primary?: boolean }) {
  return <Button variant={primary ? "default" : "outline"} className="min-h-11" nativeButton={false} render={<Link href={`/brands/${encodeURIComponent(brandId)}/campaigns/new`} />}><Plus aria-hidden="true" />New campaign</Button>;
}
