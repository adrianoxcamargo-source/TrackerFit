import type {
  Category,
  Exercise,
  ProgramSettings,
  Workout,
  WorkoutExercise,
} from "@/lib/types";
import { todayISO } from "@/lib/format";
import { defaultRestSeconds } from "@/lib/rest";

export const DEFAULT_SETTINGS: ProgramSettings = {
  startDate: todayISO(),
  durationDays: 60,
  currentWeightKg: 82.9,
  currentBodyfatPct: 18.3,
  goalWeightKg: 80,
  goalBodyfatPct: 10,
  sessionMaxMinutes: 50,
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

interface ExDef {
  slug: string;
  name: string;
  category: Category;
  progression: string;
  knee: boolean;
  kneeNote?: string;
}

// Exact 20 exercises from the athlete's program (EX01–EX20).
const EX_DEFS: ExDef[] = [
  { slug: "ex01", name: "Supino Reto com Barra", category: "Composto", progression: "+ 2,5 kg", knee: false },
  { slug: "ex02", name: "Levantamento Terra Romeno (Halteres)", category: "Composto", progression: "+ 2,5 kg", knee: true, kneeNote: "Manter semi-fletido, não ir ao chão." },
  { slug: "ex03", name: "Press Militar com Halteres (Sentado)", category: "Composto", progression: "+ 2,5 kg", knee: false },
  { slug: "ex04", name: "Leg Press 45°", category: "Composto Guiado", progression: "+ 2,5 kg", knee: true, kneeNote: "CUIDADO: Amplitude máx 90°. Não forçar além." },
  { slug: "ex05", name: "Tríceps Corda na Polia", category: "Isolador", progression: "+ 1,0 kg", knee: false },
  { slug: "ex06", name: "Prancha Abdominal", category: "Core", progression: "N/A", knee: false },
  { slug: "ex07", name: "Elevação de Pernas", category: "Core", progression: "N/A", knee: false },
  { slug: "ex08", name: "Barra Fixa ou Puxada Pronada", category: "Composto", progression: "+ 2,5 kg", knee: false },
  { slug: "ex09", name: "Hip Thrust na Máquina ou Barra", category: "Composto Guiado", progression: "+ 2,5 kg", knee: true, kneeNote: "Seguro — não flexionar além de 90°." },
  { slug: "ex10", name: "Remada Curvada com Barra", category: "Composto", progression: "+ 2,5 kg", knee: false },
  { slug: "ex11", name: "Mesa Flexora", category: "Isolador Guiado", progression: "+ 1,0 kg", knee: true, kneeNote: "ATENÇÃO: Checar dor. Se doer, trocar por GHD." },
  { slug: "ex12", name: "Elevação Lateral na Polia (Unilateral)", category: "Isolador", progression: "+ 1,0 kg", knee: false },
  { slug: "ex13", name: "Crunch Abdominal", category: "Core", progression: "N/A", knee: false },
  { slug: "ex14", name: "Rotação com Cabo (Oblíquo)", category: "Core", progression: "N/A", knee: false },
  { slug: "ex15", name: "Agachamento no Smith (Parcial)", category: "Composto Guiado", progression: "+ 2,5 kg", knee: true, kneeNote: "CUIDADO: Amplitude máx 90°, sem dor." },
  { slug: "ex16", name: "Supino Inclinado com Halteres", category: "Composto", progression: "+ 2,5 kg", knee: false },
  { slug: "ex17", name: "Remada Baixa na Polia (Neutra)", category: "Composto Guiado", progression: "+ 2,5 kg", knee: false },
  { slug: "ex18", name: "Desenvolvimento Arnold (Sentado)", category: "Composto", progression: "+ 2,5 kg", knee: false },
  { slug: "ex19", name: "Rosca Bayesian na Polia (Unilateral)", category: "Isolador", progression: "+ 1,0 kg", knee: false },
  { slug: "ex20", name: "Prancha Lateral", category: "Core", progression: "N/A", knee: false },
];

interface WeDef {
  wk: "a" | "b" | "c";
  ex: string;
  sort: number;
  sets: number;
  reps: string;
  rir: number | null;
  notes?: string;
}

// Exact 3 workouts (Treino A/Seg, B/Qua, C/Sex) from the athlete's program.
const WE_DEFS: WeDef[] = [
  { wk: "a", ex: "ex01", sort: 1, sets: 3, reps: "5-7", rir: 3, notes: "Principal do dia" },
  { wk: "a", ex: "ex02", sort: 2, sets: 3, reps: "8-10", rir: 3, notes: "Foco posterior" },
  { wk: "a", ex: "ex03", sort: 3, sets: 3, reps: "8-10", rir: 3, notes: "Cotovelo à frente" },
  { wk: "a", ex: "ex04", sort: 4, sets: 3, reps: "10-12", rir: 2, notes: "Pés na posição média" },
  { wk: "a", ex: "ex05", sort: 5, sets: 3, reps: "12-15", rir: 2, notes: "Drop set a partir da semana 6" },
  { wk: "a", ex: "ex06", sort: 6, sets: 2, reps: "30s", rir: null, notes: "Superset com Elevação de Pernas" },
  { wk: "a", ex: "ex07", sort: 7, sets: 2, reps: "12", rir: null, notes: "Sem descanso" },
  { wk: "b", ex: "ex08", sort: 1, sets: 3, reps: "5-7", rir: 3, notes: "Usar contrapeso se < 5 reps" },
  { wk: "b", ex: "ex09", sort: 2, sets: 3, reps: "10-12", rir: 3, notes: "Foco glúteo" },
  { wk: "b", ex: "ex10", sort: 3, sets: 3, reps: "6-8", rir: 3, notes: "Tronco a 45°" },
  { wk: "b", ex: "ex11", sort: 4, sets: 3, reps: "10-12", rir: 2, notes: "Foco posterior" },
  { wk: "b", ex: "ex12", sort: 5, sets: 3, reps: "12-15", rir: 2, notes: "Drop set a partir da semana 6" },
  { wk: "b", ex: "ex13", sort: 6, sets: 2, reps: "15", rir: null, notes: "Superset com Rotação com Cabo" },
  { wk: "b", ex: "ex14", sort: 7, sets: 2, reps: "15", rir: null, notes: "Foco no flanco" },
  { wk: "c", ex: "ex15", sort: 1, sets: 3, reps: "8-10", rir: 3, notes: "Alternativa: Hack Squat" },
  { wk: "c", ex: "ex16", sort: 2, sets: 3, reps: "8-10", rir: 3, notes: "Cotovelos para dentro" },
  { wk: "c", ex: "ex17", sort: 3, sets: 3, reps: "8-10", rir: 3, notes: "Foco no alongamento" },
  { wk: "c", ex: "ex18", sort: 4, sets: 3, reps: "8-10", rir: 2, notes: "Movimento controlado" },
  { wk: "c", ex: "ex19", sort: 5, sets: 3, reps: "12-15", rir: 2, notes: "Drop set a partir da semana 6" },
  { wk: "c", ex: "ex07", sort: 6, sets: 2, reps: "15", rir: null, notes: "Superset com Prancha Lateral" },
  { wk: "c", ex: "ex20", sort: 7, sets: 2, reps: "30s", rir: null, notes: "30s cada lado" },
];

export function buildDefaultPlan() {
  const exIdBySlug: Record<string, string> = {};
  const exCategoryBySlug: Record<string, Category> = {};
  const exercises: Exercise[] = EX_DEFS.map((d, i) => {
    const id = newId();
    exIdBySlug[d.slug] = id;
    exCategoryBySlug[d.slug] = d.category;
    return {
      id,
      name: d.name,
      category: d.category,
      progressionDefault: d.progression,
      kneeAlert: d.knee,
      kneeNote: d.kneeNote,
      sortOrder: i + 1,
    };
  });

  const wId: Record<"a" | "b" | "c", string> = {
    a: newId(),
    b: newId(),
    c: newId(),
  };
  const workouts: Workout[] = [
    { id: wId.a, name: "Treino A", weekdayLabel: "Segunda", sortOrder: 1 },
    { id: wId.b, name: "Treino B", weekdayLabel: "Quarta", sortOrder: 2 },
    { id: wId.c, name: "Treino C", weekdayLabel: "Sexta", sortOrder: 3 },
  ];

  const workoutExercises: WorkoutExercise[] = WE_DEFS.map((d) => ({
    id: newId(),
    workoutId: wId[d.wk],
    exerciseId: exIdBySlug[d.ex],
    sortOrder: d.sort,
    setsPlanned: d.sets,
    repsTarget: d.reps,
    rirTarget: d.rir,
    restSeconds: defaultRestSeconds(exCategoryBySlug[d.ex]),
    notes: d.notes,
  }));

  return { exercises, workouts, workoutExercises, settings: DEFAULT_SETTINGS };
}
