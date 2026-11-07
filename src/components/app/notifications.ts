import type { TCampaign, TCommunity, TLearning } from "@/lib/contracts";
import { copy } from "./copy";

export type Notice = { id: string; text: string; href: string; at: string; tone: "success" | "danger" | "primary" };

const short = (text: string, max = 60) => text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

// Built only from data the API returns: ready/failed campaigns, learnings, unanswered comments.
export function buildNotifications({ brandId, campaigns, learnings, comments }: { brandId: string; campaigns: TCampaign[]; learnings: TLearning[]; comments: TCommunity["comments"] }): Notice[] {
  const base = `/brands/${encodeURIComponent(brandId)}`;
  const list: Notice[] = [];
  for (const c of campaigns) {
    if (c.kind !== "generated") continue;
    if (c.status === "ready") list.push({ id: `campaign-ready:${c.id}`, text: copy.notifications.campaignReady(short(c.brief)), href: `/campaigns/${c.id}`, at: c.createdAt, tone: "success" });
    if (c.status === "failed") list.push({ id: `campaign-failed:${c.id}`, text: copy.notifications.campaignFailed(short(c.brief)), href: `/campaigns/${c.id}`, at: c.createdAt, tone: "danger" });
  }
  for (const l of [...learnings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)) {
    list.push({ id: `learning:${l.id}`, text: copy.notifications.learning(short(l.insight.replace(/^\s*\[Simulated history\]\s*/, ""))), href: `${base}/analytics`, at: l.createdAt, tone: "primary" });
  }
  const open = comments.filter(c => !c.replied).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (open.length) list.push({ id: `comments:${open[0].id}`, text: copy.notifications.comments(open.length), href: `${base}/community`, at: open[0].createdAt, tone: "primary" });
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

const READ_KEY = "loopwise:notifications-read";
export function readIds(): Set<string> {
  try { return new Set(JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]") as string[]); } catch { return new Set(); }
}
export function saveReadIds(ids: Set<string>) {
  try { window.localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200))); } catch { /* storage blocked: read state lasts for this visit only */ }
}
