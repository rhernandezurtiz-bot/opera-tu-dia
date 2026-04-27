import { createFileRoute, Link } from "@tanstack/react-router";
import { useOperia, todayStr } from "@/lib/operia-store";
import { AppShell, PageHeader, RiskBadge, StatusBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, AlertCircle, Clock, DollarSign } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio — Operia" },
      { name: "description", content: "Resumen de tus pedidos del día, alertas y producción pendiente." },
    ],
  }),
  component: Index,
});

function Index() {
  const orders = useOperia((s) => s.orders);
  const today = todayStr();
  const todays = orders.filter((o) => o.fechaEntrega === today);
  const risky = orders.filter((o) => o.riesgo === "alto" || o.riesgo === "medio");
  const pending = orders.filter((o) => o.estado !== "entregado" && o.estado !== "cancelado");
  const ventas = todays.reduce((acc, o) => acc + (o.precio || 0), 0);

  const stats = [
    { label: "Pedidos de hoy", value: todays.length, icon: Clock, hint: "Programados para entregar" },
    { label: "Pedidos en riesgo", value: risky.length, icon: AlertCircle, hint: "Requieren tu atención" },
    { label: "Producción pendiente", value: pending.length, icon: Sparkles, hint: "En la cocina o por preparar" },
    { label: "Ventas estimadas", value: `$${ventas.toLocaleString("es-MX")}`, icon: DollarSign, hint: "Total del día de hoy" },
  ];

  const alerts = orders
    .filter((o) => o.faltantes.length > 0 || o.riesgo !== "bajo")
    .slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Buen día 👋"
        subtitle="Aquí está tu panorama operativo de hoy."
        actions={
          <Button asChild size="lg" className="rounded-full">
            <Link to="/nuevo">
              <Sparkles className="h-4 w-4 mr-2" />
              Pegar pedido de WhatsApp
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 rounded-2xl border-border/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-display">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="text-xl font-display mb-3">Pedidos de hoy</h2>
          {todays.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground rounded-2xl">No hay pedidos para hoy todavía.</Card>
          ) : (
            <div className="space-y-3">
              {todays.map((o) => (
                <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }} className="block">
                  <Card className="p-4 rounded-2xl hover:border-foreground/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{o.cliente || "Cliente sin nombre"}</div>
                        <div className="text-sm text-muted-foreground truncate">{o.producto || "Producto pendiente"}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Entrega: {o.horaEntrega || "hora pendiente"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={o.estado} />
                        <RiskBadge level={o.riesgo} />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-display mb-3">Alertas importantes</h2>
          {alerts.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground rounded-2xl text-sm">Todo en orden ✨</Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((o) => (
                <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }}>
                  <Card className="p-3 rounded-2xl flex items-center gap-3 hover:bg-secondary/40">
                    <AlertCircle className={`h-4 w-4 shrink-0 ${o.riesgo === "alto" ? "text-danger" : "text-warning"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{o.cliente || "Cliente sin nombre"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Falta: {o.faltantes.slice(0, 2).join(", ") || "Revisar pedido"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
