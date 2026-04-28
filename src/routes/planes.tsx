import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, Eyebrow } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANS, PLAN_ORDER, formatPrice, formatLimit, type PlanId } from "@/lib/plans";
import { useSubscription } from "@/lib/subscription-store";
import { Check, Sparkles, TrendingUp, Zap, Shield, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/planes")({
  head: () => ({
    meta: [
      { title: "Planes — Operia" },
      { name: "description", content: "Empieza a recuperar ventas que hoy se pierden. 14 días gratis." },
    ],
  }),
  component: PlanesPage,
});

function PlanesPage() {
  const planActual = useSubscription((s) => s.planId);
  const status = useSubscription((s) => s.status);
  const startTrial = useSubscription((s) => s.startTrial);
  const changePlan = useSubscription((s) => s.changePlan);
  const navigate = useNavigate();

  const [openCheckout, setOpenCheckout] = useState<PlanId | null>(null);
  const [card, setCard] = useState({ numero: "", exp: "", cvc: "" });

  const enTrial = status === "trialing";

  function handleSelectPlan(id: PlanId) {
    if (status === "active" || enTrial) {
      if (id === planActual) return;
      changePlan(id);
      toast.success(`Plan cambiado a ${PLANS[id].nombre}`);
      navigate({ to: "/suscripcion" });
      return;
    }
    setOpenCheckout(id);
  }

  function confirmTrial() {
    if (!openCheckout) return;
    const last4 = card.numero.slice(-4) || "4242";
    startTrial(openCheckout, last4);
    toast.success(`¡Trial de 14 días iniciado en plan ${PLANS[openCheckout].nombre}!`);
    setOpenCheckout(null);
    navigate({ to: "/app" });
  }

  return (
    <AppShell>
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <Eyebrow>Operia para tu negocio</Eyebrow>
        <h1 className="text-[36px] md:text-[48px] leading-[1.05] font-semibold tracking-tight">
          Operia te paga sola.
        </h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground mt-4 leading-relaxed">
          Recupera las ventas que hoy se pierden por no responder a tiempo.
          Empieza gratis 14 días — solo pagas si te genera ingresos.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const isCurrent = id === planActual && (status === "trialing" || status === "active");
          return (
            <Card
              key={id}
              className={`p-6 flex flex-col relative ${
                p.destacado
                  ? "border-foreground shadow-[var(--shadow-elevated)] md:scale-105"
                  : ""
              }`}
            >
              {p.destacado && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10.5px] uppercase tracking-wider font-medium px-2.5 py-0.5 rounded-full">
                  Más elegido
                </span>
              )}
              <div className="mb-4">
                <h3 className="text-[20px] font-semibold">{p.nombre}</h3>
                <p className="text-[13px] text-muted-foreground mt-1 min-h-[36px]">{p.tagline}</p>
              </div>

              <div className="mb-5">
                <div className="text-[32px] font-semibold leading-none">
                  ${p.precio.toLocaleString("es-MX")}
                  <span className="text-[13px] text-muted-foreground font-normal ml-1">{p.moneda}/mes</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-success">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Recupera ~${p.ingresosEstimadosMes.toLocaleString("es-MX")} {p.moneda}/mes
                </div>
              </div>

              <ul className="space-y-2.5 text-[13.5px] mb-6 flex-1">
                <Feature ok>{formatLimit(p.features.pedidosMes)} pedidos automáticos / mes</Feature>
                <Feature ok>
                  {p.features.canalesPermitidos.map((c) => c[0].toUpperCase() + c.slice(1)).join(" + ")}
                </Feature>
                <Feature ok={p.features.modoRespuesta.includes("automatico")}>
                  Respuesta {p.features.modoRespuesta.includes("automatico") ? "100% automática" : "sugerida (manual)"}
                </Feature>
                <Feature ok={p.features.cobrosAutomaticos}>Cobros y recordatorios automáticos</Feature>
                <Feature ok={p.features.aprendizaje}>Aprendizaje continuo (vende más cada día)</Feature>
                <Feature ok={p.features.multiusuario}>Equipo multiusuario</Feature>
                <Feature ok={p.features.soportePrioritario}>Soporte prioritario</Feature>
              </ul>

              <Button
                onClick={() => handleSelectPlan(id)}
                disabled={isCurrent}
                variant={p.destacado ? "default" : "secondary"}
                className="w-full h-10"
              >
                {isCurrent ? "Tu plan actual" : enTrial || status === "active" ? "Cambiar a este plan" : "Empezar 14 días gratis"}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-center">
        <Trust icon={<Shield className="h-4 w-4" />} text="Cancela cuando quieras" />
        <Trust icon={<Zap className="h-4 w-4" />} text="Configurado en menos de 5 minutos" />
        <Trust icon={<Sparkles className="h-4 w-4" />} text="14 días para probarlo sin riesgo" />
      </div>

      <div className="text-center mt-10">
        <Link to="/app" className="text-[13px] text-muted-foreground hover:text-foreground">
          Volver al panel
        </Link>
      </div>

      {openCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setOpenCheckout(null)}>
          <Card className="p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4" /> <Eyebrow>Empezar trial</Eyebrow>
            </div>
            <h3 className="text-[20px] font-semibold mb-1">Plan {PLANS[openCheckout].nombre}</h3>
            <p className="text-[13px] text-muted-foreground mb-5">
              14 días gratis. No te cobramos hoy. Después: {formatPrice(PLANS[openCheckout])}.
              Cancela cuando quieras.
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <Label className="text-[12px]">Número de tarjeta</Label>
                <Input
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={card.numero}
                  onChange={(e) => setCard({ ...card, numero: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[12px]">Vencimiento</Label>
                  <Input placeholder="MM/AA" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[12px]">CVC</Label>
                  <Input placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ⚠️ Modo demostración. Aún no procesamos cobros reales — pronto conectaremos Stripe.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setOpenCheckout(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={confirmTrial}>
                Empezar trial
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Feature({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? "" : "text-muted-foreground/60 line-through"}`}>
      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${ok ? "text-success" : "text-muted-foreground/40"}`} />
      <span>{children}</span>
    </li>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}
