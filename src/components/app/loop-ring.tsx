"use client";

import { useEffect, useState, type ReactNode } from "react";

const ARC = 310 / 360;

// The Loopwise signature: a ~310° violet arc with an arrow at its start and an amber dot in the centre.
// The arc fills to `value` (0–1) once after mount; spinning/pulse are for "AI is thinking" states.
export function LoopRing({ value, size = 96, stroke, label, spinning = false, pulse = false, children, className = "" }: {
  value: number; size?: number; stroke?: number; label: string; spinning?: boolean; pulse?: boolean; children?: ReactNode; className?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const frame = requestAnimationFrame(() => setShown(Math.max(0, Math.min(1, value)))); return () => cancelAnimationFrame(frame); }, [value]);
  const width = stroke ?? Math.max(3, Math.round(size * 0.09));
  const arrow = width * 1.6;
  const r = size / 2 - width / 2 - arrow / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * ARC;
  // The arc starts at 3 o'clock and runs clockwise; the arrow at its start points into the gap.
  const tip = `${c + r},${c - arrow * 1.1} ${c + r - arrow * 0.75},${c + arrow * 0.1} ${c + r + arrow * 0.75},${c + arrow * 0.1}`;
  return <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
    <svg role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={`${spinning ? "lw-spin" : ""} ${pulse ? "lw-pulse" : ""}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--primary-soft)" strokeWidth={width} strokeLinecap="round" strokeDasharray={`${arc} ${circumference}`} />
      <circle className="lw-ring-progress" cx={c} cy={c} r={r} fill="none" stroke="var(--primary)" strokeWidth={width} strokeLinecap="round" strokeDasharray={`${arc * shown} ${circumference}`} />
      <polygon points={tip} fill={shown > 0 ? "var(--primary)" : "var(--border)"} strokeLinejoin="round" />
      {!children && <circle cx={c} cy={c} r={Math.max(2.5, size * 0.07)} fill="var(--warning)" />}
    </svg>
    {children && <span className="absolute inset-0 grid place-items-center text-center">{children}</span>}
  </span>;
}
