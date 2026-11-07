"use client";

export { isSimulatedLearning, isSimulatedSource, isSimulatedTraining, stripSimulatedPrefix } from "./simulated-history";
import { InfoTip } from "./info-tip";
import { copy } from "./copy";

export function SimulatedBadge() {
  return <span className="inline-flex shrink-0 items-center gap-1.5"><span className="inline-flex min-h-7 items-center rounded-full border border-warning/50 bg-warning-soft px-3 text-xs font-semibold text-warning-ink">{copy.simulated}</span><InfoTip id="simulated" /></span>;
}
