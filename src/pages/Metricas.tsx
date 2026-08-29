import { Activity, Plus, Ruler, Scale, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DateField } from "@/components/date-field";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";
import { formatKg, formatNumber, formatPct, formatShortDate, todayISO } from "@/lib/format";
import { useBodyMetrics, useSettings } from "@/lib/store";
import type { BodyMetric } from "@/lib/types";

type NumericKey = Exclude<keyof BodyMetric, "id" | "recordedAt" | "notes">;
type FormValues = Partial<Record<NumericKey, string>> & { notes?: string };

const compositionFields: Array<[NumericKey, string, string]> = [
  ["weightKg", "Peso", "kg"], ["bodyfatPct", "Gordura por dobras", "%"],
  ["bioimpedanceBodyfatPct", "Gordura por bioimpedância", "%"],
  ["bioimpedanceMusclePct", "Muscular por bioimpedância", "%"],
  ["fatMassKg", "Massa de gordura", "kg"], ["leanMassKg", "Massa magra", "kg"],
  ["visceralFat", "Gordura visceral", "nível"], ["metabolicRateKcal", "Gasto metabólico", "kcal"],
];
const skinfoldFields: Array<[NumericKey, string]> = [
  ["skinfoldSubscapularMm", "Subescapular"], ["skinfoldTricepsMm", "Tríceps"],
  ["skinfoldChestMm", "Peitoral"], ["skinfoldAxillaryMm", "Axilar"],
  ["skinfoldObliqueMm", "Oblíqua"], ["skinfoldAbdominalMm", "Abdominal"],
  ["skinfoldThighMm", "Coxa"],
];
const circumferenceFields: Array<[NumericKey, string]> = [
  ["chestCm", "Peitoral"], ["waistCm", "Cintura"], ["abdomenCm", "Abdômen"], ["hipCm", "Quadril"],
  ["rightArmCm", "Braço direito"], ["leftArmCm", "Braço esquerdo"],
  ["rightThighCm", "Coxa direita"], ["leftThighCm", "Coxa esquerda"],
  ["rightCalfCm", "Panturrilha direita"], ["leftCalfCm", "Panturrilha esquerda"],
];

const compositionConfig = {
  leanMass: { label: "Massa magra", color: "hsl(var(--chart-1))" },
  fatMass: { label: "Massa de gordura", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;
const fatConfig = {
  folds: { label: "Dobras", color: "hsl(var(--chart-2))" },
  bio: { label: "Bioimpedância", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;
const circumferenceConfig = {
  waist: { label: "Cintura", color: "hsl(var(--chart-1))" },
  abdomen: { label: "Abdômen", color: "hsl(var(--chart-2))" },
  hip: { label: "Quadril", color: "hsl(var(--chart-3))" },
  chest: { label: "Peitoral", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

function MetricInput({ field, label, unit, value, onChange, required = false }: {
  field: NumericKey; label: string; unit: string; value?: string;
  onChange: (field: NumericKey, value: string) => void; required?: boolean;
}) {
  return <div className="space-y-1">
    <Label htmlFor={field} className="text-[10px] uppercase text-muted-foreground">{label} ({unit})</Label>
    <Input id={field} type="number" step="0.1" min="0" required={required} value={value ?? ""}
      onChange={(e) => onChange(field, e.target.value)} className="h-9" />
  </div>;
}

function EvolutionChart({ data, config, lines, emptyText }: {
  data: Array<Record<string, string | number | undefined>>; config: ChartConfig;
  lines: Array<{ key: string; color: string }>; emptyText: string;
}) {
  if (data.length < 2) return <EmptyState icon={Activity} title="Poucos registros" description={emptyText} />;
  return <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
    <LineChart data={data} margin={{ left: -8, right: 12, top: 8 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} fontSize={11} />
      <YAxis domain={["dataMin - 2", "dataMax + 2"]} tickLine={false} axisLine={false} fontSize={11} width={42} />
      <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => formatShortDate(String(v))} />} />
      {lines.map((line) => <Line key={line.key} dataKey={line.key} type="monotone" stroke={line.color} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />)}
    </LineChart>
  </ChartContainer>;
}

export default function Metricas() {
  const { settings } = useSettings();
  const { items, add, remove } = useBodyMetrics();
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<FormValues>({ heightCm: "175" });
  const sorted = useMemo(() => [...items].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)), [items]);
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const compositionData = sorted.map((m) => ({ date: m.recordedAt, leanMass: m.leanMassKg, fatMass: m.fatMassKg }));
  const fatData = sorted.map((m) => ({ date: m.recordedAt, folds: m.bodyfatPct, bio: m.bioimpedanceBodyfatPct }));
  const circumferenceData = sorted.map((m) => ({ date: m.recordedAt, waist: m.waistCm, abdomen: m.abdomenCm, hip: m.hipCm, chest: m.chestCm }));

  const setField = (field: NumericKey, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const parse = (value?: string) => {
    if (!value?.trim()) return undefined;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const weightKg = parse(values.weightKg);
    if (!weightKg || weightKg <= 0) return toast.error("Informe um peso válido.");
    const payload = { recordedAt: date, weightKg } as Omit<BodyMetric, "id">;
    const keys = [...compositionFields.map(([key]) => key), ...skinfoldFields.map(([key]) => key), ...circumferenceFields.map(([key]) => key)];
    for (const key of keys) {
      if (key === "weightKg") continue;
      const parsed = parse(values[key]);
      if (parsed != null) Object.assign(payload, { [key]: parsed });
    }
    payload.heightCm = parse(values.heightCm) ?? 175;
    if (payload.fatMassKg == null && payload.bodyfatPct != null) payload.fatMassKg = Number((weightKg * payload.bodyfatPct / 100).toFixed(1));
    if (payload.leanMassKg == null && payload.fatMassKg != null) payload.leanMassKg = Number((weightKg - payload.fatMassKg).toFixed(1));
    if (values.notes?.trim()) payload.notes = values.notes.trim();
    const saved = await add(payload);
    if (!saved) return;
    setValues({ heightCm: "175" });
    toast.success("Avaliação física registrada.");
  };
  const confirmRemove = async (metric: BodyMetric) => {
    if (!window.confirm(`Excluir a avaliação de ${formatShortDate(metric.recordedAt)}?`)) return;
    await remove(metric.id);
    toast.success("Avaliação excluída.");
  };
  if (!settings) return null;
  const weightChange = first && latest ? latest.weightKg - first.weightKg : 0;
  const fatMassChange = first?.fatMassKg != null && latest?.fatMassKg != null ? latest.fatMassKg - first.fatMassKg : null;
  const leanMassChange = first?.leanMassKg != null && latest?.leanMassKg != null ? latest.leanMassKg - first.leanMassKg : null;
  const waistChange = first?.waistCm != null && latest?.waistCm != null ? latest.waistCm - first.waistCm : null;

  return <>
    <PageHeader title="Métricas corporais" description="Evolução das avaliações físicas e da composição corporal." icon={Scale} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ["Peso", latest ? formatKg(latest.weightKg) : "—", `${weightChange > 0 ? "+" : ""}${formatNumber(weightChange)} kg desde o início`],
        ["Gordura", latest?.bodyfatPct != null ? formatPct(latest.bodyfatPct) : "—", fatMassChange == null ? "massa não informada" : `${formatNumber(fatMassChange)} kg de gordura`],
        ["Massa magra", latest?.leanMassKg != null ? formatKg(latest.leanMassKg) : "—", leanMassChange == null ? "sem comparação" : `${leanMassChange > 0 ? "+" : ""}${formatNumber(leanMassChange)} kg`],
        ["Cintura", latest?.waistCm != null ? `${formatNumber(latest.waistCm)} cm` : "—", waistChange == null ? "sem comparação" : `${formatNumber(waistChange)} cm`],
      ].map(([label, value, detail]) => <Card key={label} className="p-4 shadow-card"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></Card>)}
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Composição corporal</CardTitle><CardDescription>Massa magra e massa de gordura em quilogramas.</CardDescription></CardHeader><CardContent><EvolutionChart data={compositionData} config={compositionConfig} emptyText="São necessárias duas avaliações completas." lines={[{ key: "leanMass", color: "hsl(var(--chart-1))" }, { key: "fatMass", color: "hsl(var(--chart-2))" }]} /></CardContent></Card>
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Percentual de gordura</CardTitle><CardDescription>Dobras cutâneas e bioimpedância são exibidas separadamente.</CardDescription></CardHeader><CardContent><EvolutionChart data={fatData} config={fatConfig} emptyText="São necessárias duas avaliações com percentual de gordura." lines={[{ key: "folds", color: "hsl(var(--chart-2))" }, { key: "bio", color: "hsl(var(--chart-3))" }]} /></CardContent></Card>
      <Card className="shadow-card xl:col-span-2"><CardHeader><CardTitle className="text-base">Circunferências do tronco</CardTitle><CardDescription>Peitoral, cintura, abdômen e quadril em centímetros.</CardDescription></CardHeader><CardContent><EvolutionChart data={circumferenceData} config={circumferenceConfig} emptyText="São necessárias duas avaliações com circunferências." lines={[{ key: "waist", color: "hsl(var(--chart-1))" }, { key: "abdomen", color: "hsl(var(--chart-2))" }, { key: "hip", color: "hsl(var(--chart-3))" }, { key: "chest", color: "hsl(var(--chart-4))" }]} /></CardContent></Card>
    </div>
    <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" />Nova avaliação</CardTitle><CardDescription>Campos não medidos podem ficar em branco. Massa magra e gordura são calculadas automaticamente quando possível.</CardDescription></CardHeader><CardContent>
      <form onSubmit={handleAdd} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3"><div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Data</Label><DateField value={date} onChange={setDate} max={todayISO()} /></div><MetricInput field="heightCm" label="Altura" unit="cm" value={values.heightCm} onChange={setField} /><MetricInput field="weightKg" label="Peso" unit="kg" value={values.weightKg} onChange={setField} required /></div>
        <details open className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Composição corporal</summary><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{compositionFields.filter(([key]) => key !== "weightKg").map(([key, label, unit]) => <MetricInput key={key} field={key} label={label} unit={unit} value={values[key]} onChange={setField} />)}</div></details>
        <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Dobras cutâneas</summary><p className="mt-1 text-xs text-muted-foreground">Valores em milímetros.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{skinfoldFields.map(([key, label]) => <MetricInput key={key} field={key} label={label} unit="mm" value={values[key]} onChange={setField} />)}</div></details>
        <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Circunferências</summary><p className="mt-1 text-xs text-muted-foreground">Valores em centímetros.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{circumferenceFields.map(([key, label]) => <MetricInput key={key} field={key} label={label} unit="cm" value={values[key]} onChange={setField} />)}</div></details>
        <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Observações</Label><Textarea value={values.notes ?? ""} onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))} placeholder="Condições da avaliação, método ou observações do profissional" /></div>
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90">Registrar avaliação</Button>
      </form>
    </CardContent></Card>
    <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Ruler className="h-4 w-4" />Histórico de avaliações</CardTitle><CardDescription>{sorted.length} avaliações registradas.</CardDescription></CardHeader><CardContent>
      {sorted.length === 0 ? <EmptyState icon={Scale} title="Nenhuma avaliação" description="Cadastre a primeira avaliação física." /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-3">Data</th><th>Peso</th><th>Gordura</th><th>Bio</th><th>Massa magra</th><th>Cintura</th><th>Abdômen</th><th className="text-right">Ações</th></tr></thead><tbody>{[...sorted].reverse().map((m) => <tr key={m.id} className="border-b last:border-0"><td className="py-3 font-medium">{formatShortDate(m.recordedAt)}</td><td>{formatKg(m.weightKg)}</td><td>{m.bodyfatPct == null ? "—" : formatPct(m.bodyfatPct)}</td><td>{m.bioimpedanceBodyfatPct == null ? "—" : formatPct(m.bioimpedanceBodyfatPct)}</td><td>{m.leanMassKg == null ? "—" : formatKg(m.leanMassKg)}</td><td>{m.waistCm == null ? "—" : `${formatNumber(m.waistCm)} cm`}</td><td>{m.abdomenCm == null ? "—" : `${formatNumber(m.abdomenCm)} cm`}</td><td className="text-right"><Button type="button" variant="ghost" size="icon" aria-label="Excluir avaliação" onClick={() => confirmRemove(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </>;
}
