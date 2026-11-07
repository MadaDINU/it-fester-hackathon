import type { Step } from "./loop-progress";
import { copy } from "./copy";

// Horizontal progress through the loop: done steps get a check, the current one is violet.
export function LoopSteps({ steps, label }: { steps: Step[]; label: string }) {
  const current = steps.findIndex(step => !step.done);
  return <ol aria-label={label} className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs font-medium">
    {steps.map((step, i) => {
      const active = i === current;
      return <li key={step.key} aria-current={active ? "step" : undefined} className="flex items-center gap-1">
        <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 ${step.done ? "text-primary-ink" : active ? "bg-primary text-white" : "text-fg-muted"}`}>
          <span aria-hidden="true" className={`grid size-4 place-items-center rounded-full text-[10px] leading-none ${step.done ? "bg-primary-soft" : active ? "bg-white/20" : "border border-border"}`}>{step.done ? <svg className="lw-check size-3" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}</span>
          {step.label}<span className="sr-only">{step.done ? copy.loop.done : active ? copy.loop.current : ""}</span>
        </span>
        {i < steps.length - 1 && <span aria-hidden="true" className={`h-px w-3 ${step.done ? "bg-primary-light" : "bg-border"}`} />}
      </li>;
    })}
  </ol>;
}
