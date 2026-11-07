import type { ReactNode } from "react";
import { AlertCircle, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>}</div>{action}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <Card className="border border-dashed border-slate-300 bg-white shadow-none ring-0"><CardHeader className="items-center px-6 pt-8 text-center"><Layers3 className="mb-4 size-8 text-violet-600" aria-hidden="true" /><CardTitle>{title}</CardTitle><CardDescription className="max-w-md">{description}</CardDescription></CardHeader><CardContent className="flex justify-center pb-6">{action}</CardContent></Card>;
}

export function LoadingState({ label = "Loading your workspace…" }: { label?: string }) {
  return <div role="status" aria-live="polite"><span className="sr-only">{label}</span><div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="space-y-4 rounded-xl border bg-white p-6"><Skeleton className="h-5 w-1/2 motion-reduce:animate-none" /><Skeleton className="h-24 w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-3/4 motion-reduce:animate-none" /></div>)}</div></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="size-5" aria-hidden="true" />Something went wrong</div><p className="mt-2 text-sm">{message}</p>{onRetry && <Button variant="outline" className="mt-4 min-h-11" onClick={onRetry}>Try again</Button>}</div>;
}
