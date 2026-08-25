import { Dumbbell, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { session, loading: authLoading, updatePassword, clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setLoading(false);
      toast.error(error);
      return;
    }
    await signOut();
    toast.success("Senha alterada com sucesso. Entre com a nova senha.");
    navigate("/auth", { replace: true });
  };

  const cancel = () => {
    clearPasswordRecovery();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Dumbbell className="size-7" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">TrackerFit</h1>
        </div>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Criar nova senha</CardTitle>
            <CardDescription>Escolha uma senha nova para sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            {authLoading ? (
              <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            ) : !session ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Este link expirou ou não é válido. Solicite um novo e-mail de recuperação.</p>
                <Button className="w-full" onClick={() => navigate("/forgot-password")}>Solicitar novo link</Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input id="new-password" type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input id="confirm-password" type="password" required autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={cancel}>Cancelar</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
