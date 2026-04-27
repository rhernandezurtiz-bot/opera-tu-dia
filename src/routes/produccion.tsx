import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOperia, todayStr, typeLabels, type OrderType } from "@/lib/operia-store";
import { Package, Wrench, CalendarClock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/produccion")({
  head: () => ({
    meta: [
      { title: "Plan de trabajo — Operia" },
      { name: "description", content: "Plan diario de trabajo: productos, servicios y citas, ordenados por hora." },
    ],
  }),
  component: Produccion,
});

const typeIcon: Record<OrderType, any> = {
  producto: Package, servicio: Wrench, cita: CalendarClock, personalizado: Sparkles,
};

function Produccion() {
  const orders = useOperia((s) => s.orders);
  const [day, setDay] = useState(todayStr());

  const dayOrders = orders
    .filter((o) => o.fechaEntrega === day && o.estado !== "cancelado" && o.estado !== "entregado")
    .sort((a, b) => (a.horaEntrega || "99:99").localeCompare(b.horaEntrega || "99:99"));

  const grouped = useMemo(() => {
    const g: Record<OrderType, typeof dayOrders> = { producto: [], servicio: [], cita: [], personalizado: [] };
    dayOrders.forEach((o) => g[o.tipo].push(o));
    return g;
  }, [dayOrders]);

  return (
    <AppShell>
      <PageHeader
        title="Plan de trabajo"
        subtitle="Tu día completo, organizado por tipo y hora."
        actions={
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Día:</label>
            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-full w-44" />
          </div>
        }
      />

      <Card className="p-5 rounded-3xl mb-5">
        <h3 className="font-display text-lg mb-3">Prioridad por hora</h3>
        {dayOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin trabajo programado para este día.</p>
        ) : (
          <ol className="space-y-2">
            {dayOrders.map((o) => {
              const Icon = typeIcon[o.tipo];
              return (
                <li key={o.id} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/50">
                  <div className="text-lg font-display w-16 shrink-0">{o.horaEntrega || "—"}</div>
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{o.cliente || "Sin nombre"}</div>
                    <div className="text-sm text-muted-foreground truncate">{o.descripcion}</div>
                  </div>
                  {o.detalles && (
                    <div className="hidden md:block text-xs text-muted-foreground italic max-w-[40%] truncate">"{o.detalles}"</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(grouped) as OrderType[]).map((t) => {
          const Icon = typeIcon[t];
          const list = grouped[t];
          return (
            <Card key={t} className="p-4 rounded-3xl">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" />
                <h4 className="font-display">{typeLabels[t]}</h4>
                <span className="text-xs text-muted-foreground">· {list.length}</span>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin {typeLabels[t].toLowerCase()} hoy.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {list.map((o) => (
                    <li key={o.id} className="truncate">
                      <span className="text-muted-foreground">{o.horaEntrega || "—"}</span> · {o.descripcion}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
