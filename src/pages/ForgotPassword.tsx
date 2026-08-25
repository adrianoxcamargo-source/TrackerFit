import { ArrowLeft, Dumbbell, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
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
            <CardTitle>{sent ? "Verifique seu e-mail" : "Recuperar senha"}</CardTitle>
            <CardDescription>
              {sent
                ? "Se existir uma conta com esse e-mail, você receberá um link para criar uma nova senha."
                : "Informe o e-mail usado no TrackerFit."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-5 text-center">
                <MailCheck className="mx-auto size-12 text-primary" />
                <Button className="w-full" onClick={() => navigate("/auth")}>Voltar para entrar</Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">E-mail</Label>
                  <Input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Enviar link de recuperação"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
                  <ArrowLeft className="mr-2 size-4" /> Voltar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
