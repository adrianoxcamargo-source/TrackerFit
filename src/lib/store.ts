import { useQuery, useQueryClient } from "@tanstack/react-query";
import { from } from "@/lib/db";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import * as M from "@/lib/mappers";
import { buildDefaultPlan, DEFAULT_SETTINGS } from "@/lib/defaultPlan";
import type {
  BodyMetric,
  CardioLog,
  Exercise,
  ProgramSettings,
  SetLog,
  Workout,
  WorkoutExercise,
  WorkoutLog,
} from "@/lib/types";

export { DEFAULT_SETTINGS };

export const KEYS = {
  settings: "settings",
  exercises: "exercises",
  workouts: "workouts",
  workoutExercises: "workoutExercises",
  workoutLogs: "workoutLogs",
  setLogs: "setLogs",
  bodyMetrics: "bodyMetrics",
  cardioLogs: "cardioLogs",
} as const;

type Row = Record<string, unknown>;

function useAthleteId() {
  return useActiveAthlete().activeAthleteId;
}

interface CollectionConfig<T> {
  table: string;
  key: string;
  map: (r: Row) => T;
  toRow: (item: Partial<T>) => Record<string, unknown>;
  extraInsert?: () => Record<string, unknown>;
}

function useCollection<T extends { id: string }>(cfg: CollectionConfig<T>) {
  const athleteId = useAthleteId();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: [cfg.key, athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data, error } = await from(cfg.table)
        .select("*")
        .eq("athlete_id", athleteId);
      if (error) throw error;
      return ((data as Row[]) ?? []).map(cfg.map);
    },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: [cfg.key] });

  const add = async (item: Omit<T, "id">): Promise<T | undefined> => {
    if (!athleteId) {
      toast.error("Nenhum atleta selecionado.");
      return undefined;
    }
    const payload = {
      ...cfg.toRow(item),
      athlete_id: athleteId,
      ...(cfg.extraInsert?.() ?? {}),
    };
    const { data, error } = await from(cfg.table)
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return undefined;
    }
    await invalidate();
    return cfg.map(data as Row);
  };

  const update = async (id: string, patch: Partial<T>) => {
    const payload = cfg.toRow(patch);
    const { error } = await from(cfg.table)
      .update(payload)
      .eq("id", id);
    if (error) toast.error(error.message);
    await invalidate();
  };

  const remove = async (id: string) => {
    const { error } = await from(cfg.table).delete().eq("id", id);
    if (error) toast.error(error.message);
    await invalidate();
  };

  return { items, add, update, remove, isLoading };
}

export const useExercises = () =>
  useCollection<Exercise>({
    table: "exercises",
    key: KEYS.exercises,
    map: M.mapExercise,
    toRow: M.exerciseToRow,
  });

export const useWorkouts = () =>
  useCollection<Workout>({
    table: "workouts",
    key: KEYS.workouts,
    map: M.mapWorkout,
    toRow: M.workoutToRow,
  });

export const useWorkoutExercises = () =>
  useCollection<WorkoutExercise>({
    table: "workout_exercises",
    key: KEYS.workoutExercises,
    map: M.mapWorkoutExercise,
    toRow: M.workoutExerciseToRow,
  });

export function useWorkoutLogs() {
  const { user } = useAuth();
  return useCollection<WorkoutLog>({
    table: "workout_logs",
    key: KEYS.workoutLogs,
    map: M.mapWorkoutLog,
    toRow: M.workoutLogToRow,
    extraInsert: () => ({ logged_by: user?.id ?? null }),
  });
}

export const useSetLogs = () =>
  useCollection<SetLog>({
    table: "set_logs",
    key: KEYS.setLogs,
    map: M.mapSetLog,
    toRow: M.setLogToRow,
  });

export const useBodyMetrics = () =>
  useCollection<BodyMetric>({
    table: "body_metrics",
    key: KEYS.bodyMetrics,
    map: M.mapBodyMetric,
    toRow: M.bodyMetricToRow,
  });

export const useCardioLogs = () =>
  useCollection<CardioLog>({
    table: "cardio_logs",
    key: KEYS.cardioLogs,
    map: M.mapCardioLog,
    toRow: M.cardioLogToRow,
  });

export function useSettings() {
  const athleteId = useAthleteId();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [KEYS.settings, athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data, error } = await from("program_settings")
        .select("*")
        .eq("athlete_id", athleteId)
        .maybeSingle();
      if (error) throw error;
      return data ? M.mapProgramSettings(data) : null;
    },
  });

  const setSettings = async (next: ProgramSettings) => {
    if (!athleteId) return;
    const row = {
      ...M.programSettingsToRow(next),
      athlete_id: athleteId,
      updated_at: new Date().toISOString(),
    };
    const { error } = await from("program_settings").upsert(row);
    if (error) toast.error(error.message);
    await qc.invalidateQueries({ queryKey: [KEYS.settings] });
  };

  return { settings: data ?? null, setSettings, isLoading };
}

export function useHasProgram() {
  const { settings, isLoading: sLoading } = useSettings();
  const { items: exercises, isLoading: eLoading } = useExercises();
  const { items: workouts, isLoading: wLoading } = useWorkouts();
  const loading = sLoading || eLoading || wLoading;
  return {
    hasProgram: !!settings && exercises.length > 0 && workouts.length > 0,
    loading,
  };
}

export function useImportDefaultPlan() {
  const athleteId = useAthleteId();
  const qc = useQueryClient();
  return async (): Promise<boolean> => {
    if (!athleteId) {
      toast.error("Nenhum atleta selecionado.");
      return false;
    }
    const plan = buildDefaultPlan();

    const { data: existing } = await from("program_settings")
      .select("athlete_id")
      .eq("athlete_id", athleteId)
      .maybeSingle();

    const ex = await from("exercises").insert(
        plan.exercises.map((e) => ({
          id: e.id,
          ...M.exerciseToRow(e),
          athlete_id: athleteId,
        })),
      );
    if (ex.error) {
      toast.error(ex.error.message);
      return false;
    }

    const w = await from("workouts").insert(
        plan.workouts.map((w2) => ({
          id: w2.id,
          ...M.workoutToRow(w2),
          athlete_id: athleteId,
        })),
      );
    if (w.error) {
      toast.error(w.error.message);
      return false;
    }

    const we = await from("workout_exercises").insert(
        plan.workoutExercises.map((x) => ({
          id: x.id,
          ...M.workoutExerciseToRow(x),
          athlete_id: athleteId,
        })),
      );
    if (we.error) {
      toast.error(we.error.message);
      return false;
    }

    if (!existing) {
      const ps = await from("program_settings").insert({
          ...M.programSettingsToRow(plan.settings),
          athlete_id: athleteId,
        });
      if (ps.error) {
        toast.error(ps.error.message);
        return false;
      }
    }

    await Promise.all(
      Object.values(KEYS).map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
    toast.success("Plano padrão importado.");
    return true;
  };
}

export function useResetProgram() {
  const athleteId = useAthleteId();
  const qc = useQueryClient();
  return async () => {
    if (!athleteId) return;
    const del = (t: string) =>
      from(t).delete().eq("athlete_id", athleteId);
    await del("set_logs");
    await del("workout_logs");
    await del("workout_exercises");
    await del("exercises");
    await del("workouts");
    await del("body_metrics");
    await del("cardio_logs");
    await del("program_settings");
    await Promise.all(
      Object.values(KEYS).map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
    toast.success("Dados do atleta apagados.");
  };
}
