"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BarChart3, ChevronRight, ChevronsUpDown, CircleHelp, FlaskConical, Home, Megaphone, Menu, MessageCircle, PanelLeftClose, PanelLeftOpen, Plus, Users } from "lucide-react";
import type { TBrand } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { copy } from "./copy";
import { NotificationsBell, ProfileMenu, ThemeToggle } from "./shell-topbar";

type Section = "home" | "audience" | "campaigns" | "analytics" | "community";
type ShellBrand = Pick<TBrand, "id" | "name" | "instagram">;
const SECTIONS: { key: Section; label: string; path: string; icon: typeof Home }[] = [
  { key: "home", label: copy.nav.home, path: "", icon: Home },
  { key: "audience", label: copy.nav.audience, path: "/audience", icon: Users },
  { key: "campaigns", label: copy.nav.campaigns, path: "/campaigns", icon: Megaphone },
  { key: "analytics", label: copy.nav.analytics, path: "/analytics", icon: BarChart3 },
  { key: "community", label: copy.nav.community, path: "/community", icon: MessageCircle },
];
const LAST_BRAND = "loopwise:last-brand", COLLAPSED = "loopwise:sidebar-collapsed";
const store = { get: (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* storage blocked */ } } };

// Title and section come from the URL, so the top bar is right on first paint.
function pageInfo(pathname: string): { title: string; section: Section | null; brandInUrl: string | null; sub: boolean } {
  if (pathname.startsWith("/campaigns/")) return { title: copy.nav.studio, section: "campaigns", brandInUrl: null, sub: true };
  const m = pathname.match(/^\/brands\/([^/]+)(\/.*)?$/);
  if (!m) return { title: copy.nav.brands, section: null, brandInUrl: null, sub: false };
  if (m[1] === "new") return { title: copy.nav.newBrand, section: null, brandInUrl: null, sub: false };
  const rest = m[2] ?? "";
  if (rest.startsWith("/campaigns/new")) return { title: copy.nav.newCampaign, section: "campaigns", brandInUrl: decodeURIComponent(m[1]), sub: true };
  const section = SECTIONS.find(s => s.path && rest.startsWith(s.path)) ?? SECTIONS[0];
  return { title: section.label, section: section.key, brandInUrl: decodeURIComponent(m[1]), sub: false };
}

// Pages outside /brands/[id] (Studio) tell the shell which brand they belong to, plus an optional last breadcrumb.
type PageMeta = { brandId: string | null; crumb: string | null };
const ShellContext = createContext<(page: PageMeta) => void>(() => {});
export function useShellPage(brandId: string | null | undefined, crumb?: string | null) {
  const set = useContext(ShellContext);
  useEffect(() => { set({ brandId: brandId ?? null, crumb: crumb ?? null }); return () => set({ brandId: null, crumb: null }); }, [set, brandId, crumb]);
}

function Avatar({ name, size = "size-9" }: { name: string; size?: string }) {
  return <span aria-hidden="true" className={`grid ${size} shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white`}>{name.trim().charAt(0).toUpperCase() || "?"}</span>;
}

function BrandSwitcher({ brands, current, collapsed }: { brands: ShellBrand[]; current: ShellBrand | null; collapsed: boolean }) {
  const router = useRouter();
  const name = current?.name ?? copy.brandSwitcher.none;
  return <DropdownMenu>
    <DropdownMenuTrigger aria-label={copy.brandSwitcher.label(name)} className={`flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 text-left hover:border-primary-light active:scale-[0.98] ${collapsed ? "justify-center p-1.5" : "p-3"}`}>
      <Avatar name={name} size={collapsed ? "size-9" : "size-10"} />
      {!collapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-fg">{name}</span><span className="block truncate text-xs text-fg-muted">{current ? (current.instagram ? copy.brandSwitcher.followers(current.instagram.followers) : copy.brandSwitcher.noInstagram) : copy.brandSwitcher.noneHint}</span></span><ChevronsUpDown className="size-4 shrink-0 text-fg-muted" aria-hidden="true" /></>}
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-64 p-1">
      {brands.map(b => <DropdownMenuItem key={b.id} className="min-h-11 gap-3 px-2" onClick={() => router.push(`/brands/${b.id}`)}><Avatar name={b.name} size="size-7" /><span className="min-w-0 flex-1 truncate">{b.name}</span>{b.id === current?.id && <span className="text-xs text-primary-ink">{copy.brandSwitcher.current}</span>}</DropdownMenuItem>)}
      {brands.length > 0 && <DropdownMenuSeparator />}
      <DropdownMenuItem className="min-h-11 gap-3 px-2" onClick={() => router.push("/brands/new")}><Plus aria-hidden="true" />{copy.nav.newBrand}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function SidebarBody({ brands, current, section, collapsed, onHelp, onToggle }: { brands: ShellBrand[]; current: ShellBrand | null; section: Section | null; collapsed: boolean; onHelp: () => void; onToggle?: () => void }) {
  const base = current ? `/brands/${encodeURIComponent(current.id)}` : null;
  const item = `relative flex min-h-11 items-center gap-3 rounded-lg text-sm font-semibold active:scale-[0.98] ${collapsed ? "justify-center px-0" : "px-3"}`;
  return <div className="flex h-full flex-col gap-5">
    <Link href="/brands" className={`flex items-center gap-2 rounded-lg text-lg font-bold tracking-tight text-fg ${collapsed ? "justify-center" : "px-1"}`} aria-label="Loopwise">
      <Image src="/brand/loopwise-logo-64.png" width={32} height={32} alt="" priority />{!collapsed && <span>Loopwise<span className="text-primary">.</span></span>}
    </Link>
    <BrandSwitcher brands={brands} current={current} collapsed={collapsed} />
    <nav aria-label={copy.nav.label}><ul className="space-y-1">{SECTIONS.map(({ key, label, path, icon: Icon }) => {
      const active = key === section;
      return <li key={key}>{base ? <Link href={base + path} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined} className={`${item} ${active ? "bg-primary-soft text-primary-ink" : "text-fg-muted hover:bg-surface-2 hover:text-fg"}`}>
        {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />}
        <Icon className="size-5 shrink-0" aria-hidden="true" /><span className={collapsed ? "sr-only" : ""}>{label}</span>
      </Link> : <span aria-disabled="true" title={copy.brandSwitcher.noneHint} className={`${item} cursor-not-allowed text-fg-muted opacity-50`}><Icon className="size-5 shrink-0" aria-hidden="true" /><span className={collapsed ? "sr-only" : ""}>{label}</span></span>}</li>;
    })}</ul></nav>
    {base && <Button className={`min-h-11 ${collapsed ? "px-0" : "w-full"}`} nativeButton={false} aria-label={collapsed ? copy.nav.newCampaign : undefined} title={collapsed ? copy.nav.newCampaign : undefined} render={<Link href={`${base}/campaigns/new`} />}><Plus aria-hidden="true" />{!collapsed && copy.nav.newCampaign}</Button>}
    <div className="mt-auto space-y-1">
      <button type="button" onClick={onHelp} title={collapsed ? copy.nav.help : undefined} className={`${item} w-full text-fg-muted hover:bg-surface-2 hover:text-fg`}><CircleHelp className="size-5 shrink-0" aria-hidden="true" /><span className={collapsed ? "sr-only" : ""}>{copy.nav.help}</span></button>
      {onToggle && <button type="button" onClick={onToggle} aria-label={collapsed ? copy.nav.expand : copy.nav.collapse} title={collapsed ? copy.nav.expand : copy.nav.collapse} className={`${item} w-full text-fg-muted hover:bg-surface-2 hover:text-fg`}>{collapsed ? <PanelLeftOpen className="size-5" aria-hidden="true" /> : <><PanelLeftClose className="size-5" aria-hidden="true" /><span>{copy.nav.collapse}</span></>}</button>}
    </div>
  </div>;
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const terms = [copy.glossary.er, copy.glossary.predictedEr, copy.glossary.panelScore, copy.glossary.r2, copy.glossary.coldStart, copy.glossary.simulated, copy.glossary.focusGroup];
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto bg-surface p-6 sm:max-w-lg">
      <DialogTitle className="text-lg font-semibold text-fg">{copy.help.title}</DialogTitle>
      <DialogDescription className="text-sm text-fg-muted">{copy.help.description}</DialogDescription>
      <ol className="space-y-3">{copy.help.steps.map(([step, text], i) => <li key={step} className="flex gap-3 text-sm"><span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-ink">{i + 1}</span><span><strong className="font-semibold text-fg">{step}.</strong> <span className="text-fg-muted">{text}</span></span></li>)}</ol>
      <h3 className="pt-2 text-sm font-semibold text-fg">{copy.help.terms}</h3>
      <dl className="space-y-3 text-sm">{terms.map(({ term, text }) => <div key={term}><dt className="font-medium text-fg">{term}</dt><dd className="text-fg-muted">{text}</dd></div>)}</dl>
    </DialogContent>
  </Dialog>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const info = pageInfo(pathname);
  const [page, setPage] = useState<PageMeta>({ brandId: null, crumb: null });
  const [brands, setBrands] = useState<ShellBrand[]>([]);
  const [lastBrand, setLastBrand] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false); const [help, setHelp] = useState(false);
  const brandId = info.brandInUrl ?? page.brandId ?? lastBrand ?? brands[0]?.id ?? null;

  useEffect(() => { setLastBrand(store.get(LAST_BRAND)); setCollapsed(store.get(COLLAPSED) === "1"); api.listBrands().then(setBrands).catch(() => setBrands([])); }, []);
  useEffect(() => { const id = info.brandInUrl ?? page.brandId; if (id) { store.set(LAST_BRAND, id); setLastBrand(id); } }, [info.brandInUrl, page.brandId]);
  useEffect(() => { setDrawer(false); }, [pathname]);
  // A brand reached by URL but missing from the list (e.g. the fresh demo account) is fetched on its own.
  useEffect(() => {
    if (!brandId || brands.some(b => b.id === brandId)) return;
    let active = true;
    api.getBrand(brandId).then(b => { if (active) setBrands(list => list.some(x => x.id === b.id) ? list : [...list, b]); }).catch(() => {});
    return () => { active = false; };
  }, [brandId, brands]);

  const current = brands.find(b => b.id === brandId) ?? null;
  const toggle = () => setCollapsed(c => { store.set(COLLAPSED, c ? "0" : "1"); return !c; });
  const crumbs: { label: string; href?: string }[] = [];
  if (current && info.section) {
    const base = `/brands/${encodeURIComponent(current.id)}`;
    crumbs.push({ label: current.name, href: base });
    if (info.section !== "home") crumbs.push({ label: copy.nav[info.section], href: base + SECTIONS.find(s => s.key === info.section)!.path });
    if (info.sub && page.crumb) crumbs.push({ label: page.crumb });
  }

  return <ShellContext.Provider value={setPage}>
    <div className="min-h-dvh bg-background text-fg">
      <a href="#app-content" className="fixed left-4 top-[-100px] z-[60] rounded-lg border-2 border-primary bg-surface p-3 text-sm font-semibold focus:top-4">{copy.app.skip}</a>
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-surface py-4 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:block ${collapsed ? "w-[76px] px-3" : "w-[264px] px-4"}`}>
        <SidebarBody brands={brands} current={current} section={info.section} collapsed={collapsed} onHelp={() => setHelp(true)} onToggle={toggle} />
      </aside>
      <Dialog open={drawer} onOpenChange={setDrawer}>
        <DialogContent className="top-0 left-0 h-dvh w-[288px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none bg-surface p-4 pt-14 sm:max-w-[288px] motion-reduce:animate-none">
          <DialogTitle className="sr-only">{copy.nav.menuTitle}</DialogTitle>
          <SidebarBody brands={brands} current={current} section={info.section} collapsed={false} onHelp={() => { setDrawer(false); setHelp(true); }} />
        </DialogContent>
      </Dialog>
      <HelpDialog open={help} onOpenChange={setHelp} />
      <div className={`flex min-h-dvh flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"}`}>
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-1 border-b border-border bg-surface/90 px-4 backdrop-blur sm:gap-2 sm:px-6 lg:px-8">
          <button type="button" className="grid size-10 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-surface-2 lg:hidden" aria-label={copy.nav.openMenu} onClick={() => setDrawer(true)}><Menu className="size-5" aria-hidden="true" /></button>
          <div className="min-w-0 flex-1 py-2">
            {crumbs.length > 0 && <nav aria-label="Breadcrumb"><ol className="flex min-w-0 items-center gap-1 text-xs text-fg-muted">{crumbs.map((c, i) => <li key={i} className="flex min-w-0 items-center gap-1">{i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}{c.href ? <Link href={c.href} className="truncate rounded hover:text-primary-ink">{c.label}</Link> : <span aria-current="page" className="max-w-[28ch] truncate text-fg">{c.label}</span>}</li>)}</ol></nav>}
            <h1 className="truncate text-lg font-semibold tracking-tight text-fg">{info.title}</h1>
          </div>
          <NotificationsBell brandId={brandId} />
          <ThemeToggle />
          <ProfileMenu onHelp={() => setHelp(true)} />
        </header>
        {process.env.NEXT_PUBLIC_USE_MOCKS === "true" && <div role="status" className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-border bg-primary-soft px-4 py-3 text-sm text-primary-ink sm:mx-6 lg:mx-8"><FlaskConical className="size-4 shrink-0" aria-hidden="true" />{copy.app.demoBanner}</div>}
        <div id="app-content" tabIndex={-1} className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"><div key={pathname} className="lw-page">{children}</div></div>
      </div>
    </div>
  </ShellContext.Provider>;
}

// Landing page frame until the landing redesign (stage 5): logo, theme toggle and a way into the app.
export function SiteFrame({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background text-fg">
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-lg text-lg font-bold tracking-tight"><Image src="/brand/loopwise-logo-64.png" width={32} height={32} alt="" priority />Loopwise<span className="-ml-2 text-primary">.</span></Link>
        <div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" className="min-h-10" nativeButton={false} render={<Link href="/brands" />}>{copy.nav.brands}</Button></div>
      </div>
    </header>
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-8">{children}</div>
  </div>;
}

export function NewBrandButton() {
  return <Button nativeButton={false} render={<Link href="/brands/new" />} className="min-h-11 px-4"><Plus aria-hidden="true" />{copy.nav.newBrand}</Button>;
}
