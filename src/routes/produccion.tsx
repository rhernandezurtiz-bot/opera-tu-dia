import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, UrgencyChip, StatusBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useOperia, todayStr, typeLabels, type Order, type OrderType } from "@/lib/operia-store";
import { urgency } from "@/lib/ui-store";
import { Package, Wrench, CalendarClock, Sparkles, Flame, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produccion")({
  head: () => ({
    meta: [
      { title: "Plan del día — Operia" },
      { name: "description", content: "Plan diario de trabajo agrupado por prioridad. Lo urgente primero." },
    ],
  }),
  component: Produccion,
});

const typeIcon: Record<OrderType, any> = {
  producto: Package, servicio: Wrench, cita: CalendarClock, personalizado: Sparkles,
};

function Produccion() {
  const orders = useOperia((s) => s.orders);
  const updateOrder = useOperia((s) => s.updateOrder);
  const today = todayStr();

  const active = orders
    .filter((o) => o.estado !== "cancelado" && o.estado !== "entregado")
    .sort((a, b) => {
      const af = a.fechaEntrega || "9999-99-99";
      const bf = b.fechaEntrega || "9999-99-99";
      if (af !== bf) return af.localeCompare(bf);
      return (a.horaEntrega || "99:99").localeCompare(b.horaEntrega || "99:99");
    });

  const urgentes = active.filter((o) => {
    if (!o.fechaEntrega) return true;
    if (o.fechaEntrega < today) return true;
    if (o.fechaEntrega === today) {
      const u = urgency(o.fechaEntrega, o.horaEntrega);
      return u.tone === "danger";
    }
    return false;
  });
  const hoy = active.filter((o) => o.fechaEntrega === today && !urgentes.includes(o));
  const proximas = active.filter((o) => o.fechaEntrega && o.fechaEntrega > today);

  return (
    <AppShell>
      <PageHeader
        title="Plan del día"
        subtitle="Tu trabajo, ordenado por prioridad. Empieza por lo urgente."
      />

      <PriorityGroup
        title="Urgente — atender ya"
        icon={Flame}
        accent="text-danger"
        bg="bg-danger/5 border-danger/20"
        orders={urgentes}
        onAdvance={(id, next) => { updateOrder(id, { estado: next }); toast.success("Estado actualizado"); }}
      />

      <PriorityGroup
        title="Hoy"
        icon={CalendarClock}
        accent="text-foreground"
        bg="bg-card border-border"
        orders={hoy}
        onAdvance={(id, next) => { updateOrder(id, { estado: next }); toast.success("Estado actualizado"); }}
      />

      <PriorityGroup
        title="Próximas"
        icon={Sparkles}
        accent="text-muted-foreground"
        bg="bg-secondary/40 border-border"
        orders={proximas}
        onAdvance={(id, next) => { updateOrder(id, { estado: next }); toast.success("Estado actualizado"); }}
      />

      {active.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground rounded-3xl">No hay trabajo pendiente. ✨</Card>
      )}
    </AppShell>
  );
}

function PriorityGroup({ title, icon: Icon, accent, bg, orders, onAdvance }: {
  title: string; icon: any; accent: string; bg: string;
  orders: Order[]; onAdvance: (id: string, next: Order["estado"]) => void;
}) {
  if (orders.length === 0) return null;
  return (
    <section className="mb-8">
      <div className={`flex items-center gap-2 mb-3 ${accent}`}>
        <Icon className="h-4 w-4" />
        <h2 className="font-display text-lg">{title} <span className="text-muted-foreground text-sm">· {orders.length}</span></h2>
      </div>
      <div className="space-y-2">
        {orders.map((o) => {
          const TypeIcon = typeIcon[o.tipo];
          const next = nextStatus(o.estado);
          return (
            <Card key={o.id} className={`p-4 rounded-2xl border ${bg}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1"
                  checked={o.estado === "listo"}
                  onCheckedChange={() => onAdvance(o.id, o.estado === "listo" ? "en_proceso" : "listo")}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{typeLabels[o.tipo]}</span>
                      </div>
                      <div className="font-medium truncate">{o.cliente || "Sin nombre"}</div>
                      <div className="text-sm text-muted-foreground">{o.descripcion || "Descripción pendiente"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <UrgencyChip fecha={o.fechaEntrega} hora={o.horaEntrega} />
                      <StatusBadge status={o.estado} />
                    </div>
                  </div>
                  {o.detalles && (
                    <div className="text-xs text-muted-foreground italic mt-1 truncate">"{o.detalles}"</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {next && (
                      <Button size="sm" variant="secondary" className="rounded-full" onClick={() => onAdvance(o.id, next.value)}>
                        {next.label}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-full ml-auto" asChild>
                      <Link to="/pedidos/$id" params={{ id: o.id }}>
                        Abrir <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function nextStatus(s: Order["estado"]): { value: Order["estado"]; label: string } | null {
  switch (s) {
    case "nuevo": return { value: "confirmado", label: "Confirmar" };
    case "confirmado": return { value: "en_proceso", label: "Empezar" };
    case "en_proceso": return { value: "listo", label: "Marcar listo" };
    case "listo": return { value: "entregado", label: "Marcar entregado" };
    default: return null;
  }
}
