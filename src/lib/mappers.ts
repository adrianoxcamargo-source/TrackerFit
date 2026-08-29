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

type Row = Record<string, unknown>;
const n = (v: unknown) => (typeof v === "number" ? v : Number(v));
const optionalNumber = (v: unknown) => v == null ? undefined : n(v);

/* ----------------------------- Exercises ----------------------------- */
export function mapExercise(r: Row): Exercise {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Exercise["category"],
    progressionDefault: r.progression_default as string,
    kneeAlert: !!r.knee_alert,
    kneeNote: (r.knee_note as string) ?? undefined,
    sortOrder: n(r.sort_order),
  };
}
export function exerciseToRow(e: Partial<Exercise>): Row {
  const o: Row = {};
  if ("name" in e) o.name = e.name;
  if ("category" in e) o.category = e.category;
  if ("progressionDefault" in e) o.progression_default = e.progressionDefault;
  if ("kneeAlert" in e) o.knee_alert = e.kneeAlert;
  if ("kneeNote" in e) o.knee_note = e.kneeNote;
  if ("sortOrder" in e) o.sort_order = e.sortOrder;
  return o;
}

/* ------------------------------ Workouts ------------------------------ */
export function mapWorkout(r: Row): Workout {
  return {
    id: r.id as string,
    name: r.name as string,
    weekdayLabel: r.weekday_label as string,
    sortOrder: n(r.sort_order),
  };
}
export function workoutToRow(w: Partial<Workout>): Row {
  const o: Row = {};
  if ("name" in w) o.name = w.name;
  if ("weekdayLabel" in w) o.weekday_label = w.weekdayLabel;
  if ("sortOrder" in w) o.sort_order = w.sortOrder;
  return o;
}

/* -------------------------- WorkoutExercises -------------------------- */
export function mapWorkoutExercise(r: Row): WorkoutExercise {
  return {
    id: r.id as string,
    workoutId: r.workout_id as string,
    exerciseId: r.exercise_id as string,
    sortOrder: n(r.sort_order),
    setsPlanned: n(r.sets_planned),
    repsTarget: r.reps_target as string,
    rirTarget: r.rir_target == null ? null : n(r.rir_target),
    restSeconds: r.rest_seconds == null ? null : n(r.rest_seconds),
    notes: (r.notes as string) ?? undefined,
  };
}
export function workoutExerciseToRow(we: Partial<WorkoutExercise>): Row {
  const o: Row = {};
  if ("workoutId" in we) o.workout_id = we.workoutId;
  if ("exerciseId" in we) o.exercise_id = we.exerciseId;
  if ("sortOrder" in we) o.sort_order = we.sortOrder;
  if ("setsPlanned" in we) o.sets_planned = we.setsPlanned;
  if ("repsTarget" in we) o.reps_target = we.repsTarget;
  if ("rirTarget" in we) o.rir_target = we.rirTarget;
  if ("restSeconds" in we) o.rest_seconds = we.restSeconds;
  if ("notes" in we) o.notes = we.notes;
  return o;
}

/* -------------------------- ProgramSettings -------------------------- */
export function mapProgramSettings(r: Row): ProgramSettings {
  return {
    startDate: r.start_date as string,
    durationDays: n(r.duration_days),
    currentWeightKg: n(r.current_weight_kg),
    currentBodyfatPct: n(r.current_bodyfat_pct),
    goalWeightKg: n(r.goal_weight_kg),
    goalBodyfatPct: n(r.goal_bodyfat_pct),
    sessionMaxMinutes: n(r.session_max_minutes),
  };
}
export function programSettingsToRow(s: Partial<ProgramSettings>): Row {
  const o: Row = {};
  if ("startDate" in s) o.start_date = s.startDate;
  if ("durationDays" in s) o.duration_days = s.durationDays;
  if ("currentWeightKg" in s) o.current_weight_kg = s.currentWeightKg;
  if ("currentBodyfatPct" in s) o.current_bodyfat_pct = s.currentBodyfatPct;
  if ("goalWeightKg" in s) o.goal_weight_kg = s.goalWeightKg;
  if ("goalBodyfatPct" in s) o.goal_bodyfat_pct = s.goalBodyfatPct;
  if ("sessionMaxMinutes" in s) o.session_max_minutes = s.sessionMaxMinutes;
  return o;
}

/* ---------------------------- WorkoutLogs ---------------------------- */
export function mapWorkoutLog(r: Row): WorkoutLog {
  return {
    id: r.id as string,
    workoutId: r.workout_id as string,
    performedAt: r.performed_at as string,
    notes: (r.notes as string) ?? undefined,
  };
}
export function workoutLogToRow(l: Partial<WorkoutLog>): Row {
  const o: Row = {};
  if ("workoutId" in l) o.workout_id = l.workoutId;
  if ("performedAt" in l) o.performed_at = l.performedAt;
  if ("notes" in l) o.notes = l.notes;
  return o;
}

/* ------------------------------ SetLogs ------------------------------ */
export function mapSetLog(r: Row): SetLog {
  return {
    id: r.id as string,
    workoutLogId: r.workout_log_id as string,
    exerciseId: r.exercise_id as string,
    setNumber: n(r.set_number),
    loadKg: n(r.load_kg),
    repsDone: n(r.reps_done),
    difficulty: n(r.difficulty),
    restTakenSeconds: r.rest_taken_seconds == null ? undefined : n(r.rest_taken_seconds),
    notes: (r.notes as string) ?? undefined,
  };
}
export function setLogToRow(s: Partial<SetLog>): Row {
  const o: Row = {};
  if ("workoutLogId" in s) o.workout_log_id = s.workoutLogId;
  if ("exerciseId" in s) o.exercise_id = s.exerciseId;
  if ("setNumber" in s) o.set_number = s.setNumber;
  if ("loadKg" in s) o.load_kg = s.loadKg;
  if ("repsDone" in s) o.reps_done = s.repsDone;
  if ("difficulty" in s) o.difficulty = s.difficulty;
  if ("restTakenSeconds" in s) o.rest_taken_seconds = s.restTakenSeconds;
  if ("notes" in s) o.notes = s.notes;
  return o;
}

/* ---------------------------- BodyMetrics ---------------------------- */
export function mapBodyMetric(r: Row): BodyMetric {
  return {
    id: r.id as string,
    recordedAt: r.recorded_at as string,
    weightKg: n(r.weight_kg),
    bodyfatPct: r.bodyfat_pct == null ? undefined : n(r.bodyfat_pct),
    bioimpedanceBodyfatPct: optionalNumber(r.bioimpedance_bodyfat_pct),
    bioimpedanceMusclePct: optionalNumber(r.bioimpedance_muscle_pct),
    fatMassKg: optionalNumber(r.fat_mass_kg),
    leanMassKg: optionalNumber(r.lean_mass_kg),
    visceralFat: optionalNumber(r.visceral_fat),
    metabolicRateKcal: optionalNumber(r.metabolic_rate_kcal),
    heightCm: optionalNumber(r.height_cm),
    skinfoldSubscapularMm: optionalNumber(r.skinfold_subscapular_mm),
    skinfoldTricepsMm: optionalNumber(r.skinfold_triceps_mm),
    skinfoldChestMm: optionalNumber(r.skinfold_chest_mm),
    skinfoldAxillaryMm: optionalNumber(r.skinfold_axillary_mm),
    skinfoldObliqueMm: optionalNumber(r.skinfold_oblique_mm),
    skinfoldAbdominalMm: optionalNumber(r.skinfold_abdominal_mm),
    skinfoldThighMm: optionalNumber(r.skinfold_thigh_mm),
    chestCm: optionalNumber(r.chest_cm),
    waistCm: optionalNumber(r.waist_cm),
    abdomenCm: optionalNumber(r.abdomen_cm),
    hipCm: optionalNumber(r.hip_cm),
    rightArmCm: optionalNumber(r.right_arm_cm),
    leftArmCm: optionalNumber(r.left_arm_cm),
    rightThighCm: optionalNumber(r.right_thigh_cm),
    leftThighCm: optionalNumber(r.left_thigh_cm),
    rightCalfCm: optionalNumber(r.right_calf_cm),
    leftCalfCm: optionalNumber(r.left_calf_cm),
    notes: (r.notes as string) ?? undefined,
  };
}
export function bodyMetricToRow(b: Partial<BodyMetric>): Row {
  const o: Row = {};
  if ("recordedAt" in b) o.recorded_at = b.recordedAt;
  if ("weightKg" in b) o.weight_kg = b.weightKg;
  if ("bodyfatPct" in b) o.bodyfat_pct = b.bodyfatPct;
  if ("bioimpedanceBodyfatPct" in b) o.bioimpedance_bodyfat_pct = b.bioimpedanceBodyfatPct;
  if ("bioimpedanceMusclePct" in b) o.bioimpedance_muscle_pct = b.bioimpedanceMusclePct;
  if ("fatMassKg" in b) o.fat_mass_kg = b.fatMassKg;
  if ("leanMassKg" in b) o.lean_mass_kg = b.leanMassKg;
  if ("visceralFat" in b) o.visceral_fat = b.visceralFat;
  if ("metabolicRateKcal" in b) o.metabolic_rate_kcal = b.metabolicRateKcal;
  if ("heightCm" in b) o.height_cm = b.heightCm;
  if ("skinfoldSubscapularMm" in b) o.skinfold_subscapular_mm = b.skinfoldSubscapularMm;
  if ("skinfoldTricepsMm" in b) o.skinfold_triceps_mm = b.skinfoldTricepsMm;
  if ("skinfoldChestMm" in b) o.skinfold_chest_mm = b.skinfoldChestMm;
  if ("skinfoldAxillaryMm" in b) o.skinfold_axillary_mm = b.skinfoldAxillaryMm;
  if ("skinfoldObliqueMm" in b) o.skinfold_oblique_mm = b.skinfoldObliqueMm;
  if ("skinfoldAbdominalMm" in b) o.skinfold_abdominal_mm = b.skinfoldAbdominalMm;
  if ("skinfoldThighMm" in b) o.skinfold_thigh_mm = b.skinfoldThighMm;
  if ("chestCm" in b) o.chest_cm = b.chestCm;
  if ("waistCm" in b) o.waist_cm = b.waistCm;
  if ("abdomenCm" in b) o.abdomen_cm = b.abdomenCm;
  if ("hipCm" in b) o.hip_cm = b.hipCm;
  if ("rightArmCm" in b) o.right_arm_cm = b.rightArmCm;
  if ("leftArmCm" in b) o.left_arm_cm = b.leftArmCm;
  if ("rightThighCm" in b) o.right_thigh_cm = b.rightThighCm;
  if ("leftThighCm" in b) o.left_thigh_cm = b.leftThighCm;
  if ("rightCalfCm" in b) o.right_calf_cm = b.rightCalfCm;
  if ("leftCalfCm" in b) o.left_calf_cm = b.leftCalfCm;
  if ("notes" in b) o.notes = b.notes;
  return o;
}

/* ----------------------------- CardioLogs ---------------------------- */
export function mapCardioLog(r: Row): CardioLog {
  return {
    id: r.id as string,
    performedAt: r.performed_at as string,
    durationMin: n(r.duration_min),
    activityType: (r.activity_type as string) ?? undefined,
    distanceKm: r.distance_km == null ? undefined : n(r.distance_km),
    avgHeartRate: r.avg_heart_rate == null ? undefined : n(r.avg_heart_rate),
    calories: r.calories == null ? undefined : n(r.calories),
    steps: r.steps == null ? undefined : n(r.steps),
    elevationGainM: r.elevation_gain_m == null ? undefined : n(r.elevation_gain_m),
    avgCadence: r.avg_cadence == null ? undefined : n(r.avg_cadence),
    notes: (r.notes as string) ?? undefined,
  };
}
export function cardioLogToRow(c: Partial<CardioLog>): Row {
  const o: Row = {};
  if ("performedAt" in c) o.performed_at = c.performedAt;
  if ("durationMin" in c) o.duration_min = c.durationMin;
  if ("activityType" in c) o.activity_type = c.activityType;
  if ("distanceKm" in c) o.distance_km = c.distanceKm;
  if ("avgHeartRate" in c) o.avg_heart_rate = c.avgHeartRate;
  if ("calories" in c) o.calories = c.calories;
  if ("steps" in c) o.steps = c.steps;
  if ("elevationGainM" in c) o.elevation_gain_m = c.elevationGainM;
  if ("avgCadence" in c) o.avg_cadence = c.avgCadence;
  if ("notes" in c) o.notes = c.notes;
  return o;
}

/* ------------------------------ Profile ------------------------------ */
export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: "atleta" | "treinador";
  biological_sex?: "masculino" | "feminino";
  birth_date?: string;
}
export function mapProfile(r: Row): ProfileRow {
  return {
    id: r.id as string,
    email: r.email as string,
    full_name: (r.full_name as string) ?? "",
    role: (r.role as "atleta" | "treinador") ?? "atleta",
    biological_sex: (r.biological_sex as "masculino" | "feminino") ?? undefined,
    birth_date: (r.birth_date as string) ?? undefined,
  };
}
