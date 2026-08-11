import { Dumbbell } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WeekPicker } from "@/components/week-picker";
import { WorkoutWeekCard } from "@/components/workout-week-card";
import { allWeeksMeta, computePhase } from "@/lib/programPhase";
import {
  useExercises,
  useSetLogs,
  useSettings,
  useWorkoutExercises,
  useWorkoutLogs,
  useWorkouts,
} from "@/lib/store";

export default function Treino() {
  const { settings } = useSettings();
  const { items: workouts } = useWorkouts();
  const { items: exercises } = useExercises();
  const { items: workoutExercises } = useWorkoutExercises();
  const { items: workoutLogs } = useWorkoutLogs();
  const { items: setLogs } = useSetLogs();

  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => a.sortOrder - b.sortOrder),
    [workouts],
  );

  const phase = settings ? computePhase(settings.startDate, settings.durationDays) : null;
  const weeks = useMemo(
    () => (settings ? allWeeksMeta(settings.startDate, settings.durationDays) : []),
    [settings],
  );

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const currentWeek = phase?.week ?? 1;
  const activeWeek = selectedWeek ?? currentWeek;
  const weekMeta = weeks.find((w) => w.week === activeWeek) ?? weeks[0];

  if (!settings) return null;

  if (!sortedWorkouts.length) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Nenhum treino cadastrado"
        description="Importe o plano padrão para começar a treinar."
        action={
          <Button asChild>
            <Link to="/onboarding">Importar plano</Link>
          </Button>
        }
      />
    );
  }

  if (!weekMeta) return null;

  const status =
    activeWeek === currentWeek ? "current" : activeWeek < currentWeek ? "past" : "future";

  return (
    <>
      <PageHeader
        title="Treino"
        description="Navegue pelas semanas do programa: reveja sessões passadas ou veja o que vem a seguir."
        icon={Dumbbell}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeekPicker
          weeks={weeks}
          selectedWeek={activeWeek}
          currentWeek={currentWeek}
          onChange={setSelectedWeek}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary">
            {weekMeta.mesocycleLabel}
          </span>
          <span>{weekMeta.phaseLabel}</span>
          <span className="rounded-md border border-border bg-muted/30 px-2 py-1">
            RIR compostos {weekMeta.compoundRir} · isoladores {weekMeta.isolatorRir}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sortedWorkouts.map((w) => {
          const wExercises = workoutExercises
            .filter((we) => we.workoutId === w.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          const sessions = workoutLogs
            .filter(
              (l) =>
                l.workoutId === w.id &&
                l.performedAt >= weekMeta.startDate &&
                l.performedAt <= weekMeta.endDate,
            )
            .sort((a, b) => (a.performedAt < b.performedAt ? -1 : 1))
            .map((log) => ({
              log,
              sets: setLogs.filter((s) => s.workoutLogId === log.id),
            }));

          return (
            <WorkoutWeekCard
              key={w.id}
              workout={w}
              status={status}
              weekMeta={weekMeta}
              exercises={exercises}
              workoutExercises={wExercises}
              sessions={sessions}
            />
          );
        })}
      </div>
    </>
  );
}
