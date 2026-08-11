import {
  Check,
  Link2,
  Loader2,
  Mail,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useActiveAthlete } from "@/hooks/use-active-athlete";
import { from, rpc } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";

interface RelatedProfile {
  full_name: string;
  email: string;
}
interface LinkRow {
  id: string;
  invite_email: string;
  status: string;
  created_at: string;
  athlete_id?: string;
  trainer_id?: string | null;
  athlete?: RelatedProfile | null;
  trainer?: RelatedProfile | null;
}

export default function Equipe() {
  const { profile, user } = useAuth();
  const {
    isAthlete,
    isTrainer,
    linkedAthletes,
    setSelectedAthlete,
    activeAthleteId,
    activeAthleteProfile,
    refresh,
  } = useActiveAthlete();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [requestAthleteEmail, setRequestAthleteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const myEmail = user?.email ?? "";

  const { data: myLinks = [] } = useQuery({
    queryKey: ["atl-mine", profile?.id],
    enabled: isAthlete && !!profile?.id,
    queryFn: async () => {
      const { data, error } = await from("athlete_trainer_links")
        .select(
          "id,invite_email,status,created_at,trainer_id,trainer:profiles!athlete_trainer_links_trainer_id_fkey(full_name,email)",
        )
        .eq("athlete_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LinkRow[];
    },
  });

  const { data: pending = [] } = useQuery({
    queryKey: ["atl-pending", myEmail, profile?.id],
    enabled: isTrainer && !!myEmail && !!profile?.id,
    queryFn: async () => {
      const { data, error } = await from("athlete_trainer_links")
        .select(
          "id,invite_email,status,athlete_id,trainer_id,athlete:profiles!athlete_trainer_links_athlete_id_fkey(full_name,email)",
        )
        .or(`invite_email.eq.${myEmail},trainer_id.eq.${profile!.id}`)
        .eq("status", "pendente");
      if (error) throw error;
      return (data ?? []) as unknown as LinkRow[];
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    const { error } = await from("athlete_trainer_links").insert({
      athlete_id: profile.id,
      invite_email: email,
      status: "pendente",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Convite enviado ao treinador.");
    setInviteEmail("");
    qc.invalidateQueries({ queryKey: ["atl-mine"] });
  };

  const handleCancel = async (id: string) => {
    const { error } = await from("athlete_trainer_links")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Convite cancelado.");
      qc.invalidateQueries({ queryKey: ["atl-mine"] });
    }
  };

  const handleRequestAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = requestAthleteEmail.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    const { error } = await rpc("request_trainer_access", {
      target_email: email,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Solicitação enviada. O atleta verá o pedido em Equipe.");
    setRequestAthleteEmail("");
    qc.invalidateQueries({ queryKey: ["atl-pending"] });
  };

  const handleAthleteDecision = async (id: string, status: "aceito" | "recusado") => {
    const { error } = await from("athlete_trainer_links")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "aceito" ? "Treinador aprovado." : "Solicitação recusada.");
      qc.invalidateQueries({ queryKey: ["atl-mine"] });
    }
  };

  const handleAccept = async (id: string) => {
    if (!profile) return;
    const { error } = await from("athlete_trainer_links")
      .update({ trainer_id: profile.id, status: "aceito" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Vínculo aceito.");
      refresh();
      qc.invalidateQueries({ queryKey: ["atl-pending"] });
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await from("athlete_trainer_links")
      .update({ status: "recusado" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Solicitação recusada.");
      qc.invalidateQueries({ queryKey: ["atl-pending"] });
      qc.invalidateQueries({ queryKey: ["atl-mine"] });
    }
  };

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Gerencie o acesso compartilhado entre atleta e treinador."
        icon={Users}
      />

      {isAthlete ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-primary" />
                Convidar treinador
              </CardTitle>
              <CardDescription>
                Informe o e-mail do treinador. Ele verá o convite ao entrar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  required
                  placeholder="treinador@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Convidar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="size-4 text-primary" />
                Usuários e acessos
              </CardTitle>
              <CardDescription>
                Treinadores vinculados e solicitações recebidas. Aprovações e recusas ficam registradas aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {myLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum convite enviado ainda.
                </p>
              ) : (
                myLinks.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {l.trainer?.full_name || l.invite_email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.status === "aceito"
                          ? `Conectado · ${l.trainer?.email ?? l.invite_email}`
                          : l.status === "recusado"
                            ? "Solicitação recusada"
                            : l.trainer_id
                              ? "Solicitação de acesso recebida — aguarda sua aprovação"
                              : `Aguardando aceite · ${l.invite_email}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAthlete && l.status === "pendente" && l.trainer_id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAthleteDecision(l.id, "aceito")}
                          >
                            <Check className="size-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-9 text-muted-foreground hover:text-destructive"
                            onClick={() => handleAthleteDecision(l.id, "recusado")}
                            aria-label="Recusar solicitação"
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : null}
                      <Badge
                        variant={l.status === "aceito" ? "default" : "secondary"}
                      >
                        {l.status === "aceito"
                          ? "Aceito"
                          : l.status === "recusado"
                            ? "Recusado"
                            : l.trainer_id
                              ? "Aguardando sua aprovação"
                              : "Pendente"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleCancel(l.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isTrainer ? (
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="size-4 text-primary" />
                Solicitar acesso a um atleta
              </CardTitle>
              <CardDescription>
                O atleta receberá uma solicitação dentro de Equipe e precisará aprovar o acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestAthlete} className="flex gap-2">
                <Input
                  type="email"
                  required
                  placeholder="atleta@email.com"
                  value={requestAthleteEmail}
                  onChange={(e) => setRequestAthleteEmail(e.target.value)}
                />
                <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                  Solicitar
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-primary" />
                Solicitações e usuários
              </CardTitle>
              <CardDescription>
                Convites recebidos, solicitações enviadas e seus respectivos status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum convite pendente.
                </p>
              ) : (
                pending.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {l.athlete?.full_name ?? "Atleta"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.athlete?.email ?? l.invite_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {l.trainer_id === profile?.id ? (
                        <Badge variant="secondary">Aguardando atleta</Badge>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => handleAccept(l.id)}>
                            <Check className="size-4" />
                            Aceitar
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-9 text-muted-foreground hover:text-destructive"
                            onClick={() => handleReject(l.id)}
                            aria-label="Recusar solicitação"
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="size-4 text-primary" />
                Atletas vinculados
              </CardTitle>
              <CardDescription>
                Selecione o atleta cujos dados você quer ver.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedAthletes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum atleta vinculado ainda.
                </p>
              ) : (
                linkedAthletes.map((a) => {
                  const active = a.id === activeAthleteId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAthlete(a.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {a.full_name || a.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                      {active ? (
                        <Badge variant="default">
                          <Check className="size-3" /> Ativo
                        </Badge>
                      ) : (
                        <X className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      ) : null}

      {activeAthleteProfile ? (
        <Card className="border-primary/30 bg-primary/5 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <UserCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Atleta em exibição
              </p>
              <p className="font-medium text-foreground">
                {activeAthleteProfile.full_name || activeAthleteProfile.email}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
