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
  type PaymentProvider,
} from "@/lib/operia-store";
import {
  buildMissingMessage,
  buildPaymentReminder,
  buildAutoPaymentMessage,
  buildAutoPaymentReminder,
  isReadyForAutoPayment,
  buildDayBeforeReminder,
  buildHoursBeforeReminder,
  money,
  nextAction,
} from "@/lib/ui-store";
import { useCatalog, validateOrder, buildOutOfCatalogMessage, buildAlternativeOffer } from "@/lib/catalog-store";
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
  Sparkles,
  Send,
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
  const generatePaymentLink = useOperia((s) => s.generatePaymentLink);
  const markPaymentPaid = useOperia((s) => s.markPaymentPaid);
  const markPaymentFailed = useOperia((s) => s.markPaymentFailed);
  const paymentsCfg = useOperia((s) => s.negocio.payments);
  const removeOrder = useOperia((s) => s.removeOrder);
  const catalog = useCatalog((s) => s.items);
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

  // Validación contra catálogo (incluye capacidad diaria con resto de pedidos)
  const validation = validateOrder(order, catalog, allOrders);
  const fueraCatalogo = validation.status === "fuera_catalogo";
  const blockPayment = validation.blockPayment;

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

      {/* Próxima acción sugerida */}
      <NextActionPanel order={order} onCopy={copiar} onAdvance={(estado) => { updateOrder(order.id, { estado }); toast.success("Estado actualizado"); }} />

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
          {/* Validación contra catálogo */}
          <CatalogValidationBlock
            validation={validation}
            onCopy={(t: string) => copiar(t)}
            onWhatsApp={(t: string) => {
              if (!order.telefono) { toast.error("Falta teléfono del cliente"); return; }
              window.open(`https://wa.me/${order.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(t)}`, "_blank", "noopener,noreferrer");
            }}
            onAlternative={() => buildAlternativeOffer(catalog, order.tipo)}
          />

          {/* Cobro del pedido */}
          <Card className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display text-lg">Cobro del pedido</h3>
              <CobroBadge status={order.pago} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11.5px] text-muted-foreground font-medium">Monto del pedido ({paymentsCfg.moneda})</label>
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
              <div>
                <label className="text-[11.5px] text-muted-foreground font-medium">Proveedor</label>
                <Select
                  value={order.paymentProvider ?? (paymentsCfg.proveedorPrincipal === "stripe" ? "stripe" : "mercadopago")}
                  onValueChange={(v) => updateOrder(order.id, { paymentProvider: v as PaymentProvider })}
                >
                  <SelectTrigger className="rounded-lg h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {order.pago === "vencido" && (
              <div className="p-3 rounded-2xl bg-danger/10 border border-danger/30 mb-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-danger shrink-0" />
                <div className="text-[13px]">
                  <div className="font-medium text-danger">Pago vencido</div>
                  <div className="text-foreground/80">
                    La fecha de entrega ya pasó y no hay pago registrado. Contacta al cliente cuanto antes.
                  </div>
                </div>
              </div>
            )}

            {order.pago === "pagado" ? (
              <div className="p-3 rounded-2xl bg-success/10 border border-success/30 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-success">Pago recibido</span>
                  {order.precio > 0 && <> · {money(order.precio)} sumados a ingresos del día</>}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border space-y-3">
                {blockPayment && (
                  <div className="p-3 rounded-2xl bg-warning/15 border border-warning/30 text-[13px]">
                    <div className="font-medium mb-0.5">Este pedido necesita ajuste antes de cobrarse.</div>
                    <div className="text-muted-foreground text-[12px]">
                      Resuelve las alertas del catálogo arriba para habilitar el cobro automático.
                    </div>
                  </div>
                )}
                {/* Acciones principales */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={blockPayment}
                    onClick={() => {
                      const provider = order.paymentProvider ?? (paymentsCfg.proveedorPrincipal === "stripe" ? "stripe" : "mercadopago");
                      generatePaymentLink(order.id, provider);
                      toast.success("Link de pago generado");
                    }}
                  >
                    <Wallet className="h-3.5 w-3.5 mr-1" />
                    {order.paymentLink ? "Regenerar link de pago" : "Generar link de pago"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => { markPaymentPaid(order.id); toast.success("Pago marcado como recibido"); }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Marcar como pagado (simulación)
                  </Button>
                  {order.paymentLink && paymentsCfg.modo === "simulacion" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-danger hover:text-danger"
                      onClick={() => { markPaymentFailed(order.id, "Rechazado en simulación"); toast.error("Pago fallido (simulado)"); }}
                    >
                      Simular pago fallido
                    </Button>
                  )}
                </div>

                {/* Auto-envío: cuando se cumplen los criterios + catálogo OK */}
                {!blockPayment && isReadyForAutoPayment(order) && order.telefono && (
                  <div className="p-3 rounded-2xl bg-primary/5 border border-primary/25">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="text-[13px]">
                        <div className="font-medium">Listo para cobrar automáticamente</div>
                        <div className="text-muted-foreground text-[12px]">
                          Fecha, dirección y monto confirmados. Genera el link y envíalo en un click.
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-foreground/85 whitespace-pre-wrap bg-background border border-border rounded-lg p-2.5 mb-2">
                      {buildAutoPaymentMessage(order)}
                    </p>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        const provider = order.paymentProvider ?? (paymentsCfg.proveedorPrincipal === "stripe" ? "stripe" : "mercadopago");
                        const link = order.paymentLink ?? generatePaymentLink(order.id, provider);
                        const msg = buildAutoPaymentMessage({ ...order, paymentLink: link });
                        const url = `https://wa.me/${order.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                        updateOrder(order.id, {
                          pago: "link_enviado",
                          paymentReminderAt: Date.now(),
                          paymentEvents: [
                            ...(order.paymentEvents ?? []),
                            { kind: "mensaje_enviado", at: Date.now(), detail: "Auto-envío por WhatsApp" },
                          ],
                        });
                        toast.success("Mensaje enviado por WhatsApp");
                      }}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> Enviar automático por WhatsApp
                    </Button>
                  </div>
                )}

                {/* Link generado */}
                {order.paymentLink && (
                  <div>
                    <div className="text-[12.5px] text-muted-foreground mb-1.5 flex items-center gap-2 flex-wrap">
                      Link de pago
                      {order.paymentProvider && (
                        <span className="text-[10.5px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background border border-border">
                          {order.paymentProvider === "mercadopago" ? "Mercado Pago" : "Stripe"}
                        </span>
                      )}
                      {paymentsCfg.modo === "simulacion" && (
                        <span className="text-[10.5px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-warning/15 text-foreground/70 border border-warning/30">
                          Simulación
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-[12px] px-2 py-1 rounded bg-background border border-border break-all flex-1 min-w-0">
                        {order.paymentLink}
                      </code>
                      <Button size="sm" variant="ghost" className="rounded-full h-8" onClick={() => copiar(order.paymentLink!, "Link copiado")}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar link
                      </Button>
                      {order.telefono && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full h-8"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${order.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(buildPaymentReminder(order))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Send className="h-3.5 w-3.5 mr-1" /> Enviar por WhatsApp
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Recordatorio automático: ≥30 min sin pago */}
                {order.paymentLink &&
                  order.pago === "link_enviado" &&
                  order.paymentLinkAt &&
                  Date.now() - order.paymentLinkAt >= 30 * 60 * 1000 && (
                    <div className="border-t border-border pt-3">
                      <div className="text-[12.5px] text-muted-foreground mb-1.5 flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5" />
                        Recordatorio automático (≥30 min sin pago):
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-2 bg-background border border-border rounded-lg p-2.5">
                        {buildAutoPaymentReminder(order)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => copiar(buildAutoPaymentReminder(order))}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar recordatorio
                        </Button>
                        {order.telefono && (
                          <Button size="sm" variant="secondary" className="rounded-full" asChild>
                            <a
                              href={`https://wa.me/${order.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(buildAutoPaymentReminder(order))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Send className="h-3.5 w-3.5 mr-1" /> Enviar recordatorio
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                <div className="border-t border-border pt-3">
                  <div className="text-[12.5px] text-muted-foreground mb-1.5">Mensaje sugerido:</div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-2">
                    {buildPaymentReminder(order)}
                  </p>
                  <Button size="sm" variant="ghost" className="rounded-full" onClick={() => copiar(buildPaymentReminder(order))}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje
                  </Button>
                </div>
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
    no_requerido: { label: "Sin cobro", cls: "bg-muted text-muted-foreground border-border" },
    pendiente: { label: "Pendiente", cls: "bg-danger/8 text-danger/90 border-danger/25" },
    link_enviado: { label: "Link enviado", cls: "bg-warning/15 text-foreground/80 border-warning/35" },
    pagado: { label: "Pagado", cls: "bg-success/10 text-success/90 border-success/20" },
    fallido: { label: "Fallido", cls: "bg-danger/12 text-danger border-danger/35" },
    vencido: { label: "Vencido", cls: "bg-danger/15 text-danger border-danger/40" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-[22px] rounded-full text-[11px] font-medium border tabular-nums ${m.cls}`}>
      {m.label}
    </span>
  );
}

function CobroBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; emoji: string; cls: string }> = {
    no_requerido: { label: "Sin cobro", emoji: "⚪", cls: "bg-muted text-muted-foreground border-border" },
    pendiente: { label: "Pendiente", emoji: "🟡", cls: "bg-warning/15 text-foreground/85 border-warning/35" },
    link_enviado: { label: "Esperando pago", emoji: "🟡", cls: "bg-warning/15 text-foreground/85 border-warning/35" },
    pagado: { label: "Pagado", emoji: "🟢", cls: "bg-success/12 text-success border-success/30" },
    fallido: { label: "Fallido", emoji: "🔴", cls: "bg-danger/12 text-danger border-danger/35" },
    vencido: { label: "Vencido", emoji: "🔴", cls: "bg-danger/15 text-danger border-danger/40" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 h-[24px] rounded-full text-[12px] font-medium border ${m.cls}`}>
      <span>{m.emoji}</span> {m.label}
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

function NextActionPanel({
  order,
  onCopy,
  onAdvance,
}: {
  order: import("@/lib/operia-store").Order;
  onCopy: (text: string, label?: string) => void;
  onAdvance: (estado: OrderStatus) => void;
}) {
  const action = nextAction(order);
  if (!action) return null;

  const toneCls: Record<typeof action.tone, string> = {
    primary: "border-primary/30 bg-primary/5",
    warning: "border-warning/40 bg-warning/10",
    danger: "border-danger/40 bg-danger/8",
    success: "border-success/30 bg-success/8",
  };

  // Acción secundaria: avanzar estado al copiar (cuando aplica)
  const advanceAfter: Partial<Record<typeof action.kind, OrderStatus>> = {
    confirmar_pedido: "confirmado",
    avisar_listo: "entregado",
    marcar_listo: "listo",
  };
  const nextStatus = advanceAfter[action.kind];

  return (
    <Card className={`p-4 rounded-2xl mb-5 border ${toneCls[action.tone]}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="h-9 w-9 rounded-lg bg-foreground/10 grid place-items-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Próxima acción
          </div>
          <div className="text-sm font-medium mt-0.5">{action.label}</div>
          <div className="text-[12.5px] text-muted-foreground">{action.reason}</div>

          <div className="mt-3 p-3 rounded-xl bg-card border border-border">
            <div className="text-[11px] text-muted-foreground mb-1">Mensaje listo para enviar:</div>
            <p className="text-[13.5px] text-foreground/90 whitespace-pre-wrap">{action.message}</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                onCopy(action.message, "Mensaje copiado · listo para enviar");
                if (nextStatus) onAdvance(nextStatus);
              }}
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Copiar y enviar
            </Button>
            {nextStatus && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => onAdvance(nextStatus)}
              >
                Marcar como {nextStatus.replace("_", " ")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* -------- Validación contra catálogo -------- */
import type { CatalogValidation } from "@/lib/catalog-store";

function CatalogValidationBlock({
  validation,
  onCopy,
  onWhatsApp,
  onAlternative,
}: {
  validation: CatalogValidation;
  onCopy: (text: string) => void;
  onWhatsApp: (text: string) => void;
  onAlternative: () => string;
}) {
  if (validation.status === "sin_match") return null;

  if (validation.status === "ok") {
    return (
      <Card className="p-3.5 rounded-xl border-success/30 bg-success/8 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        <div className="text-[13px]">
          <span className="font-medium text-success">Coincide con tu catálogo</span>
          {validation.match && <> · {validation.match.nombre}</>}
        </div>
      </Card>
    );
  }

  // fuera_catalogo
  const msg = buildOutOfCatalogMessage(validation);
  return (
    <Card className="p-4 rounded-xl border-warning/40 bg-warning/10">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-foreground/70" />
        <h3 className="font-display text-[15px]">Solicitud fuera de catálogo</h3>
        <span className="ml-auto text-[10.5px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30">
          No confirmable todavía
        </span>
      </div>
      <ul className="space-y-1 mb-3">
        {validation.alerts.map((a, i) => (
          <li key={i} className="text-[13px] text-foreground/85 flex gap-2">
            <span className="text-danger">•</span> {a}
          </li>
        ))}
      </ul>
      <div className="bg-background border border-border rounded-lg p-2.5 text-[13px] whitespace-pre-wrap mb-3">
        {msg}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" className="rounded-full" onClick={() => onCopy(msg)}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje
        </Button>
        <Button size="sm" className="rounded-full" onClick={() => onWhatsApp(msg)}>
          <Send className="h-3.5 w-3.5 mr-1" /> Enviar por WhatsApp
        </Button>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => {
          const alt = onAlternative();
          onCopy(alt);
        }}>
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Ofrecer alternativa
        </Button>
      </div>
    </Card>
  );
}
