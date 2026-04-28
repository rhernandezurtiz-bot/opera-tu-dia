import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, Eyebrow } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription, trialDaysLeft } from "@/lib/subscription-store";
import { useUsageLimits } from "@/lib/usage-limits";
import { formatPrice, formatLimit, PLANS } from "@/lib/plans";
import { CreditCard, AlertTriangle, ArrowUp, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/suscripcion")({
  head: () => ({
    meta: [
      { title: "Tu suscripción — Operia" },
      { name: "description", content: "Gestiona tu plan, uso y método de pago." },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const sub = useSubscription();
  const usage = useUsageLimits();
  const days = trialDaysLeft(sub);
  const plan = usage.plan;

  const pedidosPct = Number.isFinite(usage.pedidosMax)
    ? Math.min(100, Math.round((usage.pedidosUsados / usage.pedidosMax) * 100))
    : 0;

  return (
    <AppShell>
      <PageHeader
        title="Tu suscripción"
        subtitle="Gestiona tu plan, uso del mes y método de pago."
        actions={
          <Button asChild variant="secondary">
            <Link to="/planes">Cambiar de plan</Link>
          </Button>
        }
      />

      {sub.status === "trialing" && (
        <Card className="p-4 mb-5 border-warning/40 bg-warning/5 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
          <div className="flex-1 text-[13px]">
            <strong>Estás en periodo de prueba.</strong> Quedan <strong>{days} día{days === 1 ? "" : "s"}</strong>.
            Después se cobrará {formatPrice(plan)} a tu tarjeta •••• {sub.cardLast4 ?? "----"}.
          </div>
        </Card>
      )}

      {sub.status === "canceled" && (
        <Card className="p-4 mb-5 border-danger/40 bg-danger/5 flex items-start gap-3">
          <X className="h-4 w-4 text-danger mt-0.5" />
          <div className="flex-1 text-[13px]">
            <strong>Suscripción cancelada.</strong> Operia dejó de tomar pedidos automáticamente.
            <Button asChild size="sm" className="ml-3">
              <Link to="/planes">Reactivar</Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <Card className="p-5">
          <Eyebrow>Plan actual</Eyebrow>
          <div className="text-[24px] font-semibold mt-1">{plan.nombre}</div>
          <div className="text-[13px] text-muted-foreground">{formatPrice(plan)}</div>
        </Card>

        <Card className="p-5">
          <Eyebrow>Pedidos este mes</Eyebrow>
          <div className="text-[24px] font-semibold mt-1">
            {usage.pedidosUsados}
            <span className="text-[13px] text-muted-foreground font-normal">
              {" "}/ {formatLimit(usage.pedidosMax)}
            </span>
          </div>
          {Number.isFinite(usage.pedidosMax) && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${pedidosPct >= 90 ? "bg-danger" : pedidosPct >= 70 ? "bg-warning" : "bg-foreground"}`}
                style={{ width: `${pedidosPct}%` }}
              />
            </div>
          )}
        </Card>

        <Card className="p-5">
          <Eyebrow>Canales activos</Eyebrow>
          <div className="text-[24px] font-semibold mt-1">
            {usage.canalesActivos.length}
            <span className="text-[13px] text-muted-foreground font-normal"> / {usage.canalesMax}</span>
          </div>
          <div className="text-[12px] text-muted-foreground mt-1">
            {usage.canalesActivos.length === 0 ? "Ninguno conectado" : usage.canalesActivos.join(" · ")}
          </div>
        </Card>
      </div>

      {usage.pedidosBloqueado && (
        <Card className="p-4 mb-5 border-danger/40 bg-danger/5">
          <div className="text-[13px] mb-2">
            <strong>Llegaste al límite de tu plan.</strong> No podrás crear más pedidos este mes.
          </div>
          <Button asChild size="sm">
            <Link to="/planes">
              <ArrowUp className="h-3.5 w-3.5" /> Subir de plan
            </Link>
          </Button>
        </Card>
      )}

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Eyebrow>Método de pago</Eyebrow>
            <div className="flex items-center gap-2 mt-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-[14px]">
                Tarjeta •••• {sub.cardLast4 ?? "----"}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Próximo cobro: {sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </p>
      </Card>

      <Card className="p-5">
        <Eyebrow>Comparativa rápida</Eyebrow>
        <div className="text-[13px] text-muted-foreground mt-1 mb-3">
          Si subes a un plan superior, esto cambia:
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {(["pro", "business"] as const).map((id) => {
            if (id === sub.planId) return null;
            const p = PLANS[id];
            const masPedidos = Number.isFinite(p.features.pedidosMes)
              ? p.features.pedidosMes - (Number.isFinite(usage.pedidosMax) ? usage.pedidosMax : 0)
              : Infinity;
            return (
              <div key={id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-[13.5px]">{p.nombre}</strong>
                  <span className="text-[12px] text-muted-foreground">{formatPrice(p)}</span>
                </div>
                <div className="text-[12px] text-muted-foreground mb-2">{p.tagline}</div>
                <div className="text-[11.5px] text-success">
                  +{Number.isFinite(masPedidos) ? masPedidos : "∞"} pedidos/mes ·{" "}
                  +{p.features.canalesPermitidos.length - plan.features.canalesPermitidos.length || 0} canales
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {sub.status !== "canceled" && (
        <div className="mt-8 text-center">
          <button
            className="text-[12px] text-muted-foreground hover:text-danger transition-colors"
            onClick={() => {
              if (confirm("¿Seguro que quieres cancelar? Operia dejará de responder automáticamente.")) {
                sub.cancel();
                toast("Suscripción cancelada");
              }
            }}
          >
            Cancelar suscripción
          </button>
        </div>
      )}
    </AppShell>
  );
}
