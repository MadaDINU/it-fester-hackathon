"use client";

import { useEffect, useId, useRef, useState } from "react";

export const GLOSSARY = {
  er: { term: "Engagement rate", text: "Likes, comments, shares and saves divided by the people reached. Higher means more people acted on the post." },
  predictedEr: { term: "Predicted ER", text: "Our estimate of this post's engagement rate, based on your past posts. It is a forecast, not a promise." },
  panelScore: { term: "Panel score", text: "How strongly your audience personas said they would stop and engage, from 0 to 100." },
  r2: { term: "R²", text: "How well the model explains your past results, from 0 to 1. Closer to 1 means its predictions are more reliable." },
  coldStart: { term: "Cold start", text: "There are not enough posts to train on yet, so predictions use general patterns. It improves after about 8 measured posts." },
  simulated: { term: "Simulated history", text: "Demo data made to look like real results and clearly labelled. It is not from the account's real posts." },
  focusGroup: { term: "Focus group", text: "AI personas built from your audience react to each idea before you post, so weak ideas show up early." },
} as const;
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
    <button type="button" aria-label={`What is ${term}?`} aria-describedby={tipId} aria-expanded={open}
      onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      className="inline-grid size-5 place-items-center rounded-full border border-[#E6E7ED] bg-white text-[11px] font-semibold leading-none text-[#5B6170] hover:border-[#A78BFA] hover:text-[#6D28D9] focus-visible:outline-2 focus-visible:outline-[#7C3AED]">?</button>
    <span id={tipId} role="tooltip" hidden={!open} className={`absolute top-full z-30 mt-2 w-64 max-w-[calc(100vw-32px)] rounded-lg bg-[#20232D] px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg ${position}`}>{text}</span>
  </span>;
}
