import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOperia, todayStr, type Order } from "@/lib/operia-store";
import { Copy, AlertTriangle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/riesgos")({
  head: () => ({
    meta: [
      { title: "Riesgos — Operia" },
      { name: "description", content: "Pedidos incompletos o riesgosos. Resuélvelos antes de que sean un problema." },
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
      `Hola${o.cliente ? " " + o.cliente : ""}, para agendar tu pedido, ¿me confirmas la fecha?`));
    if (!o.descripcion) out.push(mk(o, "alto", "Descripción no clara", "Confirma qué necesita el cliente.",
      `Hola${o.cliente ? " " + o.cliente : ""}, ¿me puedes describir con más detalle lo que necesitas?`));
    if (isToday && !o.horaEntrega) out.push(mk(o, "alto", "Sin hora y es para hoy", "Pide la hora urgente.",
      `Hola${o.cliente ? " " + o.cliente : ""}, para tu pedido de hoy necesito la hora exacta, ¿me la confirmas?`));
    if (o.pago === "pendiente" && big) out.push(mk(o, "alto", "Pedido grande sin pago", "Solicita anticipo.",
      `Hola${o.cliente ? " " + o.cliente : ""}, para confirmar tu pedido necesitamos un anticipo. ¿Te paso los datos?`));

    if (o.fechaEntrega && o.horaEntrega && !o.direccion && o.tipo !== "cita") out.push(mk(o, "medio", "Falta dirección", "Pide la ubicación.",
      `Hola${o.cliente ? " " + o.cliente : ""}, ¿me confirmas la dirección de entrega?`));
    if (!o.telefono) out.push(mk(o, "medio", "Falta teléfono", "Pide el número de contacto.",
      `Hola, ¿me compartes tu número de teléfono para coordinar?`));
    if (o.pago === "pendiente" && !big) out.push(mk(o, "medio", "Pago pendiente", "Coordina el pago.",
      `Hola${o.cliente ? " " + o.cliente : ""}, te paso los datos para procesar tu pago.`));

    if (!o.notas) out.push(mk(o, "bajo", "Notas internas vacías", "Agrega contexto interno si es útil.", ""));
    if (!o.precio) out.push(mk(o, "bajo", "Precio no confirmado", "Define el precio del pedido.",
      `Hola${o.cliente ? " " + o.cliente : ""}, te confirmo que el costo es de $___.`));
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
      <PageHeader
        title="Resolver ahora"
        subtitle="Pedidos incompletos o riesgosos. Atiéndelos antes de que se conviertan en un problema."
      />

      <Group title="Urgencia alta" risks={groups.alto} icon={AlertOctagon} accent="text-danger" border="border-danger/25" />
      <Group title="Urgencia media" risks={groups.medio} icon={AlertTriangle} accent="text-foreground" border="border-warning/30" />
      <Group title="Urgencia baja" risks={groups.bajo} icon={Info} accent="text-muted-foreground" border="border-border" />

      {risks.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground rounded-xl border-dashed bg-secondary/30">
          <div className="text-[14px] font-medium text-foreground/80">Todo en orden</div>
          <div className="text-[12.5px] mt-1">No detectamos riesgos en este momento.</div>
        </Card>
      )}
    </AppShell>
  );
}

function Group({
  title,
  risks,
  icon: Icon,
  accent,
  border,
}: {
  title: string;
  risks: Risk[];
  icon: any;
  accent: string;
  border: string;
}) {
  if (risks.length === 0) return null;
  return (
    <section className="mb-8">
      <div className={`flex items-center gap-2 mb-4 ${accent}`}>
        <Icon className="h-4 w-4" />
        <h2 className="text-[17px] font-semibold tracking-tight">
          {title}
          <span className="text-muted-foreground text-[13px] font-normal ml-2">· {risks.length}</span>
        </h2>
      </div>
      <div className="space-y-2">
        {risks.map((r, i) => (
          <Card key={i} className={`p-4 md:p-5 rounded-xl border ${border} hover:border-foreground/20 transition-colors`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-[15px]">{r.order.cliente || "Sin nombre"}</div>
                <div className={`text-[13.5px] mt-0.5 ${accent}`}>{r.reason}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">→ {r.action}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {r.message && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(r.message);
                      toast.success("Mensaje copiado");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copiar mensaje
                  </Button>
                )}
                <Button size="sm" asChild>
                  <Link to="/pedidos/$id" params={{ id: r.order.id }}>
                    Resolver <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
