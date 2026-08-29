import { RotateCcw, Save, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateField } from "@/components/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  DEFAULT_SETTINGS,
  useImportDefaultPlan,
  useResetProgram,
  useSettings,
} from "@/lib/store";
import type { ProgramSettings } from "@/lib/types";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function Config() {
  const { activeAthleteId, activeAthleteProfile, refresh } = useActiveAthlete();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { settings, setSettings } = useSettings();
  const importPlan = useImportDefaultPlan();
  const resetProgram = useResetProgram();
  const [draft, setDraft] = useState<ProgramSettings>(
    settings ?? DEFAULT_SETTINGS,
  );
  const [saving, setSaving] = useState(false);
  const [biologicalSex, setBiologicalSex] = useState<"masculino" | "feminino" | "">("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setBiologicalSex(activeAthleteProfile?.biological_sex ?? "");
    setBirthDate(activeAthleteProfile?.birth_date ?? "");
  }, [activeAthleteProfile]);

  const update = (patch: Partial<ProgramSettings>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const number = (v: string, fallback: number) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  };

  const handleSave = async () => {
    if (!activeAthleteId || !biologicalSex || !birthDate) {
      toast.error("Informe sexo biológico e data de nascimento do atleta.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("update_athlete_demographics", {
      target_athlete: activeAthleteId,
      target_sex: biologicalSex,
      target_birth_date: birthDate,
    });
    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }
    await setSettings(draft);
    refresh();
    await refreshProfile();
    setSaving(false);
    toast.success("Configurações salvas.");
  };

  const handleReimport = async () => {
    await resetProgram();
    await importPlan();
    navigate("/");
  };

  const handleClear = async () => {
    await resetProgram();
    toast.success("Dados do atleta apagados.");
    navigate("/onboarding");
  };

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Dados do programa, metas e duração. A data de início define a fase atual."
        icon={Settings}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Cadastro do atleta</CardTitle>
          <CardDescription>Dados usados no cálculo Jackson & Pollock de 7 dobras. A idade é calculada automaticamente na data de cada avaliação.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sexo biológico">
            <Select value={biologicalSex} onValueChange={(value) => setBiologicalSex(value as "masculino" | "feminino")}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Data de nascimento"><DateField value={birthDate} onChange={setBirthDate} max={new Date().toISOString().slice(0, 10)} /></Field>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Programa</CardTitle>
          <CardDescription>
            Período de 60 dias com 2 mesociclos + deload.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data de início" hint="Define o dia/semana atual do programa.">
            <DateField
              value={draft.startDate}
              onChange={(v) => update({ startDate: v })}
            />
          </Field>
          <Field label="Duração (dias)">
            <Input
              type="number"
              value={draft.durationDays}
              onChange={(e) =>
                update({ durationDays: Math.max(1, number(e.target.value, 60)) })
              }
            />
          </Field>
          <Field label="Sessão máx. (min)">
            <Input
              type="number"
              value={draft.sessionMaxMinutes}
              onChange={(e) =>
                update({
                  sessionMaxMinutes: Math.max(1, number(e.target.value, 50)),
                })
              }
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Metas corporais</CardTitle>
          <CardDescription>Ponto de partida e meta do programa.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Peso atual (kg)">
            <Input
              type="number"
              step="0.1"
              value={draft.currentWeightKg}
              onChange={(e) =>
                update({ currentWeightKg: number(e.target.value, 82.9) })
              }
            />
          </Field>
          <Field label="Gordura atual (%)">
            <Input
              type="number"
              step="0.1"
              value={draft.currentBodyfatPct}
              onChange={(e) =>
                update({ currentBodyfatPct: number(e.target.value, 18.3) })
              }
            />
          </Field>
          <Field label="Peso meta (kg)">
            <Input
              type="number"
              step="0.1"
              value={draft.goalWeightKg}
              onChange={(e) =>
                update({ goalWeightKg: number(e.target.value, 80) })
              }
            />
          </Field>
          <Field label="Gordura meta (%)">
            <Input
              type="number"
              step="0.1"
              value={draft.goalBodyfatPct}
              onChange={(e) =>
                update({ goalBodyfatPct: number(e.target.value, 10) })
              }
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          <Save className="size-4" />
          {saving ? "Salvando…" : "Salvar configurações"}
        </Button>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="size-4" />
                ReImportar plano padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reimportar plano padrão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga o plano, o histórico, as métricas e o cardio do
                  atleta atual e restaura o plano original (20 exercícios e 3
                  treinos). Os dados não podem ser recuperados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReimport}>
                  Reimportar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Apagar tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar todos os dados?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove permanentemente o plano, o histórico, as métricas e o
                  cardio do atleta atual. Você voltará para a tela de boas-vindas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>
                  Apagar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}
