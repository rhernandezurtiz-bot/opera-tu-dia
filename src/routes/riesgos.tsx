import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOperia, todayStr, type Order } from "@/lib/operia-store";
import { Copy, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/riesgos")({
  head: () => ({
    meta: [
      { title: "Riesgos — Operia" },
      { name: "description", content: "Detector de órdenes incompletas o riesgosas antes de que sean un problema." },
    ],
  }),
  component: Riesgos,
});

interface Risk {
  order: Order;
  severity: "alto" | "medio" | "bajo";
  reason: string;
  action: string;
  message: string;
}

function detectRisks(orders: Order[]): Risk[] {
  const today = todayStr();
  const out: Risk[] = [];
  for (const o of orders) {
    if (o.estado === "entregado" || o.estado === "cancelado") continue;
    const isToday = o.fechaEntrega === today;
    const big = (o.precio || 0) >= 2000;

    if (!o.fechaEntrega) out.push(mk(o, "alto", "Sin fecha", "Confirma la fecha con el cliente.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Para agendar tu orden, ¿me confirmas la fecha? 🙏`));
    if (!o.descripcion) out.push(mk(o, "alto", "Descripción no clara", "Confirma qué necesita el cliente.",
      `Hola${o.cliente ? " " + o.cliente : ""}! ¿Me puedes describir con más detalle lo que necesitas? 🙂`));
    if (isToday && !o.horaEntrega) out.push(mk(o, "alto", "Sin hora y es para hoy", "Pide la hora urgente.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Para tu orden de hoy necesito la hora exacta, ¿me la confirmas? ⏰`));
    if (o.pago === "pendiente" && big) out.push(mk(o, "alto", "Orden grande sin pago", "Solicita anticipo.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Para confirmar tu orden necesitamos un anticipo. ¿Te paso los datos? 💳`));

    if (o.fechaEntrega && o.horaEntrega && !o.direccion && o.tipo !== "cita") out.push(mk(o, "medio", "Falta dirección", "Pide la ubicación.",
      `Hola${o.cliente ? " " + o.cliente : ""}! ¿Me confirmas la dirección de entrega? 📍`));
    if (!o.telefono) out.push(mk(o, "medio", "Falta teléfono", "Pide el número de contacto.",
      `Hola! ¿Me compartes tu número de teléfono para coordinar? 📱`));
    if (o.pago === "pendiente" && !big) out.push(mk(o, "medio", "Pago pendiente", "Coordina el pago.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Te paso los datos para procesar tu pago 💛`));

    if (!o.notas) out.push(mk(o, "bajo", "Notas internas vacías", "Agrega contexto interno si es útil.", ""));
    if (!o.precio) out.push(mk(o, "bajo", "Precio no confirmado", "Define el precio de la orden.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Te confirmo que el costo es de $___ 💛`));
  }
  return out;
}

function mk(order: Order, severity: Risk["severity"], reason: string, action: string, message: string): Risk {
  return { order, severity, reason, action, message };
}

function Riesgos() {
  const orders = useOperia((s) => s.orders);
  const risks = detectRisks(orders);
  const groups: Record<Risk["severity"], Risk[]> = { alto: [], medio: [], bajo: [] };
  risks.forEach((r) => groups[r.severity].push(r));

  return (
    <AppShell>
      <PageHeader title="Riesgos" subtitle="Detecta órdenes incompletas antes de que sean un problema." />

      <Group title="Alto" risks={groups.alto} icon={AlertOctagon} tone="bg-danger/10 border-danger/30 text-danger" />
      <Group title="Medio" risks={groups.medio} icon={AlertTriangle} tone="bg-warning/15 border-warning/40 text-foreground" />
      <Group title="Bajo" risks={groups.bajo} icon={Info} tone="bg-secondary border-border text-muted-foreground" />

      {risks.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground rounded-3xl">¡Todo en orden! No detectamos riesgos. ✨</Card>
      )}
    </AppShell>
  );
}

function Group({ title, risks, icon: Icon, tone }: { title: string; risks: Risk[]; icon: any; tone: string }) {
  if (risks.length === 0) return null;
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        <h2 className="font-display text-lg">{title} <span className="text-muted-foreground text-sm">· {risks.length}</span></h2>
      </div>
      <div className="space-y-2">
        {risks.map((r, i) => (
          <Card key={i} className={`p-4 rounded-2xl border ${tone}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0">
                <Link to="/pedidos/$id" params={{ id: r.order.id }} className="font-medium hover:underline">
                  {r.order.cliente || "Sin nombre"}
                </Link>
                <div className="text-sm text-foreground/80">{r.reason}</div>
                <div className="text-xs text-muted-foreground mt-0.5">→ {r.action}</div>
              </div>
              {r.message && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full shrink-0"
                  onClick={() => { navigator.clipboard.writeText(r.message); toast.success("Mensaje copiado"); }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje para cliente
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
