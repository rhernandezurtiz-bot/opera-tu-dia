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
      { name: "description", content: "Detector de pedidos incompletos o riesgosos antes de que sean un problema." },
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
    const big = /\b(\d{2,})\s*personas?\b/.test(o.tamano);

    if (!o.fechaEntrega) out.push(mk(o, "alto", "Sin fecha de entrega", "Confirma la fecha con el cliente.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Para agendar tu pedido, ¿me confirmas la fecha de entrega? 🙏`));
    if (!o.producto) out.push(mk(o, "alto", "Producto no definido", "Confirma qué producto desea.",
      `Hola${o.cliente ? " " + o.cliente : ""}! ¿Me confirmas qué producto te gustaría pedir? 🍰`));
    if (isToday && !o.horaEntrega) out.push(mk(o, "alto", "Sin hora y es para hoy", "Pide la hora urgente.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Para tu pedido de hoy necesito la hora exacta de entrega, ¿me la confirmas? ⏰`));
    if (o.pago === "pendiente" && big) out.push(mk(o, "alto", "Pedido grande sin anticipo", "Solicita el anticipo.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Para confirmar tu pedido grande necesitamos el anticipo. ¿Te paso los datos? 💳`));

    if (o.fechaEntrega && o.horaEntrega && !o.direccion) out.push(mk(o, "medio", "Falta dirección", "Pide la dirección.",
      `Hola${o.cliente ? " " + o.cliente : ""}! ¿Me confirmas la dirección de entrega para tu pedido? 📍`));
    if (!o.personalizacion && (o.producto || "").toLowerCase().includes("pastel")) out.push(mk(o, "medio", "Falta personalización", "Pregunta si lleva texto/diseño.",
      `Hola${o.cliente ? " " + o.cliente : ""}! ¿Quieres algún texto o diseño especial para tu pastel? ✨`));
    if (!o.checklist.diseno && (o.producto || "").toLowerCase().includes("pastel")) out.push(mk(o, "medio", "Diseño sin confirmar", "Confirma el diseño.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Te paso una propuesta de diseño para que la confirmes 🎨`));
    if (!o.telefono) out.push(mk(o, "medio", "Falta teléfono", "Pide el número de contacto.",
      `Hola! ¿Me compartes tu número de teléfono para coordinar la entrega? 📱`));

    if (!o.notas) out.push(mk(o, "bajo", "Notas internas vacías", "Agrega contexto interno si es útil.", ""));
    if (!o.precio) out.push(mk(o, "bajo", "Precio no confirmado", "Define el precio del pedido.",
      `Hola${o.cliente ? " " + o.cliente : ""}! Te confirmo que el costo de tu pedido es de $___ 💛`));
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
      <PageHeader title="Riesgos" subtitle="Detecta pedidos incompletos antes de que sean un problema." />

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
