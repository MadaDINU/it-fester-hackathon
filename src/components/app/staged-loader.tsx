"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function StagedLoader({ stages }: { stages: readonly string[] }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStage(current => Math.min(current + 1, stages.length - 1)), 4000);
    return () => clearInterval(timer);
  }, [stages.length]);
  return <div role="status" aria-live="polite" className="rounded-xl border border-primary/30 bg-primary-soft p-5 text-fg"><div className="flex items-center gap-3 font-medium"><LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />{stages[stage]}</div><p className="mt-2 text-xs leading-relaxed text-primary-ink">Indicative workflow stages. Completion is confirmed by the server; this is not a live progress measurement.</p></div>;
}
