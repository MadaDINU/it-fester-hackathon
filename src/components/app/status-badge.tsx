import type { TCampaign } from "@/lib/contracts";
import { copy } from "./copy";

// One colour per campaign status, used everywhere a status is shown.
const STYLES: Record<TCampaign["status"], { label: string; className: string }> = {
  generating: { label: copy.status.generating, className: "border-border bg-surface text-fg-muted" },
  ready: { label: copy.status.ready, className: "border-primary/30 bg-primary-soft text-primary-ink" },
  published: { label: copy.status.published, className: "border-success/30 bg-success-soft text-success-ink" },
  failed: { label: copy.status.failed, className: "border-danger/30 bg-danger-soft text-danger-ink" },
};
export const STATUS_LABEL = (status: TCampaign["status"]) => STYLES[status].label;

export function StatusBadge({ status }: { status: TCampaign["status"] }) {
  const { label, className } = STYLES[status];
  return <span className={`inline-flex min-h-6 shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-medium ${className}`}>{label}</span>;
}
