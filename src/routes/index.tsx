import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperia, todayStr, type Order } from "@/lib/operia-store";
import { useUI, buildMissingMessage } from "@/lib/ui-store";
import { AppShell, PageHeader, RiskBadge, UrgencyChip } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, AlertCircle, Package, Wrench, CalendarClock, CheckCircle2, Copy } from "lucide-react";
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
  const risky = orders.filter((o) => (o.riesgo === "alto" || o.riesgo === "medio") && o.estado !== "entregado" && o.estado !== "cancelado");

  // HOY DEBES HACER
  const aPreparar = todays.filter((o) => o.tipo === "producto" || o.tipo === "personalizado").filter((o) => o.estado !== "entregado" && o.estado !== "listo").length;
  const aEjecutar = todays.filter((o) => o.tipo === "servicio" || o.tipo === "cita").filter((o) => o.estado !== "entregado").length;
  const aConfirmar = todays.filter((o) => o.estado === "nuevo").length;
  const aEntregar = todays.filter((o) => o.estado === "listo" || o.estado === "en_proceso").length;

  const todoItems = [
    aPreparar > 0 && { icon: Package, text: `Preparar ${aPreparar} ${aPreparar === 1 ? "pedido" : "pedidos"}`, tone: "bg-accent/60" },
    aEjecutar > 0 && { icon: Wrench, text: `Ejecutar ${aEjecutar} ${aEjecutar === 1 ? "servicio/cita" : "servicios/citas"}`, tone: "bg-secondary" },
    aConfirmar > 0 && { icon: CheckCircle2, text: `Confirmar ${aConfirmar} ${aConfirmar === 1 ? "pedido nuevo" : "pedidos nuevos"}`, tone: "bg-warning/20" },
    aEntregar > 0 && { icon: CalendarClock, text: `Entregar ${aEntregar} ${aEntregar === 1 ? "pedido" : "pedidos"}`, tone: "bg-success/15" },
  ].filter(Boolean) as { icon: any; text: string; tone: string }[];

  // Sort today's orders by hour (urgent first)
  const sortedTodays = [...todays].sort((a, b) => (a.horaEntrega || "99:99").localeCompare(b.horaEntrega || "99:99"));

  return (
    <AppShell>
      <PageHeader
        title="Hoy en Operia"
        subtitle="Tu centro de mando del día. Esto es lo que debes hacer."
        actions={
          <Button onClick={openNew} size="lg" className="rounded-full shadow-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Nuevo pedido desde WhatsApp
          </Button>
        }
      />

      {/* HOY DEBES HACER */}
      <section className="mb-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Hoy debes hacer</div>
        {todoItems.length === 0 ? (
          <Card className="p-6 rounded-3xl text-center text-muted-foreground">
            Sin tareas pendientes para hoy. Disfruta tu día ✨
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {todoItems.map((t, i) => {
              const Icon = t.icon;
              return (
                <Card key={i} className={`p-4 rounded-2xl border-border/70 ${t.tone}`}>
                  <Icon className="h-5 w-5 mb-2" />
                  <div className="text-base font-medium leading-snug">{t.text}</div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="text-xl font-display mb-3">Pedidos de hoy</h2>
          {sortedTodays.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground rounded-2xl">No hay pedidos para hoy todavía.</Card>
          ) : (
            <div className="space-y-3">
              {sortedTodays.map((o) => (
                <OrderActionCard key={o.id} order={o} onConfirm={() => { updateOrder(o.id, { estado: "confirmado" }); toast.success("Pedido confirmado"); }} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-display mb-3">Necesitan atención</h2>
          {risky.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground rounded-2xl text-sm">Todo en orden ✨</Card>
          ) : (
            <div className="space-y-2">
              {risky.slice(0, 5).map((o) => (
                <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }}>
                  <Card className="p-3 rounded-2xl flex items-center gap-3 hover:bg-secondary/40">
                    <AlertCircle className={`h-4 w-4 shrink-0 ${o.riesgo === "alto" ? "text-danger" : "text-warning"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{o.cliente || "Sin nombre"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Falta: {o.faltantes.slice(0, 2).join(", ") || "Revisar"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
              {risky.length > 5 && (
                <Link to="/riesgos" className="block text-center text-xs text-muted-foreground hover:text-foreground py-2">
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
    navigator.clipboard.writeText(buildMissingMessage(order.cliente, order.faltantes));
    toast.success("Mensaje copiado");
  };

  return (
    <Card className="p-4 rounded-2xl">
      <Link to="/pedidos/$id" params={{ id: order.id }} className="block">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{order.cliente || "Cliente sin nombre"}</div>
            <div className="text-sm text-muted-foreground truncate">{order.descripcion || "Descripción pendiente"}</div>
          </div>
          <RiskBadge level={order.riesgo} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UrgencyChip fecha={order.fechaEntrega} hora={order.horaEntrega} />
          {order.faltantes.length > 0 && (
            <span className="text-[11px] text-muted-foreground">Falta: {order.faltantes.slice(0, 2).join(", ")}</span>
          )}
        </div>
      </Link>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/60">
        {order.estado === "nuevo" && (
          <Button size="sm" variant="secondary" className="rounded-full" onClick={onConfirm}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirmar
          </Button>
        )}
        {order.faltantes.length > 0 && (
          <Button size="sm" variant="ghost" className="rounded-full" onClick={copyMissing}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje
          </Button>
        )}
        <Button size="sm" variant="ghost" className="rounded-full ml-auto" asChild>
          <Link to="/pedidos/$id" params={{ id: order.id }}>
            Abrir <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
