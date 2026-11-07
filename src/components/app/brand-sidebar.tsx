"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "./copy";

export function NewCampaignButton({ brandId, primary = true }: { brandId: string; primary?: boolean }) {
  return <Button variant={primary ? "default" : "outline"} className="min-h-11" nativeButton={false} render={<Link href={`/brands/${encodeURIComponent(brandId)}/campaigns/new`} />}><Plus aria-hidden="true" />{copy.nav.newCampaign}</Button>;
}
