import type { ReactNode } from "react";
import { AlertCircle, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "./copy";

// The page title and breadcrumb live in the shell top bar; this renders the page intro and its actions.
export function PageHeader({ description, action, leading }: { title?: string; description?: ReactNode; action?: ReactNode; crumbs?: unknown; leading?: ReactNode }) {
  if (!description && !action && !leading) return null;
  return <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">{leading}{description && <div className="max-w-[65ch] text-sm leading-relaxed text-fg-muted">{description}</div>}</div>{action && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{action}</div>}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface p-6 text-center"><Layers3 className="mb-3 size-6 text-primary-ink" aria-hidden="true" /><h2 className="text-base font-semibold text-fg">{title}</h2><p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function LoadingState({ label = copy.states.loadingWorkspace }: { label?: string }) {
  return <div role="status" aria-live="polite"><span className="sr-only">{label}</span><div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="space-y-4 rounded-xl border border-border bg-surface p-6"><Skeleton className="h-5 w-1/2 motion-reduce:animate-none" /><Skeleton className="h-24 w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-3/4 motion-reduce:animate-none" /></div>)}</div></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-6 text-danger-ink"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="size-5" aria-hidden="true" />{copy.states.errorTitle}</div><p className="mt-2 text-sm">{message}</p>{onRetry && <Button variant="outline" className="mt-4 min-h-11" onClick={onRetry}>{copy.states.retry}</Button>}</div>;
}
