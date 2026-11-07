"use client";

import { useEffect, useState } from "react";

// Counts from 0 to `value` once on mount (700ms, ease-out); jumps straight to it under reduced motion.
export function CountUp({ value, format = n => Math.round(n).toLocaleString("en-US"), duration = 700 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(value); return; }
    let frame = 0; const start = performance.now();
    const tick = (now: number) => { const t = Math.min(1, (now - start) / duration); setN(value * (1 - Math.pow(1 - t, 3))); if (t < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <span className="tabular-nums">{format(n)}</span>;
}
