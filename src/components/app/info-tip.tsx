"use client";

import { useEffect, useId, useRef, useState } from "react";
import { copy } from "./copy";

export const GLOSSARY = {
  er: copy.glossary.er, predictedEr: copy.glossary.predictedEr, panelScore: copy.glossary.panelScore, r2: copy.glossary.r2,
  coldStart: copy.glossary.coldStart, simulated: copy.glossary.simulated, focusGroup: copy.glossary.focusGroup,
};
export type GlossaryKey = keyof typeof GLOSSARY;

// A "?" button with an accessible tooltip: hover, focus or tap to open; Escape or a click outside closes it.
export function InfoTip({ id: key }: { id: GlossaryKey }) {
  const { term, text } = GLOSSARY[key];
  const tipId = useId(); const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false); const [align, setAlign] = useState<"left" | "center" | "right">("center");
  useEffect(() => {
    if (!open) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setAlign(rect.left < 136 ? "left" : window.innerWidth - rect.right < 136 ? "right" : "center");
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", close); document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);
  const position = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return <span ref={ref} className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button type="button" aria-label={copy.glossary.whatIs(term)} aria-describedby={tipId} aria-expanded={open}
      onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      className="inline-grid size-5 place-items-center rounded-full border border-border bg-surface text-[11px] font-semibold leading-none text-fg-muted hover:border-primary-light hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-primary">?</button>
    <span id={tipId} role="tooltip" hidden={!open} className={`absolute top-full z-30 mt-2 w-64 max-w-[calc(100vw-32px)] rounded-lg bg-fg px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-surface shadow-lg ${position}`}>{text}</span>
  </span>;
}
