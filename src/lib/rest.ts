// Rest time between sets. Each exercise can define an exact planned rest
// (from the athlete's program); when it isn't set yet, we fall back to a
// generic guideline by category — adjust the real value in Plano de treino.
import type { Category } from "@/lib/types";

export function defaultRestSeconds(category: Category): number {
  switch (category) {
    case "Composto":
    case "Composto Guiado":
      return 150; // 2:30 — compound work near failure needs full recovery
    case "Isolador":
    case "Isolador Guiado":
      return 90; // 1:30
    default:
      return 45; // Core / time-based work
  }
}

export function formatRestDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  if (r === 0) return `${m} min`;
  return `${m}min ${r}s`;
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
