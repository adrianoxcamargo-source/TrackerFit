import { Dumbbell, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Role = "atleta" | "treinador";

export default function Auth() {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suRole, setSuRole] = useState<Role>("atleta");
  const [suLoading, setSuLoading] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const friendlyAuthError = (message: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("already registered") ||
      normalized.includes("already exists") ||
      normalized.includes("user already")
    ) {
      return "Este e-mail já possui uma conta. Use a aba Entrar para acessar, ou recupere a senha se necessário.";
    }
    return message;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error));
      return;
    }
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPassword.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    setSuLoading(true);
    const { error } = await signUp({
      email: suEmail,
      password: suPassword,
      fullName: suName,
      role: suRole,
    });
    setSuLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error));
      return;
    }
    toast.success("Conta criada com sucesso.");
    navigate("/");
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Dumbbell className="size-7" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            TrackerFit
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de treino com acesso compartilhado
          </p>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="li-email">E-mail</Label>
                    <Input
                      id="li-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="li-pass">Senha</Label>
                    <Input
                      id="li-pass"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    {loginLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">Nome completo</Label>
                    <Input
                      id="su-name"
                      required
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email">E-mail</Label>
                    <Input
                      id="su-email"
                      type="email"
                      required
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-pass">Senha</Label>
                    <Input
                      id="su-pass"
                      type="password"
                      required
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vou usar como</Label>
                    <RadioGroup
                      value={suRole}
                      onValueChange={(v) => setSuRole(v as Role)}
                      className="grid grid-cols-2 gap-2"
                    >
                      {(["atleta", "treinador"] as Role[]).map((r) => (
                        <label
                          key={r}
                          htmlFor={`role-${r}`}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                        >
                          <RadioGroupItem value={r} id={`role-${r}`} />
                          <span className="font-medium capitalize text-foreground">
                            {r}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="size-3.5" />
                      {suRole === "atleta"
                        ? "Atleta treina e registra; pode convidar um treinador."
                        : "Treinador vê/edita o plano dos atletas vinculados."}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={suLoading}
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    {suLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
