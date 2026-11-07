"use client";

export { isSimulatedLearning, isSimulatedSource, isSimulatedTraining, stripSimulatedPrefix } from "./simulated-history";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SimulatedBadge() {
  return <Tooltip><TooltipTrigger className="inline-flex min-h-7 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900">Simulated history</TooltipTrigger><TooltipContent>Training data is simulated and labelled; not the account&apos;s real posts</TooltipContent></Tooltip>;
}
