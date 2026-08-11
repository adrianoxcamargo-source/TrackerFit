export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return parseDate(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  return parseDate(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatWeekday(iso: string): string {
  if (!iso) return "";
  return parseDate(iso).toLocaleDateString("pt-BR", { weekday: "long" });
}

export function formatKg(v: number | undefined | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toFixed(1).replace(".", ",")} kg`;
}

export function formatNumber(v: number, digits = 1): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(digits).replace(".", ",");
}

export function formatPct(v: number | undefined | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toFixed(1).replace(".", ",")}%`;
}

export function formatMinutes(v: number): string {
  return `${Math.round(v)} min`;
}
