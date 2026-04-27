import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOperia, todayStr, type Order } from "@/lib/operia-store";
import { money, buildPaymentMessage } from "@/lib/ui-store";
import { Copy, AlertTriangle, AlertOctagon, Info, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/riesgos")({
  head: () => ({
    meta: [
      { title: "Resolver ahora — Operia" },
      { name: "description", content: "Cosas que pueden hacerte perder dinero hoy. Resuélvelas ahora." },
    ],
  }),
  component: Riesgos,
});

interface Risk {
  order: Order;
  severity: "alto" | "medio" | "bajo";
  reason: string;
  impact: string;
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
    const n = (o.cliente || "").trim().split(/\s+/)[0] || "";

    if (!o.fechaEntrega)
      out.push(mk(o, "alto", "Sin fecha de entrega",
        "Sin fecha no puedes planear ni cumplir.",
        "Pedir fecha al cliente",
        `Hola${n ? " " + n : ""}, para agendar tu pedido, ¿me confirmas la fecha?`));
    if (!o.descripcion)
      out.push(mk(o, "alto", "Descripción no clara",
        "Puedes entregar algo distinto a lo que pidió el cliente.",
        "Pedir detalles",
        `Hola${n ? " " + n : ""}, ¿me puedes describir con más detalle lo que necesitas?`));
    if (isToday && !o.horaEntrega)
      out.push(mk(o, "alto", "Sin hora y es para hoy",
        "Puede retrasar la entrega.",
        "Pedir hora urgente",
        `Hola${n ? " " + n : ""}, para tu pedido de hoy necesito la hora exacta, ¿me la confirmas?`));
    if (o.pago === "pendiente" && big)
      out.push(mk(o, "alto", `Pedido grande sin pago (${money(o.precio)})`,
        "Riesgo de no cobrar.",
        "Solicitar anticipo",
        buildPaymentMessage(o)));

    if (o.fechaEntrega && o.horaEntrega && !o.direccion && o.tipo !== "cita")
      out.push(mk(o, "medio", "Falta dirección",
        "Puede retrasar la entrega.",
        "Pedir ubicación",
        `Hola${n ? " " + n : ""}, ¿me confirmas la dirección de entrega?`));
    if (!o.telefono)
      out.push(mk(o, "medio", "Sin teléfono",
        "No podrás coordinar ni avisar al cliente.",
        "Pedir contacto",
        `Hola, ¿me compartes tu número de teléfono para coordinar?`));
    if (o.pago === "pendiente" && !big)
      out.push(mk(o, "medio", "Pago pendiente",
        "Cobro sin asegurar.",
        "Coordinar el pago",
        buildPaymentMessage(o)));

    if (!o.notas)
      out.push(mk(o, "bajo", "Sin notas internas",
        "Tu equipo no tiene contexto.",
        "Agregar contexto interno",
        ""));
    if (!o.precio)
      out.push(mk(o, "bajo", "Precio no confirmado",
        "No se podrá cobrar correctamente.",
        "Definir precio",
        `Hola${n ? " " + n : ""}, te confirmo que el costo es de $___.`));
  }
  return out;
}

function mk(order: Order, severity: Risk["severity"], reason: string, impact: string, action: string, message: string): Risk {
  return { order, severity, reason, impact, action, message };
}

function Riesgos() {
  const orders = useOperia((s) => s.orders);
  const updateOrder = useOperia((s) => s.updateOrder);
  const allRisks = detectRisks(orders);
  // Money at risk = sum of unique orders with at least one risk
  const uniqueOrders = new Map<string, Order>();
  for (const r of allRisks) uniqueOrders.set(r.order.id, r.order);
  const totalRiesgo = Array.from(uniqueOrders.values()).reduce((s, o) => s + (o.precio || 0), 0);

  const groups: Record<Risk["severity"], Risk[]> = { alto: [], medio: [], bajo: [] };
  allRisks.forEach((r) => groups[r.severity].push(r));

  const total = allRisks.length;
  const headline =
    total === 0
      ? "Todo en orden"
      : `${total} ${total === 1 ? "cosa" : "cosas"} pueden costarte dinero hoy`;

  return (
    <AppShell>
      <PageHeader
        title={headline}
        subtitle="Resuelve cada problema con una acción concreta. Copia el mensaje y envíalo por WhatsApp."
      />

      {total > 0 && (
        <Card className="mb-8 p-4 md:p-5 rounded-xl border-danger/20 bg-danger/5">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Urgencia alta" value={groups.alto.length} tone="danger" />
            <Stat label="Urgencia media" value={groups.medio.length} tone="warning" />
            <Stat label="Dinero en riesgo" value={money(totalRiesgo)} tone="default" />
          </div>
        </Card>
      )}

      <Group title="Resolver ya" risks={groups.alto} icon={AlertOctagon} accent="text-danger" border="border-danger/25" onResolve={updateOrder} />
      <Group title="Resolver hoy" risks={groups.medio} icon={AlertTriangle} accent="text-foreground" border="border-warning/30" onResolve={updateOrder} />
      <Group title="Mejoras opcionales" risks={groups.bajo} icon={Info} accent="text-muted-foreground" border="border-border" onResolve={updateOrder} />

      {total === 0 && (
        <Card className="p-12 text-center text-muted-foreground rounded-xl border-dashed bg-secondary/30">
          <div className="text-[14px] font-medium text-foreground/80">Todo en orden</div>
          <div className="text-[12.5px] mt-1">Sin riesgos detectados en este momento.</div>
        </Card>
      )}
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: "danger" | "warning" | "default" }) {
  const color =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-foreground/80" : "text-foreground";
  return (
    <div>
      <div className={`text-[22px] md:text-[26px] font-semibold tabular-nums tracking-tight ${color}`}>{value}</div>
      <div className="text-[11.5px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Group({
  title,
  risks,
  icon: Icon,
  accent,
  border,
  onResolve,
}: {
  title: string;
  risks: Risk[];
  icon: any;
  accent: string;
  border: string;
  onResolve: (id: string, patch: Partial<Order>) => void;
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
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[15px]">{r.order.cliente || "Sin nombre"}</span>
                  {r.order.precio > 0 && (
                    <span className="text-[12px] text-muted-foreground tabular-nums">· {money(r.order.precio)}</span>
                  )}
                </div>
                <div className={`text-[13.5px] font-medium mt-1 ${accent}`}>{r.reason}</div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5">Impacto: {r.impact}</div>
                <div className="text-[12px] text-foreground/70 mt-1.5">→ {r.action}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0 md:justify-end md:max-w-[280px]">
                {r.message && (
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(r.message);
                      toast.success("Mensaje copiado");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Pedir ahora
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/pedidos/$id" params={{ id: r.order.id }}>
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                {/* "Mark resolved" — clears underlying field minimally is not possible without more context;
                    for items related to confirmation, allow quick confirm */}
                {r.order.estado === "nuevo" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onResolve(r.order.id, { estado: "confirmado" });
                      toast.success("Pedido confirmado");
                    }}
                  >
                    <Check className="h-3.5 w-3.5" /> Confirmar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
