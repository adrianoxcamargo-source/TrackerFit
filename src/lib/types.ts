// Domain types for TrackerFit (camelCase). Mapped to snake_case DB rows in mappers.ts.

export type Category =
  | "Composto"
  | "Composto Guiado"
  | "Isolador"
  | "Isolador Guiado"
  | "Core";

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  progressionDefault: string;
  kneeAlert: boolean;
  kneeNote?: string;
  sortOrder: number;
}

export interface Workout {
  id: string;
  name: string;
  weekdayLabel: string;
  sortOrder: number;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sortOrder: number;
  setsPlanned: number;
  repsTarget: string;
  rirTarget: number | null;
  restSeconds: number | null;
  notes?: string;
}

export interface ProgramSettings {
  startDate: string; // yyyy-mm-dd
  durationDays: number;
  currentWeightKg: number;
  currentBodyfatPct: number;
  goalWeightKg: number;
  goalBodyfatPct: number;
  sessionMaxMinutes: number;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  performedAt: string; // yyyy-mm-dd
  notes?: string;
}

export interface SetLog {
  id: string;
  workoutLogId: string;
  exerciseId: string;
  setNumber: number;
  loadKg: number;
  repsDone: number;
  difficulty: number; // 1..5
  restTakenSeconds?: number;
  notes?: string;
}

export interface BodyMetric {
  id: string;
  recordedAt: string; // yyyy-mm-dd
  weightKg: number;
  bodyfatPct?: number;
}

export interface CardioLog {
  id: string;
  performedAt: string; // yyyy-mm-dd
  durationMin: number;
  activityType?: string;
  distanceKm?: number;
  avgHeartRate?: number;
  calories?: number;
  steps?: number;
  elevationGainM?: number;
  avgCadence?: number;
  notes?: string;
}
