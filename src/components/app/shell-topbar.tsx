"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, CircleHelp, Moon, Settings, Sun } from "lucide-react";
import { api } from "@/lib/api-client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { copy, relativeTime } from "./copy";
import { buildNotifications, readIds, saveReadIds, type Notice } from "./notifications";

const iconButton = "relative grid size-10 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg active:scale-95";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme(); const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";
  return <button type="button" className={iconButton} aria-label={dark ? copy.topbar.themeToLight : copy.topbar.themeToDark} onClick={() => setTheme(dark ? "light" : "dark")}>
    {mounted ? (dark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />) : <span className="size-5" />}
  </button>;
}

export function NotificationsBell({ brandId }: { brandId: string | null }) {
  const [items, setItems] = useState<Notice[] | null>(null); const [failed, setFailed] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const load = useCallback(async () => {
    if (!brandId) { setItems([]); return; }
    setFailed(false);
    const [campaigns, brand, community] = await Promise.allSettled([api.listCampaigns(brandId), api.getBrand(brandId), api.getCommunity(brandId)]);
    if (brand.status === "rejected" && campaigns.status === "rejected") { setFailed(true); setItems([]); return; }
    setItems(buildNotifications({ brandId, campaigns: campaigns.status === "fulfilled" ? campaigns.value : [], learnings: brand.status === "fulfilled" ? brand.value.learnings : [], comments: community.status === "fulfilled" ? community.value.comments : [] }));
  }, [brandId]);
  useEffect(() => { setRead(readIds()); void load(); }, [load]);
  const unread = (items ?? []).filter(n => !read.has(n.id)).length;
  const markAll = () => { const next = new Set([...read, ...(items ?? []).map(n => n.id)]); setRead(next); saveReadIds(next); };
  return <DropdownMenu onOpenChange={open => { if (open) void load(); }}>
    <DropdownMenuTrigger className={iconButton} aria-label={copy.notifications.label(unread)}>
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && <span aria-hidden="true" className="lw-pop absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[11px] font-semibold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-[min(360px,calc(100vw-32px))] p-0">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-fg">{copy.notifications.title}</p>
        {unread > 0 && <button type="button" onClick={markAll} className="rounded-md px-2 py-1 text-xs font-medium text-primary-ink hover:bg-primary-soft">{copy.notifications.markRead}</button>}
      </div>
      <div className="max-h-96 overflow-y-auto p-1">
        {items === null ? <p className="px-3 py-4 text-sm text-fg-muted">{copy.notifications.loading}</p>
          : failed ? <p className="px-3 py-4 text-sm text-fg-muted">{copy.notifications.unavailable}</p>
          : items.length === 0 ? <p className="px-3 py-4 text-sm text-fg-muted">{copy.notifications.empty}</p>
          : items.map(n => <DropdownMenuItem key={n.id} className="items-start gap-3 rounded-lg px-3 py-2.5" render={<Link href={n.href} />} onClick={() => { const next = new Set(read).add(n.id); setRead(next); saveReadIds(next); }}>
            <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${read.has(n.id) ? "bg-transparent" : n.tone === "danger" ? "bg-danger" : n.tone === "success" ? "bg-success" : "bg-primary"}`} />
            <span className="min-w-0"><span className={`block text-sm ${read.has(n.id) ? "text-fg-muted" : "font-medium text-fg"}`}>{n.text}</span><span className="block text-xs text-fg-muted">{relativeTime(n.at)}</span></span>
          </DropdownMenuItem>)}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-surface p-6 sm:max-w-md">
      <DialogTitle className="text-lg font-semibold text-fg">{copy.settings.title}</DialogTitle>
      <DialogDescription className="text-sm text-fg-muted">{copy.settings.description}</DialogDescription>
      <fieldset><legend className="mb-2 text-sm font-medium text-fg">{copy.settings.theme}</legend>
        <div className="grid grid-cols-2 gap-3">{(["light", "dark"] as const).map(value => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 text-sm text-fg has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
          <input type="radio" name="theme" value={value} checked={resolvedTheme === value} onChange={() => setTheme(value)} className="accent-primary" />
          {value === "light" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}{copy.settings[value]}
        </label>)}</div>
      </fieldset>
    </DialogContent>
  </Dialog>;
}

export function ProfileMenu({ onHelp }: { onHelp: () => void }) {
  const [settings, setSettings] = useState(false);
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={copy.profile.label} className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-white hover:bg-primary-hover active:scale-95">M</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1">
        <div className="flex items-center gap-3 px-2 py-2.5"><span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-white">M</span><span><span className="block text-sm font-semibold text-fg">{copy.profile.name}</span><span className="block text-xs text-fg-muted">{copy.profile.workspace}</span></span></div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-10 px-2" onClick={() => setSettings(true)}><Settings aria-hidden="true" />{copy.profile.settings}</DropdownMenuItem>
        <DropdownMenuItem className="min-h-10 px-2" onClick={onHelp}><CircleHelp aria-hidden="true" />{copy.profile.help}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <SettingsDialog open={settings} onOpenChange={setSettings} />
  </>;
}
