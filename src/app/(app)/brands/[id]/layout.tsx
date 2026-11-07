"use client";

import { useParams } from "next/navigation";
import { BrandFrame } from "@/components/app/brand-sidebar";

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  return <BrandFrame brandId={id}>{children}</BrandFrame>;
}
