import {
  ArrowRight,
  Check,
  Download,
  Info,
  Link2,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import { useAuth } from "@/hooks/use-auth";
import { useHasProgram, useImportDefaultPlan } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const FEATURES = [
  "Plano de 60 dias em 2 mesociclos + deload, com RIR alvo por semana.",
  "Lançamento de séries com carga, reps e dificuldade — histórico e gráficos.",
  "Métricas de peso e gordura rumo à meta, e cardio Zona 2.",
  "Aviso de segurança para o joelho esquerdo nos exercícios sensíveis.",
];

function dismissKeyFor(userId: string) {
  return `tf:onboardingDismissed:${userId}`;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { session, user, profile, signOut } = useAuth();
  const { isTrainer, activeAthleteId, activeAthleteProfile } = useActiveAthlete();
  const { hasProgram } = useHasProgram();
  const importPlan = useImportDefaultPlan();
  const [importing, setImporting] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!session) return <Navigate to="/auth" replace />;

  // Returning user who already dismissed this screen: skip straight in.
  if (hasProgram && user && localStorage.getItem(dismissKeyFor(user.id)) === "1") {
    return <Navigate to="/" replace />;
  }

  const goToDashboard = () => {
    if (dontShowAgain && user) {
      localStorage.setItem(dismissKeyFor(user.id), "1");
    }
    navigate("/");
  };

  const handleImport = async () => {
    setImporting(true);
    const ok = await importPlan();
    setImporting(false);
    if (ok) goToDashboard();
  };

  const ownName = profile?.full_name || profile?.email || "";

  // Trainer without a linked athlete cannot proceed.
  if (isTrainer && !activeAthleteId) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-surface p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-card animate-fade-in">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Link2 className="size-7" />
          </div>
          <span className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Treinador · {ownName}
          </span>
          <h1 className="mt-3 text-xl font-semibold text-foreground">
            Vincule um atleta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-balance">
            Como treinador, você só acessa dados de atletas que aceitaram seu
            vínculo. Peça ao atleta para convidar você pelo e-mail, ou aceite um
            convite pendente.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/equipe">Ir para a equipe</Link>
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
            onClick={async () => {
              await signOut();
              navigate("/auth", { replace: true });
            }}
          >
            <LogOut className="size-4" />
            Sair e voltar ao login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-lg overflow-hidden p-8 shadow-card animate-fade-in">
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <ShieldCheck className="size-7" />
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {isTrainer ? "Treinador" : "Atleta"} · {ownName}
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Bem-vindo ao TrackerFit
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          {isTrainer && activeAthleteProfile
            ? `Você está gerenciando o plano de ${activeAthleteProfile.full_name || activeAthleteProfile.email}.`
            : "Controle do programa de treino de 60 dias — plano, séries, histórico e métricas, com aviso de segurança para o joelho esquerdo."}
        </p>

        <ul className="mt-5 space-y-2">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-balance">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          {hasProgram ? (
            <Button
              onClick={goToDashboard}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Check className="size-4" />
              Você já tem um plano — ir para o Dashboard
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleImport}
              disabled={importing}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Importar plano padrão
            </Button>
          )}
          {hasProgram ? (
            <Button variant="ghost" onClick={handleImport} disabled={importing}>
              <Download className="size-4" />
              Reimportar o plano original
            </Button>
          ) : null}
        </div>

        {hasProgram ? (
          <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={dontShowAgain}
              onCheckedChange={(v) => setDontShowAgain(v === true)}
            />
            <Label className="cursor-pointer font-normal text-muted-foreground">
              Não mostrar esta tela novamente ao entrar
            </Label>
          </label>
        ) : null}

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Os dados são salvos na nuvem do Enter Cloud, com acesso seguro entre
            você e seu treinador. {isTrainer ? "Você editará o plano deste atleta." : "Você pode convidar seu treinador em Equipe."}
          </p>
        </div>

        {hasProgram ? (
          <div className="mt-3 text-center">
            <button
              onClick={goToDashboard}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Voltar <ArrowRight className="size-3" />
            </button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
