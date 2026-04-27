import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperia, todayStr, type Order } from "@/lib/operia-store";
import { useUI, buildMissingMessage } from "@/lib/ui-store";
import { AppShell, PageHeader, RiskBadge, UrgencyChip, Eyebrow, SectionHeading } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Plus,
  AlertCircle,
  Package,
  Wrench,
  CalendarClock,
  CheckCircle2,
  Copy,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
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

  const aPreparar = todays
    .filter((o) => o.tipo === "producto" || o.tipo === "personalizado")
    .filter((o) => o.estado !== "entregado" && o.estado !== "listo").length;
  const aEjecutar = todays
    .filter((o) => o.tipo === "servicio" || o.tipo === "cita")
    .filter((o) => o.estado !== "entregado").length;
  const aConfirmar = todays.filter((o) => o.estado === "nuevo").length;
  const aEntregar = todays.filter((o) => o.estado === "listo" || o.estado === "en_proceso").length;

  type Metric = { icon: any; label: string; value: number; hint: string };
  const metrics: Metric[] = [
    { icon: CheckCircle2, label: "Por confirmar", value: aConfirmar, hint: "Pedidos nuevos sin confirmar" },
    { icon: Package, label: "Por preparar", value: aPreparar, hint: "Productos y trabajos personalizados" },
    { icon: Wrench, label: "Por ejecutar", value: aEjecutar, hint: "Servicios y citas agendadas" },
    { icon: CalendarClock, label: "Por entregar", value: aEntregar, hint: "Listos o en proceso final" },
  ];

  const sortedTodays = [...todays].sort((a, b) =>
    (a.horaEntrega || "99:99").localeCompare(b.horaEntrega || "99:99"),
  );

  return (
    <AppShell>
      <PageHeader
        title="Hoy en Operia"
        subtitle="Tu centro de mando del día. Esto es lo que debes hacer."
        actions={
          <Button onClick={openNew} size="lg" className="rounded-lg">
            <Plus className="h-4 w-4" />
            Nuevo pedido desde WhatsApp
          </Button>
        }
      />

      {/* Metrics */}
      <section className="mb-12">
        <Eyebrow>Resumen del día</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.label}
                className="p-5 rounded-xl hover:border-foreground/15 transition-colors"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="h-8 w-8 rounded-lg bg-secondary border border-border grid place-items-center">
                    <Icon className="h-[15px] w-[15px] text-foreground/70" strokeWidth={2} />
                  </div>
                </div>
                <div className="text-[32px] leading-none font-semibold tracking-tight tabular-nums">
                  {m.value}
                </div>
                <div className="text-[13px] text-foreground/70 mt-2 font-medium">{m.label}</div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">{m.hint}</div>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
        <section className="lg:col-span-2">
          <SectionHeading
            title="Pedidos de hoy"
            subtitle={`${sortedTodays.length} ${sortedTodays.length === 1 ? "pedido programado" : "pedidos programados"}`}
            action={
              sortedTodays.length > 0 && (
                <Link
                  to="/pedidos"
                  className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )
            }
          />

          {sortedTodays.length === 0 ? (
            <EmptyState
              title="Sin pedidos para hoy"
              hint="Cuando lleguen, aparecerán aquí ordenados por hora."
            />
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
            title="Necesitan atención"
            subtitle={risky.length === 0 ? "Todo en orden" : `${risky.length} con datos faltantes`}
          />

          {risky.length === 0 ? (
            <EmptyState title="Sin alertas" hint="No hay pedidos en riesgo." compact />
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
                  Ver los {risky.length} pedidos en riesgo →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
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
          <RiskBadge level={order.riesgo} />
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
