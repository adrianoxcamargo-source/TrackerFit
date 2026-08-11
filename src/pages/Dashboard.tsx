import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Dumbbell,
  Flag,
  Flame,
  HeartPulse,
  Info,
  Scale,
  ShieldAlert,
  Target,
  Timer,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { KneeAlertBadge } from "@/components/knee-alert-badge";
import { PageHeader } from "@/components/page-header";
import { PhaseDetailsDialog } from "@/components/phase-details-dialog";
import { StatCard } from "@/components/stat-card";
import { formatKg, formatMinutes, formatShortDate, todayISO } from "@/lib/format";
import { computePhase, nextScheduledSlot } from "@/lib/programPhase";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import {
  useBodyMetrics,
  useCardioLogs,
  useExercises,
  useSetLogs,
  useSettings,
  useWorkoutLogs,
  useWorkouts,
} from "@/lib/store";

function startOfWeekISO(d: Date = new Date()): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { settings } = useSettings();
  const { activeAthleteProfile } = useActiveAthlete();
  const { items: exercises } = useExercises();
  const { items: workouts } = useWorkouts();
  const { items: workoutLogs } = useWorkoutLogs();
  const { items: setLogs } = useSetLogs();
  const { items: bodyMetrics } = useBodyMetrics();
  const { items: cardioLogs } = useCardioLogs();

  if (!settings) return null;

  const phase = computePhase(settings.startDate, settings.durationDays);

  const sortedWorkouts = [...workouts].sort((a, b) => a.sortOrder - b.sortOrder);
  // Fixed weekly rotation (Seg=A, Qua=B, Sex=C). Training off-schedule does
  // not move this — it always reflects the next prescribed slot.
  const nextSlot = nextScheduledSlot();
  const isNextToday = nextSlot.dateISO === todayISO();
  const nextWorkout =
    sortedWorkouts.find((w) => w.sortOrder === nextSlot.sortOrder) ?? null;

  const kneeExercises = exercises.filter((e) => e.kneeAlert);

  const lastLog = [...workoutLogs].sort((a, b) =>
    a.performedAt < b.performedAt ? 1 : -1,
  )[0];
  const lastLogWorkout = lastLog
    ? workouts.find((w) => w.id === lastLog.workoutId)
    : null;

  const latestMetric = [...bodyMetrics].sort((a, b) =>
    a.recordedAt < b.recordedAt ? 1 : -1,
  )[0];
  const currentWeight = latestMetric?.weightKg ?? settings.currentWeightKg;
  const currentBodyfat = latestMetric?.bodyfatPct ?? settings.currentBodyfatPct;

  const weightToLose = Math.max(
    settings.currentWeightKg - settings.goalWeightKg,
    0.001,
  );
  const weightLost = Math.max(settings.currentWeightKg - currentWeight, 0);
  const weightProgress = Math.min((weightLost / weightToLose) * 100, 100);

  const fatToLose = Math.max(
    settings.currentBodyfatPct - settings.goalBodyfatPct,
    0.001,
  );
  const fatLost = Math.max(settings.currentBodyfatPct - currentBodyfat, 0);
  const fatProgress = Math.min((fatLost / fatToLose) * 100, 100);

  const weekStart = startOfWeekISO();
  const weekCardio = cardioLogs.filter((c) => c.performedAt >= weekStart);
  const weekMinutes = weekCardio.reduce((s, c) => s + c.durationMin, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Olá, ${activeAthleteProfile?.full_name ?? "atleta"}. Acompanhe seu programa de treino de 60 dias.`}
        icon={Dumbbell}
        actions={
          nextWorkout ? (
            <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Link to={`/treino/${nextWorkout.id}`}>
                <Dumbbell className="size-4" />
                Iniciar treino
              </Link>
            </Button>
          ) : null
        }
      />

      {phase.notStarted ? (
        <Card className="border-primary/30 bg-primary/10 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">
                O programa começa em {formatShortDate(settings.startDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                Faltam {phase.daysUntilStart} dia{phase.daysUntilStart === 1 ? "" : "s"} para o início.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {phase.isComplete ? (
        <Card className="border-primary/40 bg-primary/10 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <Flag className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Programa de 60 dias concluído</p>
              <p className="text-sm text-muted-foreground">
                Revise seu histórico e métricas, ou inicie um novo ciclo em Configurações.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Dia"
          value={`${phase.day}/${phase.totalDays}`}
          sub={phase.daysRemaining ? `Faltam ${phase.daysRemaining} dias` : undefined}
          tone="primary"
        />
        <StatCard
          icon={Timer}
          label="Semana"
          value={`${phase.week}/8`}
          sub={phase.isDeload ? "Deload" : `RIR alvo ${phase.rirTarget}`}
        />
        <StatCard
          icon={Flame}
          label="Mesociclo"
          value={phase.mesocycleLabel}
          sub={phase.dropSetsAllowed ? "Drop sets liberados" : undefined}
          tone={phase.isDeload ? "default" : "primary"}
        />
        <StatCard
          icon={Target}
          label="RIR alvo"
          value={`${phase.rirTarget}`}
          sub="Reps na reserva"
        />
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-surface shadow-card">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Fase atual
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {phase.phaseLabel}
            </h3>
            <p className="text-sm text-muted-foreground">
              {phase.isDeload
                ? "Volume reduzido e RIR mais alto para recuperação."
                : phase.dropSetsAllowed
                  ? "Intensificação com drop sets a partir desta semana."
                  : "Foco em técnica e acumulação controlada."}{" "}
              Término em {formatShortDate(phase.endDate)}.
            </p>
            <div className="pt-1">
              <PhaseDetailsDialog phase={phase} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card/60 px-4 py-3 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{phase.rirTarget}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                RIR alvo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="size-4 text-primary" />
              {isNextToday ? "Treino de hoje" : "Próximo treino"}
            </CardTitle>
            <CardDescription>
              {nextWorkout
                ? `${nextWorkout.name} — ${nextWorkout.weekdayLabel}${
                    isNextToday ? "" : ` · ${formatShortDate(nextSlot.dateISO)}`
                  }`
                : "Nenhum treino planejado."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextWorkout ? (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Última sessão</span>
                  {lastLog ? (
                    <span className="font-medium text-foreground">
                      {lastLogWorkout?.name ?? "—"} · {formatShortDate(lastLog.performedAt)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sem registros ainda</span>
                  )}
                </div>
                <Button asChild className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  <Link to={`/treino/${nextWorkout.id}`}>
                    Abrir treino
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <EmptyState
                icon={Dumbbell}
                title="Sem treinos cadastrados"
                description="Importe o plano padrão para começar."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-alert/30 bg-alert/10 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-alert">
              <ShieldAlert className="size-4" />
              Aviso de segurança — joelho esquerdo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Desgaste de cartilagem: priorize amplitude controlada nestes exercícios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {kneeExercises.length ? (
              kneeExercises.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-md border border-alert/20 bg-background/40 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{e.name}</span>
                  <KneeAlertBadge showLabel={false} note={e.kneeNote} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum exercício marcado com alerta.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 text-primary" />
              Composição corporal
            </CardTitle>
            <CardDescription>
              {latestMetric
                ? `Último registro em ${formatShortDate(latestMetric.recordedAt)}`
                : "Sem registros — usando valores iniciais"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="size-3.5" /> Peso
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {formatKg(currentWeight)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta {formatKg(settings.goalWeightKg)}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Gordura</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {currentBodyfat.toFixed(1).replace(".", ",")}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta {settings.goalBodyfatPct.toFixed(1).replace(".", ",")}%
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso de peso</span>
                <span>{Math.round(weightProgress)}%</span>
              </div>
              <Progress value={weightProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso de gordura</span>
                <span>{Math.round(fatProgress)}%</span>
              </div>
              <Progress value={fatProgress} className="h-2" />
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/metricas">
                Registrar peso/gordura
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="size-4 text-primary" />
              Cardio da semana
            </CardTitle>
            <CardDescription>Meta: 3x/semana, 30–35 min (Zona 2).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Sessões</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {weekCardio.length}/3
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Minutos</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {formatMinutes(weekMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">Alvo 90–105</div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Cardio em jejum, Zona 2 — mantenha a intensidade conversável.
              </span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/cardio">
                Registrar cardio
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
