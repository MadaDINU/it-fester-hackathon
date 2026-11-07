import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({ title, description, action, crumbs, leading }: { title: string; description?: ReactNode; action?: ReactNode; crumbs?: { label: string; href?: string }[]; leading?: ReactNode }) {
  return <div className="mb-8">{crumbs && <nav aria-label="Breadcrumb" className="mb-2"><ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-[#5B6170]">{crumbs.map((c, i) => <li key={i} className="flex min-w-0 items-center gap-1">{i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}{c.href ? <Link href={c.href} className="inline-flex min-h-6 items-center rounded hover:text-[#6D28D9]">{c.label}</Link> : <span aria-current="page" className="max-w-[24ch] truncate text-[#20232D]">{c.label}</span>}</li>)}</ol></nav>}<div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">{leading}<div className="min-w-0"><h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#20232D]">{title}</h1>{description && <div className="mt-2 max-w-[65ch] text-sm leading-relaxed text-[#5B6170]">{description}</div>}</div></div>{action && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{action}</div>}</div></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center rounded-xl border border-dashed border-[#E6E7ED] bg-white p-6 text-center"><Layers3 className="mb-3 size-6 text-[#7C3AED]" aria-hidden="true" /><h2 className="text-base font-semibold text-[#20232D]">{title}</h2><p className="mt-1 max-w-md text-sm text-[#5B6170]">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function LoadingState({ label = "Loading your workspace…" }: { label?: string }) {
  return <div role="status" aria-live="polite"><span className="sr-only">{label}</span><div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="space-y-4 rounded-xl border border-[#E6E7ED] bg-white p-6"><Skeleton className="h-5 w-1/2 motion-reduce:animate-none" /><Skeleton className="h-24 w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-3/4 motion-reduce:animate-none" /></div>)}</div></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="size-5" aria-hidden="true" />Something went wrong</div><p className="mt-2 text-sm">{message}</p>{onRetry && <Button variant="outline" className="mt-4 min-h-11" onClick={onRetry}>Try again</Button>}</div>;
}
