import {
  ArrowLeft,
  Check,
  Dumbbell,
  Info,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateField } from "@/components/date-field";
import { EmptyState } from "@/components/empty-state";
import { KneeAlertBadge } from "@/components/knee-alert-badge";
import { PageHeader } from "@/components/page-header";
import { useRestTimer } from "@/hooks/use-rest-timer";
import { formatShortDate, todayISO } from "@/lib/format";
import { computeProgressionSuggestion } from "@/lib/progression";
import { defaultRestSeconds, formatRestDuration } from "@/lib/rest";
import {
  useExercises,
  useSetLogs,
  useSettings,
  useWorkoutExercises,
  useWorkoutLogs,
  useWorkouts,
} from "@/lib/store";
import type { SetLog } from "@/lib/types";

const DIFFICULTY: Record<number, string> = {
  1: "Muito fácil",
  2: "Fácil",
  3: "Moderada",
  4: "Difícil",
  5: "Falha",
};

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

interface Draft {
  load: string;
  reps: string;
  difficulty: number;
  notes: string;
}

const emptyDraft: Draft = { load: "", reps: "", difficulty: 3, notes: "" };

export default function TreinoExecucao() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();
  const { items: workouts } = useWorkouts();
  const { items: exercises } = useExercises();
  const { items: workoutExercises } = useWorkoutExercises();
  const { items: workoutLogs } = useWorkoutLogs();
  const { items: setLogs, add: addSet, update: updateSet, remove: removeSet } =
    useSetLogs();
  const { add: addLog, remove: removeLog } = useWorkoutLogs();
  const { rest, startRest, finishRest } = useRestTimer();

  const todayStr = todayISO();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [targetDate, setTargetDateState] = useState<string>(
    () => searchParams.get("date") || todayStr,
  );
  const isToday = targetDate === todayStr;

  const setTargetDate = (date: string) => {
    setTargetDateState(date);
    setStartedAt(null);
    const next = new URLSearchParams(searchParams);
    if (date === todayStr) next.delete("date");
    else next.set("date", date);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const workout = workouts.find((w) => w.id === workoutId) ?? null;

  const activeLog =
    workoutLogs.find(
      (l) => l.workoutId === workoutId && l.performedAt === targetDate,
    ) ?? null;

  const wExercises = useMemo(
    () =>
      workoutExercises
        .filter((we) => we.workoutId === workoutId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [workoutExercises, workoutId],
  );

  const activeSetLogs = setLogs.filter((s) => s.workoutLogId === activeLog?.id);

  // Sync drafts from existing set logs whenever the active log changes.
  useEffect(() => {
    if (!activeLog) {
      setDrafts({});
      return;
    }
    const next: Record<string, Draft> = {};
    for (const we of wExercises) {
      for (let n = 1; n <= we.setsPlanned; n++) {
        const existing = activeSetLogs.find(
          (s) => s.exerciseId === we.exerciseId && s.setNumber === n,
        );
        next[`${we.exerciseId}__${n}`] = existing
          ? {
              load: String(existing.loadKg),
              reps: String(existing.repsDone),
              difficulty: existing.difficulty,
              notes: existing.notes ?? "",
            }
          : { ...emptyDraft };
      }
    }
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLog?.id, workoutId, wExercises.length]);

  if (workouts.length > 0 && !workout) {
    return <Navigate to="/treino" replace />;
  }
  if (!workout) return null;

  const handleStart = async () => {
    await addLog({ workoutId: workout.id, performedAt: targetDate, notes: "" });
    if (isToday) setStartedAt(Date.now());
    toast.success(
      isToday
        ? "Sessão iniciada."
        : `Sessão criada para ${formatShortDate(targetDate)}.`,
    );
  };

  const handleDiscard = async () => {
    if (!activeLog) return;
    for (const s of activeSetLogs) {
      await removeSet(s.id);
    }
    await removeLog(activeLog.id);
    setStartedAt(null);
    toast.success("Sessão descartada.");
  };

  const handleSaveSet = async (exerciseId: string, setNumber: number) => {
    if (!activeLog) return;
    const key = `${exerciseId}__${setNumber}`;
    const d = drafts[key] ?? emptyDraft;
    if (!d.load || !d.reps) {
      toast.error("Informe carga e repetições.");
      return;
    }
    const payload = {
      workoutLogId: activeLog.id,
      exerciseId,
      setNumber,
      loadKg: num(d.load),
      repsDone: Math.max(1, Math.round(num(d.reps))),
      difficulty: d.difficulty,
      notes: d.notes,
    };
    const existing = activeSetLogs.find(
      (s) => s.exerciseId === exerciseId && s.setNumber === setNumber,
    );
    let savedId = existing?.id;
    if (existing) {
      await updateSet(existing.id, payload);
    } else {
      const created = await addSet(payload);
      savedId = created?.id;
    }
    toast.success("Série registrada.");

    // Only starts the rest timer for a fresh set. Correcting an already
    // registered set ("Salvar") does not reopen it — the set is already done.
    if (!existing && savedId && isToday) {
      if (rest) await finishRest(true);
      const we = wExercises.find((x) => x.exerciseId === exerciseId);
      const ex = exercises.find((x) => x.id === exerciseId);
      if (we && ex) {
        startRest({
          workoutId: workout.id,
          exerciseId,
          exerciseName: ex.name,
          setLogId: savedId,
          targetSeconds: we.restSeconds ?? defaultRestSeconds(ex.category),
          startedAt: Date.now(),
        });
      }
    }
  };

  const lastSessionFor = (exerciseId: string) => {
    const sets = setLogs.filter((s) => s.exerciseId === exerciseId);
    if (!sets.length) return null;
    const logIds = new Set(sets.map((s) => s.workoutLogId));
    // Only consider sessions strictly before the one being trained/edited now,
    // so the reference is always "the previous time", never a later session
    // picked up while backfilling an older date out of order.
    const recent = [...workoutLogs]
      .filter((l) => logIds.has(l.id) && l.performedAt < targetDate)
      .sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1))[0];
    if (!recent) return null;
    const sessionSets = sets
      .filter((s) => s.workoutLogId === recent.id)
      .sort((a, b) => a.setNumber - b.setNumber);
    const top = sessionSets.reduce(
      (max, s) => (s.loadKg > max.loadKg ? s : max),
      sessionSets[0],
    ) as SetLog;
    const maxDifficulty = sessionSets.reduce(
      (max, s) => Math.max(max, s.difficulty),
      0,
    );
    return {
      load: top.loadKg,
      reps: top.repsDone,
      date: recent.performedAt,
      maxDifficulty,
    };
  };

  const elapsedSec = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");
  const sessionMax = settings?.sessionMaxMinutes ?? 50;
  const elapsedMin = Math.floor(elapsedSec / 60);
  const overTime = elapsedMin >= sessionMax;
  const nearTime = elapsedMin >= sessionMax - 5;

  const applySuggestion = (
    exerciseId: string,
    setsPlanned: number,
    loadKg: number,
    repsAutofill: number | null,
  ) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (let n = 1; n <= setsPlanned; n++) {
        const key = `${exerciseId}__${n}`;
        const already = activeSetLogs.some(
          (s) => s.exerciseId === exerciseId && s.setNumber === n,
        );
        if (already) continue;
        next[key] = {
          ...(next[key] ?? emptyDraft),
          load: String(loadKg),
          reps: repsAutofill != null ? String(repsAutofill) : next[key]?.reps ?? "",
        };
      }
      return next;
    });
    toast.success("Sugestão aplicada às séries pendentes.");
  };

  if (!wExercises.length) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Este treino não tem exercícios"
        description="Adicione exercícios em Plano de treino."
        action={
          <Button asChild variant="outline">
            <Link to="/treino">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={workout.name}
        description={`${workout.weekdayLabel}${!isToday ? ` · sessão retroativa` : ""} · confira os alvos e registre cada série.`}
        icon={Dumbbell}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/treino">
              <ArrowLeft className="size-4" />
              Trocar treino
            </Link>
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Timer className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isToday
                  ? activeLog
                    ? "Sessão em andamento"
                    : "Sessão de hoje"
                  : activeLog
                    ? "Editando sessão retroativa"
                    : "Nova sessão retroativa"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Label htmlFor="target-date" className="text-xs text-muted-foreground">
                  Data:
                </Label>
                <DateField
                  id="target-date"
                  value={targetDate}
                  min={settings?.startDate}
                  max={todayStr}
                  onChange={setTargetDate}
                  inputClassName="h-7 w-[130px] text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isToday && startedAt ? (
              <div
                className={`rounded-md border px-3 py-1.5 font-mono text-sm ${
                  overTime
                    ? "border-destructive/40 text-destructive"
                    : nearTime
                      ? "border-primary/40 text-primary"
                      : "border-border text-foreground"
                }`}
              >
                {mm}:{ss}
              </div>
            ) : null}
            {activeLog ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="size-4" />
                    Descartar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Descartar esta sessão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      As séries registradas em {formatShortDate(targetDate)} serão
                      removidas. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDiscard}>
                      Descartar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={handleStart}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {isToday ? <Play className="size-4" /> : <Check className="size-4" />}
                {isToday ? "Iniciar treino" : "Criar sessão nesta data"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {wExercises.map((we) => {
          const ex = exercises.find((e) => e.id === we.exerciseId);
          if (!ex) return null;
          const logged = activeSetLogs.filter(
            (s) => s.exerciseId === we.exerciseId,
          ).length;
          const ref = lastSessionFor(we.exerciseId);
          const suggestion = ref
            ? computeProgressionSuggestion({
                progressionDefault: ex.progressionDefault,
                repsTarget: we.repsTarget,
                lastLoadKg: ref.load,
                lastRepsDone: ref.reps,
                lastMaxDifficulty: ref.maxDifficulty,
              })
            : null;
          const exerciseLocked = rest?.exerciseId === we.exerciseId;
          return (
            <Card key={we.id} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {we.sortOrder}.
                      </span>
                      {ex.name}
                      {ex.kneeAlert ? <KneeAlertBadge note={ex.kneeNote} /> : null}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {ex.category} · progressão {ex.progressionDefault}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-muted-foreground">
                      {we.setsPlanned} séries
                    </span>
                    <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-muted-foreground">
                      {we.repsTarget} reps
                    </span>
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                      RIR {we.rirTarget ?? "N/A"}
                    </span>
                    <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-muted-foreground">
                      Descanso {formatRestDuration(we.restSeconds ?? defaultRestSeconds(ex.category))}
                    </span>
                  </div>
                </div>
                {we.notes ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {we.notes}
                  </p>
                ) : null}
                {ref ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                    <TrendingUp className="size-3.5" />
                    Referência anterior: {ref.load.toFixed(1).replace(".", ",")} kg
                    × {ref.reps} ({formatShortDate(ref.date)})
                  </p>
                ) : null}
                {suggestion ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Sparkles className="size-3.5" />
                      Sugestão para a próxima sessão: {suggestion.loadKg.toFixed(1).replace(".", ",")} kg
                      {suggestion.keepSameLoad ? " (mesma carga)" : ""} · {suggestion.repsHint}
                      <span className="font-normal text-primary/80">
                        — {suggestion.reason} · Descanso entre séries:{" "}
                        {formatRestDuration(we.restSeconds ?? defaultRestSeconds(ex.category))}
                      </span>
                    </p>
                    {activeLog ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-primary/40 text-primary hover:bg-primary/15"
                        onClick={() =>
                          applySuggestion(
                            we.exerciseId,
                            we.setsPlanned,
                            suggestion.loadKg,
                            suggestion.repsAutofill,
                          )
                        }
                      >
                        Usar sugestão
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {exerciseLocked ? (
                  <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                    <Lock className="size-3.5" />
                    Descansando — acompanhe o cronômetro no canto da tela. A
                    próxima série libera ao final.
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {Array.from({ length: we.setsPlanned }).map((_, i) => {
                  const setNumber = i + 1;
                  const key = `${we.exerciseId}__${setNumber}`;
                  const d = drafts[key] ?? emptyDraft;
                  const savedLog = activeSetLogs.find(
                    (s) =>
                      s.exerciseId === we.exerciseId && s.setNumber === setNumber,
                  );
                  const saved = !!savedLog;
                  const disabled = !activeLog || exerciseLocked;
                  return (
                    <div
                      key={setNumber}
                      className={`grid grid-cols-2 items-end gap-2 rounded-lg border border-border bg-muted/20 p-3 transition-opacity sm:grid-cols-[auto_1fr_1fr_1.4fr_auto] ${
                        exerciseLocked ? "opacity-60" : ""
                      }`}
                    >
                      <div className="col-span-1 flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                          {setNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">Série</span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Carga (kg)
                        </Label>
                        <Input
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          placeholder="0"
                          value={d.load}
                          disabled={disabled}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [key]: { ...d, load: e.target.value },
                            }))
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Reps
                        </Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={d.reps}
                          disabled={disabled}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [key]: { ...d, reps: e.target.value },
                            }))
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Dificuldade
                        </Label>
                        <Select
                          value={String(d.difficulty)}
                          disabled={disabled}
                          onValueChange={(v) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [key]: { ...d, difficulty: Number(v) },
                            }))
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 4, 3, 2, 1].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n} · {DIFFICULTY[n]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        variant={saved ? "secondary" : "default"}
                        disabled={disabled}
                        onClick={() => handleSaveSet(we.exerciseId, setNumber)}
                        className="h-9"
                      >
                        <Check className="size-4" />
                        {saved ? "Salvar" : "Registrar"}
                      </Button>
                      {savedLog?.restTakenSeconds != null ? (
                        <span
                          className={`col-span-2 -mt-1 flex items-center gap-1 text-[11px] sm:col-span-5 ${
                            savedLog.restEndedEarly ? "text-chart-3" : "text-muted-foreground"
                          }`}
                        >
                          <Timer className="size-3" />
                          {savedLog.restEndedEarly ? "Descanso encurtado" : "Descanso realizado"}:{" "}
                          {formatRestDuration(savedLog.restTakenSeconds)}
                          {savedLog.restEndedEarly
                            ? ` de ${formatRestDuration(
                                we.restSeconds ?? defaultRestSeconds(ex.category),
                              )} planejados`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
                <div className="pt-1 text-right text-xs text-muted-foreground">
                  {logged}/{we.setsPlanned} séries registradas
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
