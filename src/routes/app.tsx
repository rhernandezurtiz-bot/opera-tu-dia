import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperia, todayStr, type Order } from "@/lib/operia-store";
import { useUI, buildMissingMessage, summarizeMoney, money } from "@/lib/ui-store";
import { AppShell, PageHeader, RiskBadge, UrgencyChip, Eyebrow, SectionHeading } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Copy,
  ChevronRight,
  TrendingUp,
  AlertOctagon,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Inicio — Operia" },
      { name: "description", content: "Tu centro de mando: lo que debes hacer hoy, alertas y pedidos urgentes." },
    ],
  }),
  component: Index,
});

function Index() {
  const orders = useOperia((s) => s.orders);
  const updateOrder = useOperia((s) => s.updateOrder);
  const openNew = useUI((s) => s.openNewOrder);
  const today = todayStr();
  const todays = orders.filter((o) => o.fechaEntrega === today && o.estado !== "cancelado");
  const risky = orders.filter(
    (o) => (o.riesgo === "alto" || o.riesgo === "medio") && o.estado !== "entregado" && o.estado !== "cancelado",
  );

  const aConfirmar = todays.filter((o) => o.estado === "nuevo").length;
  const porHacer = todays.filter((o) => o.estado !== "entregado").length;
  const porEntregar = todays.filter((o) => o.estado === "listo" || o.estado === "en_proceso").length;
  const dinero = summarizeMoney(orders);

  const sortedTodays = [...todays].sort((a, b) =>
    (a.horaEntrega || "99:99").localeCompare(b.horaEntrega || "99:99"),
  );

  // Action-driven primary line
  const headline =
    aConfirmar > 0
      ? `Confirmar ${aConfirmar} ${aConfirmar === 1 ? "pedido" : "pedidos"} ahora`
      : porHacer > 0
        ? `${porHacer} ${porHacer === 1 ? "cosa" : "cosas"} por hacer hoy`
        : "Todo en orden por hoy";

  return (
    <AppShell>
      <PageHeader
        title={headline}
        subtitle="Tu centro de mando del día. Empieza por lo urgente."
        actions={
          <Button onClick={openNew} size="lg" className="rounded-lg">
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </Button>
        }
      />

      {/* Money */}
      <section className="mb-10">
        <Eyebrow>💰 Dinero del día</Eyebrow>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MoneyCard
            icon={TrendingUp}
            label="Ingresos estimados hoy"
            value={money(dinero.ingresosHoy)}
            hint={`${todays.filter((o) => o.estado !== "entregado").length} pedidos pendientes`}
            tone="default"
          />
          <MoneyCard
            icon={Wallet}
            label="Pendientes de pago"
            value={money(dinero.montoSinAnticipo)}
            hint={`${dinero.pedidosSinAnticipo} ${dinero.pedidosSinAnticipo === 1 ? "pedido sin anticipo" : "pedidos sin anticipo"}`}
            tone="warning"
          />
          <MoneyCard
            icon={AlertOctagon}
            label="Ingresos en riesgo"
            value={money(dinero.ingresosEnRiesgo)}
            hint={`${risky.length} con datos faltantes`}
            tone="danger"
          />
        </div>
      </section>

      {/* Quick action callout */}
      {aConfirmar > 0 && (
        <Card className="mb-8 p-4 md:p-5 rounded-xl border-foreground/15 bg-foreground/3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-foreground text-background grid place-items-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-medium">
                Tienes {aConfirmar} {aConfirmar === 1 ? "pedido nuevo sin confirmar" : "pedidos nuevos sin confirmar"}
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Confírmalos para que entren al plan del día.
              </div>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/pedidos">
              Ver pendientes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
        <section className="lg:col-span-2">
          <SectionHeading
            title={porEntregar > 0 ? `${porEntregar} ${porEntregar === 1 ? "entrega" : "entregas"} hoy` : "Pedidos de hoy"}
            subtitle={`${sortedTodays.length} ${sortedTodays.length === 1 ? "programado" : "programados"} · ordenados por hora`}
            action={
              sortedTodays.length > 0 && (
                <Link
                  to="/produccion"
                  className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Plan del día <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )
            }
          />

          {sortedTodays.length === 0 ? (
            orders.length === 0 ? (
              <FirstRunEmpty onStart={openNew} />
            ) : (
              <EmptyState
                title="Sin pedidos para hoy"
                hint="Cuando lleguen, aparecerán aquí ordenados por hora."
              />
            )
          ) : (
            <div className="space-y-2.5">
              {sortedTodays.map((o) => (
                <OrderActionCard
                  key={o.id}
                  order={o}
                  onConfirm={() => {
                    updateOrder(o.id, { estado: "confirmado" });
                    toast.success("Pedido confirmado");
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading
            title={
              risky.length === 0
                ? "Sin alertas"
                : `Resolver ${risky.length} ${risky.length === 1 ? "problema" : "problemas"}`
            }
            subtitle={
              risky.length === 0
                ? "Nada pendiente"
                : "Datos faltantes que pueden costarte dinero"
            }
          />

          {risky.length === 0 ? (
            <EmptyState title="Todo en orden" hint="No hay pedidos en riesgo." compact />
          ) : (
            <div className="space-y-1.5">
              {risky.slice(0, 5).map((o) => (
                <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }}>
                  <Card className="p-3.5 rounded-xl flex items-center gap-3 hover:border-foreground/15 transition-colors">
                    <div
                      className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${
                        o.riesgo === "alto"
                          ? "bg-danger/8 text-danger/90"
                          : "bg-warning/12 text-foreground/70"
                      }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium truncate">
                        {o.cliente || "Sin nombre"}
                      </div>
                      <div className="text-[12px] text-muted-foreground truncate">
                        Falta: {o.faltantes.slice(0, 2).join(", ") || "Revisar"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                  </Card>
                </Link>
              ))}
              {risky.length > 5 && (
                <Link
                  to="/riesgos"
                  className="block text-center text-[12.5px] text-muted-foreground hover:text-foreground py-2"
                >
                  Resolver los {risky.length} pendientes →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function MoneyCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
  tone: "default" | "danger" | "warning";
}) {
  const styles =
    tone === "danger"
      ? "bg-danger/8 text-danger/90"
      : tone === "warning"
        ? "bg-warning/15 text-foreground/70"
        : "bg-secondary text-foreground/70 border border-border";
  return (
    <Card className="p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-8 w-8 rounded-lg grid place-items-center ${styles}`}>
          <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
        </div>
      </div>
      <div className="text-[26px] leading-none font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[13px] text-foreground/70 mt-2 font-medium">{label}</div>
      <div className="text-[11.5px] text-muted-foreground mt-0.5">{hint}</div>
    </Card>
  );
}

function OrderActionCard({ order, onConfirm }: { order: Order; onConfirm: () => void }) {
  const copyMissing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(buildMissingMessage(order.cliente, order.faltantes));
    toast.success("Mensaje copiado");
  };

  return (
    <Card className="p-4 md:p-5 rounded-xl hover:border-foreground/15 transition-colors">
      <Link to="/pedidos/$id" params={{ id: order.id }} className="block">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="font-medium text-[15px] truncate">
              {order.cliente || "Cliente sin nombre"}
            </div>
            <div className="text-[13px] text-muted-foreground truncate mt-0.5">
              {order.descripcion || "Descripción pendiente"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RiskBadge level={order.riesgo} />
            {order.precio > 0 && (
              <span className="text-[12.5px] font-semibold tabular-nums">
                {money(order.precio)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UrgencyChip fecha={order.fechaEntrega} hora={order.horaEntrega} />
          {order.faltantes.length > 0 && (
            <span className="text-[11.5px] text-muted-foreground">
              Falta: {order.faltantes.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border">
        {order.estado === "nuevo" && (
          <Button size="sm" variant="secondary" onClick={onConfirm}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
          </Button>
        )}
        {order.faltantes.length > 0 && (
          <Button size="sm" variant="ghost" onClick={copyMissing}>
            <Copy className="h-3.5 w-3.5" /> Copiar mensaje
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" asChild>
          <Link to="/pedidos/$id" params={{ id: order.id }}>
            Abrir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({
  title,
  hint,
  compact,
}: {
  title: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <Card
      className={`rounded-xl text-center ${
        compact ? "p-6" : "p-10"
      } border-dashed bg-secondary/30`}
    >
      <div className="text-[14px] font-medium text-foreground/80">{title}</div>
      {hint && <div className="text-[12.5px] text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

function FirstRunEmpty({ onStart }: { onStart: () => void }) {
  return (
    <Card className="rounded-2xl p-10 text-center border-dashed bg-secondary/30">
      <div className="h-11 w-11 rounded-xl bg-foreground text-background grid place-items-center mx-auto mb-4">
        <Plus className="h-5 w-5" />
      </div>
      <div className="text-[16px] font-semibold mb-1.5">
        Pega tu primer mensaje de WhatsApp para empezar.
      </div>
      <p className="text-[13px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
        Operia lo convierte en un pedido organizado con cliente, fecha, hora y lo que falta.
      </p>
      <Button onClick={onStart} className="mt-5 h-10">
        <Plus className="h-4 w-4" /> Crear mi primer pedido
      </Button>
      <p className="text-[11.5px] text-muted-foreground mt-5">
        Tus pedidos, clientes y notas se mantienen organizados en un solo lugar.
      </p>
    </Card>
  );
}
