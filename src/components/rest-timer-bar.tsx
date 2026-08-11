import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GripHorizontal, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRestTimer } from "@/hooks/use-rest-timer";
import { formatCountdown } from "@/lib/rest";

const POSITION_KEY = "tf:restTimerPos";

interface Point {
  x: number;
  y: number;
}

function loadPosition(): Point | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? (JSON.parse(raw) as Point) : null;
  } catch {
    return null;
  }
}

// Floating, app-wide, draggable rest countdown — styled like a stadium
// scoreboard. Rendered once inside AppShell so it survives navigation: the
// athlete can browse the rest of the app while resting between sets. When
// the planned rest elapses (or is ended early), it finalizes automatically
// and takes the athlete back to the workout to unlock the next set.
export function RestTimerBar() {
  const { rest, remainingSeconds, extendRest, finishRest } = useRestTimer();
  const navigate = useNavigate();
  const location = useLocation();
  const finishingRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [position, setPosition] = useState<Point | null>(() => loadPosition());
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!rest || remainingSeconds > 0 || finishingRef.current) return;
    finishingRef.current = true;
    const workoutId = rest.workoutId;
    void finishRest(false).then(() => {
      finishingRef.current = false;
      if (location.pathname !== `/treino/${workoutId}`) {
        navigate(`/treino/${workoutId}`);
      }
    });
  }, [rest, remainingSeconds, finishRest, navigate, location.pathname]);

  if (!rest) return null;

  const handleFinishEarly = async () => {
    const workoutId = rest.workoutId;
    await finishRest(true);
    if (location.pathname !== `/treino/${workoutId}`) {
      navigate(`/treino/${workoutId}`);
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    const card = e.currentTarget.closest("[data-rest-card]") as HTMLElement | null;
    const rect = card?.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position?.x ?? rect?.left ?? window.innerWidth / 2 - 160,
      originY: position?.y ?? rect?.top ?? 80,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setDragging(false);
    setPosition((p) => {
      if (p && typeof localStorage !== "undefined") {
        localStorage.setItem(POSITION_KEY, JSON.stringify(p));
      }
      return p;
    });
  };

  const style: CSSProperties = position
    ? { left: position.x, top: position.y }
    : { left: "50%", top: "4.5rem", transform: "translateX(-50%)" };

  return (
    <div
      data-rest-card
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`pointer-events-auto fixed z-50 w-[min(90vw,21rem)] touch-none select-none rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-card to-background shadow-glow ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={style}
    >
      <div className="flex items-center justify-center gap-1 rounded-t-2xl border-b border-primary/20 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        <GripHorizontal className="size-3.5" />
        Descanso — arraste para mover
        <GripHorizontal className="size-3.5" />
      </div>
      <div className="flex flex-col items-center gap-1 px-4 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <TimerReset className="size-6 text-primary" />
          <p className="font-mono text-5xl font-bold leading-none tracking-tight text-primary tabular-nums">
            {formatCountdown(Math.max(remainingSeconds, 0))}
          </p>
        </div>
        <p className="max-w-full truncate text-sm text-muted-foreground">
          {rest.exerciseName}
        </p>
        <div data-no-drag className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={extendRest}>
            +30s
          </Button>
          <Button size="sm" onClick={handleFinishEarly}>
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}
