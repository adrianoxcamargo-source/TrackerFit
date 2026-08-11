// Progressive-overload suggestion for the next session of an exercise.
//
// Rule (from the training program):
// - Default: add the exercise's standard increment (e.g. "+ 2,5 kg") to the
//   last logged load, keeping the planned rep target.
// - Exception: if the hardest set logged last time was rated "Difícil" (4) or
//   "Falha" (5), the load stays the same next session — only try 1–2 more reps.
// - Exercises with no load progression (progressionDefault "N/A", e.g. core/
//   time-based work) have no suggestion.

export interface ProgressionSuggestion {
  loadKg: number;
  repsHint: string;
  repsAutofill: number | null;
  reason: string;
  keepSameLoad: boolean;
}

export function parseIncrementKg(progressionDefault: string): number | null {
  if (!progressionDefault) return null;
  if (progressionDefault.trim().toUpperCase() === "N/A") return null;
  const match = progressionDefault.match(/([\d.,]+)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function parseRepsLowerBound(repsTarget: string): number | null {
  const match = repsTarget?.match(/(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

export function computeProgressionSuggestion(params: {
  progressionDefault: string;
  repsTarget: string;
  lastLoadKg: number;
  lastRepsDone: number;
  lastMaxDifficulty: number;
}): ProgressionSuggestion | null {
  const increment = parseIncrementKg(params.progressionDefault);
  if (increment == null) return null;

  const wasHard = params.lastMaxDifficulty >= 4;

  if (wasHard) {
    return {
      loadKg: params.lastLoadKg,
      repsHint: `${params.lastRepsDone + 1}–${params.lastRepsDone + 2} reps`,
      repsAutofill: params.lastRepsDone + 1,
      reason: "Sessão anterior difícil — mantenha a carga e tente mais reps",
      keepSameLoad: true,
    };
  }

  const targetLower = parseRepsLowerBound(params.repsTarget);
  return {
    loadKg: Number((params.lastLoadKg + increment).toFixed(1)),
    repsHint: params.repsTarget,
    repsAutofill: targetLower ?? params.lastRepsDone,
    reason: `Progressão padrão (+${increment.toFixed(1).replace(".", ",")} kg)`,
    keepSameLoad: false,
  };
}
