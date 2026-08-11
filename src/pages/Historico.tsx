import { LineChart as LineChartIcon } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExercises, useSetLogs, useWorkoutLogs, useWorkouts } from "@/lib/store";
import { formatShortDate } from "@/lib/format";

const chartConfig: ChartConfig = {
  load: { label: "Carga (kg)", color: "hsl(var(--chart-1))" },
};

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function Historico() {
  const { items: workouts } = useWorkouts();
  const { items: exercises } = useExercises();
  const { items: workoutLogs } = useWorkoutLogs();
  const { items: setLogs } = useSetLogs();

  const [wkFilter, setWkFilter] = useState("all");
  const [exFilter, setExFilter] = useState("all");
  const [period, setPeriod] = useState("all");

  const cutoff =
    period === "30d" ? daysAgoISO(30) : period === "60d" ? daysAgoISO(60) : null;

  const filteredLogs = workoutLogs
    .filter(
      (l) =>
        (wkFilter === "all" || l.workoutId === wkFilter) &&
        (!cutoff || l.performedAt >= cutoff),
    )
    .sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1));

  const chartPoints =
    exFilter !== "all"
      ? workoutLogs
          .filter(
            (l) =>
              setLogs.some((s) => s.exerciseId === exFilter && s.workoutLogId === l.id) &&
              (!cutoff || l.performedAt >= cutoff) &&
              (wkFilter === "all" || l.workoutId === wkFilter),
          )
          .map((l) => {
            const sets = setLogs.filter(
              (s) => s.exerciseId === exFilter && s.workoutLogId === l.id,
            );
            const maxLoad = sets.reduce(
              (m, s) => Math.max(m, s.loadKg),
              0,
            );
            return { date: l.performedAt, load: maxLoad };
          })
          .sort((a, b) => (a.date < b.date ? -1 : 1))
      : [];

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Evolução de carga por exercício e sessões realizadas."
        icon={LineChartIcon}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-muted-foreground">Treino</span>
          <Select value={wkFilter} onValueChange={setWkFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {[...workouts]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-muted-foreground">Exercício</span>
          <Select value={exFilter} onValueChange={setExFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Selecione para o gráfico</SelectItem>
              {exercises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-muted-foreground">Período</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tudo</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="60d">60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Evolução de carga</CardTitle>
          <CardDescription>
            {exFilter === "all"
              ? "Selecione um exercício para ver a maior carga por sessão."
              : `Maior carga por sessão — ${exercises.find((e) => e.id === exFilter)?.name ?? ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartPoints.length < 2 ? (
            <EmptyState
              icon={LineChartIcon}
              title="Dados insuficientes"
              description="Registre ao menos duas sessões com este exercício para ver a evolução."
            />
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
              <AreaChart data={chartPoints} margin={{ left: -10, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => formatShortDate(String(l))} />} />
                <Area dataKey="load" type="monotone" stroke="hsl(var(--chart-1))" fill="url(#loadFill)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Sessões</CardTitle>
          <CardDescription>{filteredLogs.length} sessão(ões) no filtro atual.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <EmptyState icon={LineChartIcon} title="Nenhuma sessão" description="Registre séries em Treino para alimentar o histórico." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Treino</TableHead>
                    <TableHead className="text-right">Séries</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Dificuldade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((l) => {
                    const sets = setLogs.filter((s) => s.workoutLogId === l.id);
                    const volume = sets.reduce(
                      (s, x) => s + x.loadKg * x.repsDone,
                      0,
                    );
                    const avg = sets.length
                      ? sets.reduce((s, x) => s + x.difficulty, 0) / sets.length
                      : 0;
                    const wk = workouts.find((w) => w.id === l.workoutId);
                    return (
                      <TableRow key={l.id}>
                        <TableCell>{formatShortDate(l.performedAt)}</TableCell>
                        <TableCell>{wk?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">{sets.length}</TableCell>
                        <TableCell className="text-right">
                          {volume.toFixed(0).replace(".", ",")} kg
                        </TableCell>
                        <TableCell className="text-right">
                          {avg ? avg.toFixed(1).replace(".", ",") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
