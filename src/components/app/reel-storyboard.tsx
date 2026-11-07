"use client";

import { toast } from "sonner";
import type { TReelScript } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { reelScriptText } from "./campaign-tools";

export function ReelStoryboard({ script }: { script: TReelScript }) {
  async function copy() {
    try { await navigator.clipboard.writeText(reelScriptText(script)); toast.success("Reel script copied"); }
    catch { toast.error("Clipboard unavailable. Select and copy the script below."); }
  }
  return <section aria-label="Reel storyboard" className="space-y-4 rounded-xl border bg-slate-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Reel storyboard · {script.durationSeconds}s</h3><Button variant="outline" className="min-h-11" onClick={() => void copy()}>Copy script</Button></div><p className="rounded-lg bg-violet-100 p-4 text-lg font-medium text-violet-950">Hook: {script.hook}</p><ol className="space-y-3">{script.scenes.map((scene, i) => <li key={i} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-[5rem_1fr]"><span className="font-mono text-sm font-semibold text-violet-700">{scene.seconds}s</span><div className="space-y-2 text-sm"><p>{scene.visual}</p><p><strong>On-screen:</strong> {scene.onScreenText}</p>{scene.voiceover && <p><strong>Voiceover:</strong> {scene.voiceover}</p>}</div></li>)}</ol><p className="text-sm"><strong>Audio:</strong> {script.audioDirection}</p><p className="text-sm"><strong>Cover:</strong> {script.coverText}</p><ul className="list-inside list-disc text-sm text-slate-600">{script.editingNotes.map((note, i) => <li key={i}>{note}</li>)}</ul><p className="text-sm"><strong>TikTok repurpose:</strong> {script.tiktokRepurpose}</p></section>;
}
