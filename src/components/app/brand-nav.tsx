"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

// Each brand page mounts its own BrandNav, so the last underline position is kept here to slide from it.
let lastIndicator: { left: number; width: number } | null = null;

export function BrandNav({ brandId }: { brandId: string }) {
  const pathname = usePathname();
  const base = `/brands/${encodeURIComponent(brandId)}`;
  const tabs = [{ href: base, label: "Overview" }, { href: `${base}/analytics`, label: "Analytics" }, { href: `${base}/community`, label: "Community" }];
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number; animate: boolean } | null>(lastIndicator && { ...lastIndicator, animate: false });
  const activeIndex = tabs.findIndex(tab => tab.href === pathname);
  useLayoutEffect(() => {
    const el = refs.current[activeIndex];
    if (!el) return;
    const next = { left: el.offsetLeft, width: el.offsetWidth };
    const frame = requestAnimationFrame(() => setIndicator({ ...next, animate: true }));
    lastIndicator = next;
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);
  return <nav aria-label="Brand sections" className="relative -mt-4 mb-8 flex gap-6 overflow-x-auto border-b border-[#E6E7ED]">
    {tabs.map((tab, i) => {
      const active = i === activeIndex;
      return <Link key={tab.href} ref={el => { refs.current[i] = el; }} href={tab.href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center text-sm font-semibold transition-colors motion-reduce:transition-none ${active ? "text-[#20232D]" : "text-[#5B6170] hover:text-[#6D28D9]"}`}>{tab.label}</Link>;
    })}
    {indicator && <span aria-hidden="true" className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-[#7C3AED] ${indicator.animate ? "lw-underline" : ""}`} style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }} />}
  </nav>;
}
