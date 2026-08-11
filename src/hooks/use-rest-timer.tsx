/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSetLogs } from "@/lib/store";

export interface RestState {
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  setLogId: string;
  targetSeconds: number;
  startedAt: number;
}

interface RestTimerContextValue {
  rest: RestState | null;
  remainingSeconds: number;
  startRest: (state: RestState) => void;
  extendRest: () => void;
  /** early=true means the athlete tapped "Finalizar" before time was up. */
  finishRest: (early: boolean) => Promise<void>;
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

// Lives above the router so the countdown survives navigation — the athlete
// can check the dashboard, history, etc. while resting between sets.
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [rest, setRest] = useState<RestState | null>(null);
  const [now, setNow] = useState(Date.now());
  const { update: updateSet } = useSetLogs();

  useEffect(() => {
    if (!rest) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [rest]);

  const remainingSeconds = rest
    ? rest.targetSeconds - Math.floor((now - rest.startedAt) / 1000)
    : 0;

  const startRest = useCallback((state: RestState) => setRest(state), []);

  const extendRest = useCallback(() => {
    setRest((prev) =>
      prev ? { ...prev, targetSeconds: prev.targetSeconds + 30 } : prev,
    );
  }, []);

  const finishRest = useCallback(
    async (early: boolean) => {
      if (!rest) return;
      const elapsed = early
        ? Math.max(0, Math.round((Date.now() - rest.startedAt) / 1000))
        : rest.targetSeconds;
      await updateSet(rest.setLogId, {
        restTakenSeconds: elapsed,
        restEndedEarly: early,
      });
      setRest(null);
    },
    [rest, updateSet],
  );

  return (
    <RestTimerContext.Provider
      value={{ rest, remainingSeconds, startRest, extendRest, finishRest }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error("useRestTimer must be used within RestTimerProvider");
  return ctx;
}
