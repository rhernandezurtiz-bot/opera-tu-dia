import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useOperia, todayStr } from "@/lib/operia-store";
import { ChefHat } from "lucide-react";

export const Route = createFileRoute("/produccion")({
  head: () => ({
    meta: [
      { title: "Producción — Operia" },
      { name: "description", content: "Plan de producción del día con resumen, prioridades y checklist." },
    ],
  }),
  component: Produccion,
});

function Produccion() {
  const orders = useOperia((s) => s.orders);
  const [day, setDay] = useState(todayStr());
  const [tasks, setTasks] = useState<Record<string, boolean>>({});

  const dayOrders = orders
    .filter((o) => o.fechaEntrega === day && o.estado !== "cancelado" && o.estado !== "entregado")
    .sort((a, b) => (a.horaEntrega || "99:99").localeCompare(b.horaEntrega || "99:99"));

  const resumen = useMemo(() => {
    const map = new Map<string, number>();
    dayOrders.forEach((o) => {
      const key = o.producto || "Pedido sin producto";
      const qty = parseInt(o.cantidad) || 1;
      map.set(key, (map.get(key) || 0) + qty);
    });
    return Array.from(map.entries());
  }, [dayOrders]);

  const baseTasks = [
    "Preparar bases",
    "Preparar rellenos",
    "Decorar pedidos",
    "Empacar pedidos",
    "Revisar entregas",
  ];

  return (
    <AppShell>
      <PageHeader
        title="Producción diaria"
        subtitle="Tu plan de cocina, organizado por hora de entrega."
        actions={
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Día:</label>
            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-full w-44" />
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 rounded-3xl">
          <h3 className="font-display text-lg mb-3">Resumen de producción</h3>
          {resumen.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pedidos para este día.</p>
          ) : (
            <ul className="space-y-2">
              {resumen.map(([prod, qty]) => (
                <li key={prod} className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
                  <span>{prod}</span>
                  <span className="font-medium">×{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 rounded-3xl lg:col-span-2">
          <h3 className="font-display text-lg mb-3">Prioridad por hora</h3>
          {dayOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pedidos para producir hoy.</p>
          ) : (
            <ol className="space-y-2">
              {dayOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/50">
                  <div className="text-lg font-display w-16 shrink-0">{o.horaEntrega || "—"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{o.cliente || "Sin nombre"}</div>
                    <div className="text-sm text-muted-foreground truncate">{o.producto} {o.tamano && `· ${o.tamano}`}</div>
                  </div>
                  {o.personalizacion && (
                    <div className="hidden md:block text-xs text-muted-foreground italic max-w-[40%] truncate">"{o.personalizacion}"</div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5 rounded-3xl lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="h-5 w-5" />
            <h3 className="font-display text-lg">Checklist de producción</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            {baseTasks.map((t) => {
              const key = `${day}-${t}`;
              return (
                <label key={t} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 cursor-pointer">
                  <Checkbox checked={!!tasks[key]} onCheckedChange={() => setTasks((s) => ({ ...s, [key]: !s[key] }))} />
                  <span className={`text-sm ${tasks[key] ? "line-through text-muted-foreground" : ""}`}>{t}</span>
                </label>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
