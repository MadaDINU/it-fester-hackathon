"use client";

export { isSimulatedLearning, isSimulatedSource, isSimulatedTraining, stripSimulatedPrefix } from "./simulated-history";
import { InfoTip } from "./info-tip";

export function SimulatedBadge() {
  return <span className="inline-flex shrink-0 items-center gap-1.5"><span className="inline-flex min-h-7 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900">Simulated history</span><InfoTip id="simulated" /></span>;
}
