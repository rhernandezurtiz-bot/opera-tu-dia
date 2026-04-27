import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, PageHeader, RiskBadge, StatusBadge, UrgencyChip } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  useOperia,
  checklistByType,
  typeLabels,
  clientKey,
  getClientStats,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/operia-store";
import {
  buildMissingMessage,
  buildPaymentReminder,
  buildDayBeforeReminder,
  buildHoursBeforeReminder,
  money,
} from "@/lib/ui-store";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  PackageCheck,
  Star,
  Wallet,
  Bell,
  Save,
  ArrowRight,
  History,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Orden ${params.id} — Operia` },
      { name: "description", content: "Detalle operativo de la orden con checklist." },
    ],
  }),
  component: Detalle,
});

function Detalle() {
  const { id } = Route.useParams();
  const order = useOperia((s) => s.orders.find((o) => o.id === id));
  const allOrders = useOperia((s) => s.orders);
  const clientNotes = useOperia((s) => s.clientNotes);
  const setClientNote = useOperia((s) => s.setClientNote);
  const toggleChecklist = useOperia((s) => s.toggleChecklist);
  const updateOrder = useOperia((s) => s.updateOrder);
  const removeOrder = useOperia((s) => s.removeOrder);
  const navigate = useNavigate();

  // Internal notes drafts
  const [orderNotes, setOrderNotes] = useState("");
  const [clientNoteDraft, setClientNoteDraft] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    if (order) {
      setOrderNotes(order.notas || "");
      setPrecio(order.precio ? String(order.precio) : "");
    }
  }, [order?.id]);

  const cKey = order ? clientKey(order.cliente, order.telefono) : "";
  useEffect(() => {
    setClientNoteDraft(cKey ? clientNotes[cKey] || "" : "");
  }, [cKey, clientNotes]);

  if (!order) {
    return <AppShell><Card className="p-10 text-center rounded-xl">Orden no encontrada. <Link to="/pedidos" className="underline">Volver</Link></Card></AppShell>;
  }

  const items = checklistByType[order.tipo];
  const done = items.filter((it) => order.checklist[it.key]).length;
  const pct = Math.round((done / items.length) * 100);

  // Historial del cliente: excluir la orden actual
  const stats = cKey ? getClientStats(allOrders.filter((o) => o.id !== order.id), cKey) : null;

  const copiar = (text: string, label = "Mensaje copiado") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const copiarResumen = () => {
    const partes = [
      `Orden de ${order.cliente || "Cliente"}:`,
      `${typeLabels[order.tipo].toLowerCase()} — ${order.descripcion || "descripción pendiente"}`,
      `fecha ${order.fechaEntrega || "pendiente"}${order.horaEntrega ? ` ${order.horaEntrega}` : ""}`,
      order.direccion ? `ubicación: ${order.direccion}` : "",
      order.detalles ? `detalles: ${order.detalles}` : "",
      `pago: ${order.pago}`,
    ].filter(Boolean);
    copiar(partes.join(", ") + ".", "Resumen copiado");
  };

  return (
    <AppShell>
      <Link to="/pedidos" className="inline-flex items-center text-sm text-muted-foreground mb-3 hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a órdenes
      </Link>

      <PageHeader
        title={order.cliente || "Cliente sin nombre"}
        subtitle={`${typeLabels[order.tipo]} · ${order.descripcion || "Descripción pendiente"}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyChip fecha={order.fechaEntrega} hora={order.horaEntrega} />
            <StatusBadge status={order.estado} />
            <RiskBadge level={order.riesgo} />
          </div>
        }
      />

      {/* Pipeline 1-clic */}
      <Card className="p-3 rounded-2xl mb-5 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground px-2">Avanzar pedido:</span>
        <PipelineButton
          label="Confirmado"
          icon={CheckCircle2}
          active={order.estado === "confirmado"}
          done={["en_proceso", "listo", "entregado"].includes(order.estado)}
          onClick={() => { updateOrder(order.id, { estado: "confirmado" }); toast.success("Confirmado"); }}
        />
        <PipelineButton
          label="En proceso"
          icon={PlayCircle}
          active={order.estado === "en_proceso"}
          done={["listo", "entregado"].includes(order.estado)}
          onClick={() => { updateOrder(order.id, { estado: "en_proceso" }); toast.success("En proceso"); }}
        />
        <PipelineButton
          label="Listo"
          icon={PackageCheck}
          active={order.estado === "listo"}
          done={order.estado === "entregado"}
          onClick={() => { updateOrder(order.id, { estado: "listo" }); toast.success("Listo"); }}
        />
        <PipelineButton
          label="Entregado"
          icon={Check}
          active={order.estado === "entregado"}
          done={false}
          onClick={() => { updateOrder(order.id, { estado: "entregado" }); toast.success("Entregado"); }}
        />
        <Button size="sm" variant="ghost" className="rounded-full ml-auto" onClick={copiarResumen}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar resumen
        </Button>
      </Card>

      {/* Cliente recurrente — historial rápido */}
      {stats && stats.totalPedidos > 0 && (
        <Card className="p-4 rounded-2xl mb-5 border-success/25 bg-success/5">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="h-9 w-9 rounded-lg bg-success/15 text-success grid place-items-center shrink-0">
              {stats.esRecurrente ? <Star className="h-4 w-4" /> : <History className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">
                {stats.esRecurrente ? "Cliente recurrente" : "Cliente con historial"} — {stats.totalPedidos} {stats.totalPedidos === 1 ? "pedido anterior" : "pedidos anteriores"}
                {stats.totalGastado > 0 && <> · {money(stats.totalGastado)} gastados</>}
              </div>
              {stats.comunes.length > 0 && (
                <div className="text-[12.5px] text-muted-foreground mt-0.5">
                  Suele pedir: {stats.comunes.join(" · ")}
                </div>
              )}
              {stats.ultimaFecha && (
                <div className="text-[11.5px] text-muted-foreground mt-0.5">
                  Último pedido: {stats.ultimaFecha}
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" className="rounded-full" asChild>
              <Link to="/clientes/$key" params={{ key: cKey }}>
                Ver perfil <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {order.faltantes.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-warning/15 border border-warning/30">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium">Faltan datos para este pedido</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {order.faltantes.map((f) => (
                  <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-card border border-warning/40">{f}</span>
                ))}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-full mt-2"
            onClick={() => copiar(buildMissingMessage(order.cliente, order.faltantes))}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje para el cliente
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Pago */}
          <Card className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display text-lg">Pago</h3>
              <PaymentBadge status={order.pago} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11.5px] text-muted-foreground font-medium">Monto</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="rounded-lg h-9"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-lg h-9"
                    onClick={() => { updateOrder(order.id, { precio: Number(precio) || 0 }); toast.success("Monto actualizado"); }}
                    disabled={(Number(precio) || 0) === order.precio}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={order.pago === "anticipo" ? "default" : "secondary"}
                  className="rounded-full"
                  onClick={() => { updateOrder(order.id, { pago: "anticipo" }); toast.success("Anticipo recibido"); }}
                >
                  Marcar anticipo recibido
                </Button>
                <Button
                  size="sm"
                  variant={order.pago === "pagado" ? "default" : "secondary"}
                  className="rounded-full"
                  onClick={() => { updateOrder(order.id, { pago: "pagado" }); toast.success("Pago completo"); }}
                >
                  Marcar como pagado
                </Button>
              </div>
            </div>

            {order.pago !== "pagado" && (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border">
                <div className="text-[12.5px] text-muted-foreground mb-2">Mensaje de recordatorio:</div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-2">
                  {buildPaymentReminder(order)}
                </p>
                <Button size="sm" className="rounded-full" onClick={() => copiar(buildPaymentReminder(order))}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Recordar pago
                </Button>
              </div>
            )}
          </Card>

          {/* Recordatorios */}
          <Card className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display text-lg">Recordatorios</h3>
            </div>
            <p className="text-[12.5px] text-muted-foreground mb-3">
              Mensajes listos para copiar y enviar manualmente al cliente.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <ReminderCard
                title="1 día antes"
                hint="Confirma el pedido"
                body={buildDayBeforeReminder(order)}
                onCopy={copiar}
              />
              <ReminderCard
                title="2 horas antes"
                hint="Confirma dirección y llegada"
                body={buildHoursBeforeReminder(order)}
                onCopy={copiar}
              />
            </div>
          </Card>

          {/* Información */}
          <Card className="p-5 rounded-xl">
            <h3 className="font-display text-lg mb-2">Información de la orden</h3>
            <Info label="Tipo" value={typeLabels[order.tipo]} />
            <Info label="Teléfono" value={order.telefono} />
            <Info label="Cantidad" value={order.cantidad} />
            <Info label="Fecha" value={order.fechaEntrega} />
            <Info label="Hora" value={order.horaEntrega} />
            <Info label="Ubicación" value={order.direccion} />
            <Info label="Detalles" value={order.detalles} />
            <Info label="Precio" value={order.precio ? money(order.precio) : ""} />
            {order.mensajeOriginal && (
              <div className="pt-3 border-t border-border mt-2">
                <div className="text-xs text-muted-foreground mb-1">Mensaje original</div>
                <div className="text-sm bg-secondary/50 p-3 rounded-xl whitespace-pre-wrap">{order.mensajeOriginal}</div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4">
              <Select value={order.estado} onValueChange={(v) => { updateOrder(order.id, { estado: v as OrderStatus }); toast.success("Estado actualizado"); }}>
                <SelectTrigger className="w-48 rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                  <SelectItem value="listo">Listo</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" className="rounded-full text-danger hover:text-danger ml-auto" onClick={() => { removeOrder(order.id); toast.success("Orden eliminada"); navigate({ to: "/pedidos" }); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            </div>
          </Card>

          {/* Notas internas */}
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-5 rounded-xl">
              <h3 className="font-display text-base mb-1">Notas del pedido</h3>
              <p className="text-[11.5px] text-muted-foreground mb-2">Solo internas. Ej: "Confirmar antes de producir".</p>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Notas internas de este pedido…"
                className="rounded-xl min-h-24 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => { updateOrder(order.id, { notas: orderNotes.trim() }); toast.success("Notas guardadas"); }}
                  disabled={orderNotes === (order.notas || "")}
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Guardar
                </Button>
              </div>
            </Card>

            <Card className="p-5 rounded-xl">
              <h3 className="font-display text-base mb-1">Notas del cliente</h3>
              <p className="text-[11.5px] text-muted-foreground mb-2">Visibles en todos sus pedidos. Ej: "Cliente VIP".</p>
              <Textarea
                value={clientNoteDraft}
                onChange={(e) => setClientNoteDraft(e.target.value)}
                placeholder="Notas internas del cliente…"
                className="rounded-xl min-h-24 resize-none"
                disabled={!cKey}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={!cKey || clientNoteDraft === (clientNotes[cKey] || "")}
                  onClick={() => { setClientNote(cKey, clientNoteDraft.trim()); toast.success("Notas del cliente guardadas"); }}
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Guardar
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-5 rounded-xl h-fit">
          <h3 className="font-display text-lg mb-1">Checklist</h3>
          <div className="text-xs text-muted-foreground mb-2">
            {typeLabels[order.tipo]} · {done} de {items.length}
          </div>
          <Progress value={pct} className="h-2 mb-4" />
          <div className="space-y-2">
            {items.map((it) => (
              <label key={it.key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer">
                <Checkbox checked={!!order.checklist[it.key]} onCheckedChange={() => toggleChecklist(order.id, it.key)} />
                <span className={`text-sm ${order.checklist[it.key] ? "line-through text-muted-foreground" : ""}`}>{it.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function PipelineButton({
  label,
  icon: Icon,
  active,
  done,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  const cls = active
    ? "bg-foreground text-background"
    : done
      ? "bg-success/10 text-success/90 border-success/20"
      : "bg-secondary text-foreground/70 border-border hover:bg-secondary/80";
  return (
    <Button size="sm" onClick={onClick} className={`rounded-full border ${cls}`} variant="ghost">
      <Icon className="h-3.5 w-3.5 mr-1" /> {label}
    </Button>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    pendiente: { label: "Sin anticipo", cls: "bg-danger/8 text-danger/90 border-danger/25" },
    anticipo: { label: "Anticipo recibido", cls: "bg-warning/12 text-foreground/80 border-warning/30" },
    pagado: { label: "Pagado completo", cls: "bg-success/10 text-success/90 border-success/20" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-[22px] rounded-full text-[11px] font-medium border tabular-nums ${m.cls}`}>
      {m.label}
    </span>
  );
}

function ReminderCard({
  title,
  hint,
  body,
  onCopy,
}: {
  title: string;
  hint: string;
  body: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="p-3 rounded-2xl border border-border bg-secondary/30">
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11.5px] text-muted-foreground mb-2">{hint}</div>
      <p className="text-[13px] text-foreground/90 whitespace-pre-wrap mb-2">{body}</p>
      <Button size="sm" variant="ghost" className="rounded-full h-8" onClick={() => onCopy(body)}>
        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
      </Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{value || <em className="text-muted-foreground">— pendiente —</em>}</span>
    </div>
  );
}
