import { cn } from "@/lib/utils";
import type { ProgramPhase } from "@/lib/programPhase";

interface PhasePillProps {
  phase: ProgramPhase;
  className?: string;
}

export function PhasePill({ phase, className }: PhasePillProps) {
  const tone =
    phase.isDeload || phase.mesocycle === 0
      ? "border-border bg-muted text-muted-foreground"
      : "border-primary/30 bg-primary/15 text-primary";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      <span className="font-semibold">{phase.mesocycleLabel}</span>
      <span className="opacity-50">•</span>
      <span>Semana {phase.week}</span>
      <span className="opacity-50">•</span>
      <span>
        Dia {phase.day}/{phase.totalDays}
      </span>
    </span>
  );
}
