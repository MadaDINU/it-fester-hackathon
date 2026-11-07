"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BrandNav({ brandId }: { brandId: string }) {
  const pathname = usePathname();
  const base = `/brands/${encodeURIComponent(brandId)}`;
  const tabs = [{ href: base, label: "Overview" }, { href: `${base}/analytics`, label: "Analytics" }, { href: `${base}/community`, label: "Community" }];
  return <nav aria-label="Brand sections" className="-mt-4 mb-8 flex gap-6 overflow-x-auto border-b border-[#E6E7ED]">{tabs.map(tab => {
    const active = pathname === tab.href;
    return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={`-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-semibold transition-colors motion-reduce:transition-none ${active ? "border-[#7C3AED] text-[#20232D]" : "border-transparent text-[#5B6170] hover:text-[#6D28D9]"}`}>{tab.label}</Link>;
  })}</nav>;
}
