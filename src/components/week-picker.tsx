import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatShortDate } from "@/lib/format";
import type { WeekMeta } from "@/lib/programPhase";

interface WeekPickerProps {
  weeks: WeekMeta[];
  selectedWeek: number;
  currentWeek: number;
  onChange: (week: number) => void;
}

export function WeekPicker({
  weeks,
  selectedWeek,
  currentWeek,
  onChange,
}: WeekPickerProps) {
  const grouped = weeks.reduce<Record<string, WeekMeta[]>>((acc, w) => {
    (acc[w.mesocycleLabel] ??= []).push(w);
    return acc;
  }, {});
  const min = weeks[0]?.week ?? 1;
  const max = weeks[weeks.length - 1]?.week ?? 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        disabled={selectedWeek <= min}
        onClick={() => onChange(selectedWeek - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Select
        value={String(selectedWeek)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(grouped).map(([label, ws]) => (
            <SelectGroup key={label}>
              <SelectLabel>{label}</SelectLabel>
              {ws.map((w) => (
                <SelectItem key={w.week} value={String(w.week)}>
                  Semana {w.week} · {formatShortDate(w.startDate)}–
                  {formatShortDate(w.endDate)}
                  {w.week === currentWeek ? " (atual)" : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        disabled={selectedWeek >= max}
        onClick={() => onChange(selectedWeek + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
      {selectedWeek !== currentWeek ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(currentWeek)}>
          <RotateCcw className="size-3.5" />
          Semana atual
        </Button>
      ) : null}
    </div>
  );
}
