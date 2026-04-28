import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import { Lock, ArrowRight } from "lucide-react";
import operiaIcon from "@/assets/operia-icon.png";
import operiaLogo from "@/assets/operia-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Operia" },
      { name: "description", content: "Accede a tu cuenta de Operia." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const user = useAuth((s) => s.user);
  const onboarded = useAuth((s) => s.onboarded);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && user) {
      navigate({ to: onboarded ? "/app" : "/onboarding" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, onboarded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    login(email.trim(), email.split("@")[0]);
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-5 md:px-8 h-14 flex items-center border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={operiaIcon} alt="" className="h-7 w-7 rounded-full" />
          <img src={operiaLogo} alt="Operia" className="h-[16px] w-auto" />
        </Link>
      </header>

      <main className="flex-1 grid place-items-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="h-11 w-11 rounded-xl bg-foreground text-background grid place-items-center mx-auto mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-[24px] font-semibold tracking-tight">Entrar a Operia</h1>
            <p className="text-[13.5px] text-muted-foreground mt-1.5">
              Accede a tu centro de mando del día.
            </p>
          </div>

          <Card className="p-6 rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[12.5px] font-medium text-foreground/80">Correo</label>
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@negocio.com"
                  className="mt-1.5 rounded-lg h-10"
                />
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-foreground/80">Contraseña</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 rounded-lg h-10"
                />
              </div>
              <Button type="submit" className="w-full h-11">
                Entrar <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-[11.5px] text-muted-foreground text-center pt-1">
                Modo demo · cualquier correo funciona para probar.
              </p>
            </form>
          </Card>

          <p className="text-[12px] text-muted-foreground text-center mt-6">
            Tus pedidos, clientes y notas se mantienen organizados en un solo lugar.
          </p>
          <p className="text-[12px] text-muted-foreground text-center mt-3">
            ¿Aún no conoces Operia?{" "}
            <Link to="/" className="text-foreground underline">Ver cómo funciona</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
