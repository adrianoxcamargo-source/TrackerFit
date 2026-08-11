import { HeartPulse } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { DateField } from "@/components/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useCardioLogs } from "@/lib/store";
import { formatMinutes, formatShortDate, todayISO } from "@/lib/format";

const config: ChartConfig = {
  minutes: { label: "Minutos", color: "hsl(var(--chart-1))" },
};

const ACTIVITY_TYPES = [
  "Caminhada",
  "Corrida",
  "Bike",
  "Esteira",
  "Elíptico",
  "Outro",
];

function localISO(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function startOfWeekISO(d = new Date()): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  return localISO(date);
}

const numOrUndefined = (v: string): number | undefined => {
  if (!v.trim()) return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};

export default function Cardio() {
  const { items, add } = useCardioLogs();
  const [date, setDate] = useState(todayISO());
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [duration, setDuration] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [calories, setCalories] = useState("");
  const [steps, setSteps] = useState("");
  const [elevationGainM, setElevationGainM] = useState("");
  const [avgCadence, setAvgCadence] = useState("");
  const [notes, setNotes] = useState("");

  const weekStart = startOfWeekISO();
  const weekItems = items.filter((c) => c.performedAt >= weekStart);
  const weekMinutes = weekItems.reduce((s, c) => s + c.durationMin, 0);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const data = days.map((d) => {
    const iso = localISO(d);
    const total = items
      .filter((c) => c.performedAt === iso)
      .reduce((s, c) => s + c.durationMin, 0);
    return { date: formatShortDate(iso), minutes: total };
  });

  const recent = [...items]
    .sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1))
    .slice(0, 8);

  const resetOptionalFields = () => {
    setDistanceKm("");
    setAvgHeartRate("");
    setCalories("");
    setSteps("");
    setElevationGainM("");
    setAvgCadence("");
    setNotes("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(duration);
    if (!Number.isFinite(m) || m <= 0) {
      toast.error("Informe a duração em minutos.");
      return;
    }
    await add({
      performedAt: date,
      durationMin: Math.round(m),
      activityType,
      distanceKm: numOrUndefined(distanceKm),
      avgHeartRate: numOrUndefined(avgHeartRate),
      calories: numOrUndefined(calories),
      steps: numOrUndefined(steps),
      elevationGainM: numOrUndefined(elevationGainM),
      avgCadence: numOrUndefined(avgCadence),
      notes,
    });
    setDuration("");
    resetOptionalFields();
    toast.success("Cardio registrado.");
  };

  return (
    <>
      <PageHeader
        title="Cardio"
        description="Sessões Zona 2 em jejum — meta semanal de 3x, 30–35 min."
        icon={HeartPulse}
      />

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Sessões na semana</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {weekItems.length}/3
          </p>
        </Card>
        <Card className="p-4 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Minutos na semana</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMinutes(weekMinutes)}
          </p>
          <p className="text-xs text-muted-foreground">Alvo 90–105</p>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Registrar cardio</CardTitle>
          <CardDescription>Zona 2 — intensidade conversável.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Data</Label>
                <DateField value={date} onChange={setDate} max={todayISO()} inputClassName="w-[130px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Tipo</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Duração (min)</Label>
                <Input
                  type="number"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  className="w-[110px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Distância (km)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="6,72"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">
                  Freq. cardíaca média (bpm)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={avgHeartRate}
                  onChange={(e) => setAvgHeartRate(e.target.value)}
                  placeholder="101"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">
                  Calorias perdidas (kcal)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="328"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Passos</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="5191"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">
                  Ganho de elevação (m)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={elevationGainM}
                  onChange={(e) => setElevationGainM(e.target.value)}
                  placeholder="26"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">
                  Cadência média (ppm)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={avgCadence}
                  onChange={(e) => setAvgCadence(e.target.value)}
                  placeholder="108"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Obs.</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Esteira / bike / rua"
                />
              </div>
              <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                Registrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState icon={HeartPulse} title="Sem sessões" description="Registre o cardio para acompanhar a meta semanal." />
          ) : (
            <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
              <BarChart data={data} margin={{ left: -10, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Sessões recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sessão registrada.</p>
          ) : (
            recent.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {c.activityType ?? "Cardio"} · {formatMinutes(c.durationMin)}
                    {c.distanceKm != null ? ` · ${c.distanceKm.toFixed(2).replace(".", ",")} km` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(c.performedAt)}
                    {c.notes ? ` · ${c.notes}` : ""}
                  </p>
                  {c.avgHeartRate != null ||
                  c.calories != null ||
                  c.steps != null ||
                  c.elevationGainM != null ||
                  c.avgCadence != null ? (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {c.avgHeartRate != null ? <span>{c.avgHeartRate} bpm</span> : null}
                      {c.calories != null ? <span>{c.calories} kcal</span> : null}
                      {c.steps != null ? <span>{c.steps} passos</span> : null}
                      {c.elevationGainM != null ? <span>{c.elevationGainM} m</span> : null}
                      {c.avgCadence != null ? <span>{c.avgCadence} ppm</span> : null}
                    </div>
                  ) : null}
                </div>
                <HeartPulse className="size-4 shrink-0 text-primary" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
