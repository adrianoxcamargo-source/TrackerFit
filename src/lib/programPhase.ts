// Program phase calculation: maps start_date -> day/week/mesocycle/RIR target.
import { addDays, differenceInCalendarDays, formatISO } from "date-fns";

export interface ProgramPhase {
  startDate: string;
  endDate: string;
  totalDays: number;
  day: number;
  week: number;
  mesocycle: 1 | 2 | 0; // 0 = deload
  mesocycleLabel: string;
  phaseLabel: string;
  rirTarget: number;
  compoundRir: string;
  isolatorRir: string;
  dropSetsAllowed: boolean;
  isDeload: boolean;
  isComplete: boolean;
  notStarted: boolean;
  daysUntilStart: number;
  daysRemaining: number;
}

export interface WeekPhaseInfo {
  mesocycle: 1 | 2 | 0;
  mesocycleLabel: string;
  phaseLabel: string;
  rirTarget: number;
  compoundRir: string;
  isolatorRir: string;
  dropSetsAllowed: boolean;
  isDeload: boolean;
}

export interface WeekMeta extends WeekPhaseInfo {
  week: number;
  startDate: string;
  endDate: string;
}

// Single source of truth for the week-by-week methodology (see phaseDetails.ts
// for the full narrative text this mirrors).
export function phaseForWeek(week: number): WeekPhaseInfo {
  if (week <= 2) {
    return {
      mesocycle: 1,
      mesocycleLabel: "Mesociclo 1",
      phaseLabel: "Base técnica + Acumulação controlada",
      rirTarget: 3,
      compoundRir: "3",
      isolatorRir: "2",
      dropSetsAllowed: false,
      isDeload: false,
    };
  }
  if (week <= 4) {
    return {
      mesocycle: 1,
      mesocycleLabel: "Mesociclo 1",
      phaseLabel: "Base técnica + Acumulação controlada",
      rirTarget: 2,
      compoundRir: "2",
      isolatorRir: "1",
      dropSetsAllowed: false,
      isDeload: false,
    };
  }
  if (week <= 6) {
    return {
      mesocycle: 2,
      mesocycleLabel: "Mesociclo 2",
      phaseLabel: "Intensificação + Drop Sets",
      rirTarget: 2,
      compoundRir: "1–2",
      isolatorRir: "1",
      dropSetsAllowed: week === 6,
      isDeload: false,
    };
  }
  if (week === 7) {
    return {
      mesocycle: 2,
      mesocycleLabel: "Mesociclo 2",
      phaseLabel: "Intensificação + Drop Sets",
      rirTarget: 1,
      compoundRir: "1",
      isolatorRir: "1",
      dropSetsAllowed: true,
      isDeload: false,
    };
  }
  return {
    mesocycle: 0,
    mesocycleLabel: "Deload",
    phaseLabel: "Recuperação — Volume reduzido",
    rirTarget: 3,
    compoundRir: "3",
    isolatorRir: "3",
    dropSetsAllowed: false,
    isDeload: true,
  };
}

// RIR alvo for a given week, based on the exercise's category.
export function rirForCategory(week: number, category: string): string {
  const info = phaseForWeek(week);
  if (category === "Composto" || category === "Composto Guiado") {
    return info.compoundRir;
  }
  if (category === "Isolador" || category === "Isolador Guiado") {
    return info.isolatorRir;
  }
  return "N/A";
}

export function computePhase(
  startDate: string,
  durationDays: number,
  today: Date = new Date(),
): ProgramPhase {
  const start = new Date(`${startDate}T00:00:00`);
  const elapsed = differenceInCalendarDays(today, start);
  const endDate = formatISO(addDays(start, durationDays - 1), {
    representation: "date",
  });

  const notStarted = elapsed < 0;
  const isComplete = elapsed >= durationDays;
  const rawDay = Math.min(Math.max(elapsed + 1, 1), durationDays);
  const day = notStarted ? 0 : rawDay;
  const week = Math.min(
    Math.max(Math.ceil(day / 7), 1),
    Math.ceil(durationDays / 7),
  );

  const info = phaseForWeek(week);

  return {
    startDate,
    endDate,
    totalDays: durationDays,
    day,
    week,
    ...info,
    isComplete,
    notStarted,
    daysUntilStart: notStarted ? -elapsed : 0,
    daysRemaining: Math.max(durationDays - day, 0),
  };
}

// Builds the [startDate, endDate] + phase info for an arbitrary program week.
export function buildWeekMeta(week: number, programStart: string): WeekMeta {
  const start = addDays(new Date(`${programStart}T00:00:00`), (week - 1) * 7);
  const end = addDays(start, 6);
  return {
    week,
    startDate: formatISO(start, { representation: "date" }),
    endDate: formatISO(end, { representation: "date" }),
    ...phaseForWeek(week),
  };
}

// All weeks of the program, in order — used for the "período" browser.
export function allWeeksMeta(
  programStart: string,
  durationDays: number,
): WeekMeta[] {
  const totalWeeks = Math.max(1, Math.ceil(durationDays / 7));
  return Array.from({ length: totalWeeks }, (_, i) =>
    buildWeekMeta(i + 1, programStart),
  );
}

// Maps a weekday to the prescribed workout sort order (Seg->A, Qua->B, Sex->C).
export function prescribedSortForDate(date: Date = new Date()): number | null {
  const day = date.getDay(); // 0 Sun .. 6 Sat
  switch (day) {
    case 1:
      return 1; // Segunda -> Treino A
    case 3:
      return 2; // Quarta -> Treino B
    case 5:
      return 3; // Sexta -> Treino C
    default:
      return null;
  }
}

// The next scheduled workout slot from `from` (inclusive), following the
// fixed Mon/Wed/Fri rotation. This is the prescribed schedule and does not
// change based on what the athlete actually logged — training off-schedule
// does not move the next planned session.
export function nextScheduledSlot(
  from: Date = new Date(),
): { sortOrder: number; dateISO: string } {
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    const sort = prescribedSortForDate(d);
    if (sort != null) {
      return { sortOrder: sort, dateISO: formatISO(d, { representation: "date" }) };
    }
  }
  // Unreachable: Mon/Wed/Fri always occur within 7 days.
  return { sortOrder: 1, dateISO: formatISO(from, { representation: "date" }) };
}

