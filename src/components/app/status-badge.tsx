import type { TCampaign } from "@/lib/contracts";

// One colour per campaign status, used everywhere a status is shown.
const STYLES: Record<TCampaign["status"], { label: string; className: string }> = {
  generating: { label: "Generating", className: "border-[#E6E7ED] bg-white text-[#5B6170]" },
  ready: { label: "Ready to publish", className: "border-[#DDD0FB] bg-[#F3EEFF] text-[#6D28D9]" },
  published: { label: "Published", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  failed: { label: "Failed", className: "border-red-200 bg-red-50 text-red-800" },
};
export const STATUS_LABEL = (status: TCampaign["status"]) => STYLES[status].label;

export function StatusBadge({ status }: { status: TCampaign["status"] }) {
  const { label, className } = STYLES[status];
  return <span className={`inline-flex min-h-6 shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-medium ${className}`}>{label}</span>;
}
