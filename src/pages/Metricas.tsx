import { Scale } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
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
import { PageHeader } from "@/components/page-header";
import { useBodyMetrics, useSettings } from "@/lib/store";
import {
  formatKg,
  formatNumber,
  formatPct,
  formatShortDate,
  todayISO,
} from "@/lib/format";

const weightConfig: ChartConfig = {
  weight: { label: "Peso (kg)", color: "hsl(var(--chart-1))" },
};
const fatConfig: ChartConfig = {
  bodyfat: { label: "Gordura (%)", color: "hsl(var(--chart-2))" },
};

export default function Metricas() {
  const { settings } = useSettings();
  const { items, add } = useBodyMetrics();
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bodyfat, setBodyfat] = useState("");

  const sorted = [...items].sort((a, b) =>
    a.recordedAt < b.recordedAt ? -1 : 1,
  );
  const weightData = sorted.map((m) => ({ date: m.recordedAt, weight: m.weightKg }));
  const fatData = sorted
    .filter((m) => m.bodyfatPct != null)
    .map((m) => ({ date: m.recordedAt, bodyfat: m.bodyfatPct as number }));

  const latest = sorted[sorted.length - 1];
  const currentWeight = latest?.weightKg ?? settings?.currentWeightKg ?? 0;
  const currentFat = latest?.bodyfatPct ?? settings?.currentBodyfatPct ?? 0;

  const weightDelta = settings
    ? currentWeight - settings.goalWeightKg
    : 0;
  const fatDelta = settings ? currentFat - settings.goalBodyfatPct : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weight.replace(",", "."));
    if (!Number.isFinite(w) || w <= 0) {
      toast.error("Informe um peso válido.");
      return;
    }
    const f = bodyfat
      ? Number(bodyfat.replace(",", "."))
      : null;
    await add({ recordedAt: date, weightKg: w, bodyfatPct: f });
    setWeight("");
    setBodyfat("");
    toast.success("Métrica registrada.");
  };

  if (!settings) return null;

  return (
    <>
      <PageHeader
        title="Métricas corporais"
        description="Peso e gordura rumo à meta do programa."
        icon={Scale}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Peso atual</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatKg(currentWeight)}
          </p>
          <p className="text-xs text-muted-foreground">
            Meta {formatKg(settings.goalWeightKg)}
          </p>
        </Card>
        <Card className="p-4 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Acima meta</p>
          <p className="mt-1 text-xl font-semibold text-primary">
            {weightDelta > 0 ? "+" : ""}
            {formatNumber(weightDelta)} kg
          </p>
          <p className="text-xs text-muted-foreground">acima da meta</p>
        </Card>
        <Card className="p-4 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Gordura atual</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatPct(currentFat)}
          </p>
          <p className="text-xs text-muted-foreground">
            Meta {formatPct(settings.goalBodyfatPct)}
          </p>
        </Card>
        <Card className="p-4 shadow-card">
          <p className="text-xs uppercase text-muted-foreground">Acima meta</p>
          <p className="mt-1 text-xl font-semibold text-primary">
            {fatDelta > 0 ? "+" : ""}
            {formatNumber(fatDelta)}%
          </p>
          <p className="text-xs text-muted-foreground">acima da meta</p>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Registrar métrica</CardTitle>
          <CardDescription>Peso e % de gordura corporal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Data</Label>
              <DateField value={date} onChange={setDate} max={todayISO()} inputClassName="w-[130px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="80,0"
                className="w-[120px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Gordura (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyfat}
                onChange={(e) => setBodyfat(e.target.value)}
                placeholder="18,3"
                className="w-[120px]"
              />
            </div>
            <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Evolução do peso</CardTitle>
            <CardDescription>Meta: {formatKg(settings.goalWeightKg)}</CardDescription>
          </CardHeader>
          <CardContent>
            {weightData.length < 2 ? (
              <EmptyState icon={Scale} title="Poucos registros" description="Registre o peso em ao menos 2 dias." />
            ) : (
              <ChartContainer config={weightConfig} className="aspect-auto h-[240px] w-full">
                <AreaChart data={weightData} margin={{ left: -10, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} fontSize={12} width={40} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => formatShortDate(String(l))} />} />
                  <ReferenceLine y={settings.goalWeightKg} stroke="hsl(var(--chart-3))" strokeDasharray="4 4" />
                  <Area dataKey="weight" type="monotone" stroke="hsl(var(--chart-1))" fill="url(#wFill)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Evolução da gordura</CardTitle>
            <CardDescription>Meta: {formatPct(settings.goalBodyfatPct)}</CardDescription>
          </CardHeader>
          <CardContent>
            {fatData.length < 2 ? (
              <EmptyState icon={Scale} title="Poucos registros" description="Registre a gordura em ao menos 2 dias." />
            ) : (
              <ChartContainer config={fatConfig} className="aspect-auto h-[240px] w-full">
                <AreaChart data={fatData} margin={{ left: -10, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="fFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} fontSize={12} width={40} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => formatShortDate(String(l))} />} />
                  <ReferenceLine y={settings.goalBodyfatPct} stroke="hsl(var(--chart-3))" strokeDasharray="4 4" />
                  <Area dataKey="bodyfat" type="monotone" stroke="hsl(var(--chart-2))" fill="url(#fFill)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
