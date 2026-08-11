import {
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Dumbbell,
  Eye,
  PencilLine,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KneeAlertBadge } from "@/components/knee-alert-badge";
import { formatShortDate, todayISO } from "@/lib/format";
import { rirForCategory } from "@/lib/programPhase";
import type { WeekMeta } from "@/lib/programPhase";
import type { Exercise, SetLog, Workout, WorkoutExercise, WorkoutLog } from "@/lib/types";

type WeekStatus = "past" | "current" | "future";

interface SessionSummary {
  log: WorkoutLog;
  sets: SetLog[];
}

interface WorkoutWeekCardProps {
  workout: Workout;
  status: WeekStatus;
  weekMeta: WeekMeta;
  exercises: Exercise[];
  workoutExercises: WorkoutExercise[];
  sessions: SessionSummary[];
}

export function WorkoutWeekCard({
  workout,
  status,
  weekMeta,
  exercises,
  workoutExercises,
  sessions,
}: WorkoutWeekCardProps) {
  const [expanded, setExpanded] = useState(false);

  const today = todayISO();
  const doneToday = sessions.some((s) => s.log.performedAt === today);
  const kneeCount = workoutExercises.filter((we) => {
    const ex = exercises.find((e) => e.id === we.exerciseId);
    return ex?.kneeAlert;
  }).length;

  const statusBadge =
    status === "current" ? (
      <Badge className="border-primary/40 bg-primary/15 text-primary" variant="outline">
        <CalendarCheck className="size-3" />
        Semana atual
      </Badge>
    ) : status === "past" ? (
      sessions.length > 0 ? (
        <Badge className="border-primary/40 bg-primary/15 text-primary" variant="outline">
          Realizado {sessions.length > 1 ? `(${sessions.length}x)` : ""}
        </Badge>
      ) : (
        <Badge className="border-border bg-muted/40 text-muted-foreground" variant="outline">
          <CircleDashed className="size-3" />
          Não realizado
        </Badge>
      )
    ) : (
      <Badge className="border-border bg-muted/40 text-muted-foreground" variant="outline">
        Prévia
      </Badge>
    );

  return (
    <Card className="h-full overflow-hidden shadow-card">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Dumbbell className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{workout.name}</h3>
              <p className="text-sm text-muted-foreground">{workout.weekdayLabel}</p>
            </div>
          </div>
          {statusBadge}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border bg-muted/30 px-2 py-1">
            {workoutExercises.length} exercícios
          </span>
          {kneeCount > 0 ? (
            <span className="rounded-md border border-alert/30 bg-alert/10 px-2 py-1 text-alert">
              {kneeCount} c/ alerta de joelho
            </span>
          ) : null}
          {status === "current" && doneToday ? (
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
              Concluído hoje
            </span>
          ) : null}
          {weekMeta.dropSetsAllowed ? (
            <span className="rounded-md border border-chart-3/40 bg-chart-3/10 px-2 py-1 text-chart-3">
              Drop set liberado
            </span>
          ) : null}
        </div>

        {status === "current" ? (
          <Link
            to={`/treino/${workout.id}`}
            className="mt-auto flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            Abrir treino
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-between"
              onClick={() => setExpanded((v) => !v)}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                {status === "past" ? "Ver sessão" : "Ver exercícios"}
              </span>
              <ChevronDown
                className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </Button>
            {status === "past" ? (
              <Button asChild size="sm" className="flex-1 justify-between">
                <Link
                  to={`/treino/${workout.id}?date=${
                    sessions[sessions.length - 1]?.log.performedAt ?? weekMeta.startDate
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <PencilLine className="size-3.5" />
                    {sessions.length ? "Editar sessão" : "Registrar sessão"}
                  </span>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        )}

        {expanded && status === "past" ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma série registrada nesta semana.
              </p>
            ) : (
              sessions.map((s) => (
                <div key={s.log.id} className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">
                    {formatShortDate(s.log.performedAt)}
                  </p>
                  {s.sets.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem séries registradas.</p>
                  ) : (
                    <ul className="space-y-1">
                      {[...new Set(s.sets.map((x) => x.exerciseId))].map((exId) => {
                        const ex = exercises.find((e) => e.id === exId);
                        const exSets = s.sets
                          .filter((x) => x.exerciseId === exId)
                          .sort((a, b) => a.setNumber - b.setNumber);
                        const top = exSets.reduce(
                          (max, x) => (x.loadKg > max.loadKg ? x : max),
                          exSets[0],
                        );
                        return (
                          <li
                            key={exId}
                            className="flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <span>{ex?.name ?? "Exercício"}</span>
                            <span className="font-medium text-foreground">
                              {top.loadKg.toFixed(1).replace(".", ",")} kg × {top.repsDone}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        ) : null}

        {expanded && status !== "past" ? (
          <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
            {workoutExercises.map((we) => {
              const ex = exercises.find((e) => e.id === we.exerciseId);
              if (!ex) return null;
              const rir = rirForCategory(weekMeta.week, ex.category);
              return (
                <div
                  key={we.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="flex items-center gap-1.5 text-foreground">
                    {we.sortOrder}. {ex.name}
                    {ex.kneeAlert ? <KneeAlertBadge showLabel={false} note={ex.kneeNote} /> : null}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {we.setsPlanned}x {we.repsTarget} · RIR {rir}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
