import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader, RiskBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseWhatsapp, useOperia, typeLabels, CHANNEL_LABELS, type Order, type OrderType } from "@/lib/operia-store";
import { buildSmartReply, buildConfirmMessage, buildPaymentMessage, buildReadyMessage } from "@/lib/ui-store";
import { autoReplyForMessage, INTENT_LABELS, DECISION_LABELS, DECISION_TONE } from "@/lib/auto-reply";
import { useCatalog } from "@/lib/catalog-store";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendInstagramDM } from "@/lib/instagram";
import { sendFacebookMessage } from "@/lib/facebook";
import { ArrowLeft, Sparkles, Save, Copy, CheckCircle2, AlertTriangle, MessageCircle, Phone, Clock, CalendarClock, Send, Pencil, X, Bot } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/$id")({
  head: () => ({
    meta: [{ title: "Mensaje — Operia" }],
  }),
  component: InboxDetail,
  notFoundComponent: () => (
    <AppShell>
      <PageHeader title="Mensaje no encontrado" />
      <Link to="/inbox" className="text-primary underline">Volver al Inbox</Link>
    </AppShell>
  ),
});

function InboxDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const message = useOperia((s) => s.messages.find((m) => m.id === id));
  const orderLinked = useOperia((s) => (message?.ordenId ? s.orders.find((o) => o.id === message.ordenId) : undefined));
  const setMessageStatus = useOperia((s) => s.setMessageStatus);
  const linkMessageOrder = useOperia((s) => s.linkMessageOrder);
  const addOrder = useOperia((s) => s.addOrder);
  const orders = useOperia((s) => s.orders);
  const catalog = useCatalog((s) => s.items);
  const autoReplyMode = useOperia((s) => s.autoReplyMode);
  const logAutoReply = useOperia((s) => s.logAutoReply);
  const updateAutoReplyLog = useOperia((s) => s.updateAutoReplyLog);

  const [draft, setDraft] = useState<Order | null>(null);
  const [autoReplyText, setAutoReplyText] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);

  // Calcular respuesta automática para este mensaje
  const auto = useMemo(() => {
    if (!message) return null;
    return autoReplyForMessage(message, catalog, orders);
  }, [message, catalog, orders]);

  useEffect(() => {
    if (auto && autoReplyText === null) setAutoReplyText(auto.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto?.message]);

  const enviarAuto = async () => {
    if (!message || !autoReplyText) return;
    setSending(true);
    const canal = message.canal ?? "whatsapp";
    const logId = logAutoReply({
      canal, cliente: message.cliente, messageId: message.id, ordenId: message.ordenId,
      recibido: message.texto,
      intencion: auto?.intent ?? "desconocido",
      decision: auto?.decision ?? "requiere_revision",
      respuesta: autoReplyText,
      enviado: false, modo: autoReplyMode === "manual" ? "manual" : autoReplyMode,
      resultado: "pendiente",
    });

    let result: { ok: boolean; error?: string } = { ok: false, error: "Sin destinatario" };
    try {
      if (canal === "instagram" && message.canalUserId) {
        const r = await sendInstagramDM({ userId: message.canalUserId, message: autoReplyText });
        result = { ok: r.ok, error: r.error };
      } else if (canal === "facebook" && message.canalUserId) {
        const r = await sendFacebookMessage({ userId: message.canalUserId, message: autoReplyText });
        result = { ok: r.ok, error: r.error };
      } else if (message.telefono) {
        const r = await sendWhatsAppMessage({ phone: message.telefono, message: autoReplyText });
        result = { ok: r.ok, error: r.error };
      }
    } catch (err: any) {
      result = { ok: false, error: err?.message ?? "Error desconocido" };
    }

    updateAutoReplyLog(logId, {
      enviado: result.ok,
      resultado: result.ok ? "ok" : "error",
      error: result.error,
    });

    setSending(false);
    if (result.ok) {
      toast.success(`Respuesta enviada por ${CHANNEL_LABELS[canal]}`);
      setMessageStatus(message.id, "respondido");
    } else {
      toast.error(result.error ?? "No se pudo enviar la respuesta");
    }
  };

  const analizar = () => {
    if (!message) return;
    const parsed = parseWhatsapp(message.texto);
    if (!parsed.cliente && message.cliente && message.cliente !== message.telefono) parsed.cliente = message.cliente;
    if (!parsed.telefono && message.telefono) parsed.telefono = message.telefono;
    setDraft(parsed);
    if (message.estado === "nuevo") setMessageStatus(message.id, "analizado");
  };

  // Auto-analyze on open so the user sees the order preview immediately
  useEffect(() => {
    if (message && !message.ordenId && !draft) analizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id]);

  const guardarOrden = () => {
    if (!draft || !message) return;
    addOrder(draft);
    linkMessageOrder(message.id, draft.id);
    toast.success("Orden creada y vinculada al mensaje");
    navigate({ to: "/pedidos/$id", params: { id: draft.id } });
  };

  const copiar = (text: string, label = "Mensaje copiado") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const replies = useMemo(() => {
    if (!message) return [];
    const base: Order = draft || ({
      cliente: message.cliente,
      telefono: message.telefono,
      tipo: "producto",
      descripcion: "",
      fechaEntrega: "",
      horaEntrega: "",
      faltantes: [],
      precio: 0,
    } as unknown as Order);
    const tipoLabel = draft ? typeLabels[draft.tipo] : "pedido";
    return [
      {
        title: `Sugerido para este ${tipoLabel.toLowerCase()}`,
        body: buildSmartReply(base),
        primary: true,
      },
      {
        title: "Confirmar pedido",
        body: buildConfirmMessage(base),
      },
      {
        title: "Solicitar pago / anticipo",
        body: buildPaymentMessage(base),
      },
      {
        title: "Avisar que está listo",
        body: buildReadyMessage(base),
      },
    ];
  }, [message, draft]);

  if (!message) {
    return (
      <AppShell>
        <PageHeader title="Mensaje no encontrado" />
        <Link to="/inbox" className="text-primary underline">Volver al Inbox</Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/inbox" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Inbox
      </Link>

      <PageHeader
        title={message.cliente}
        subtitle={message.telefono}
        actions={
          <Button variant="secondary" className="rounded-full" onClick={() => setMessageStatus(message.id, "respondido")}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como respondido
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Original message */}
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Mensaje original</span>
          </div>
          <div className="rounded-2xl bg-success/10 border border-success/20 p-4 text-sm whitespace-pre-wrap">
            {message.texto}
          </div>
          <div className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> {message.telefono || "Sin teléfono"}
          </div>

          {orderLinked ? (
            <div className="mt-4 p-3 rounded-2xl bg-secondary/60 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Orden vinculada</div>
                <div className="text-muted-foreground text-xs">{orderLinked.descripcion || "Sin descripción"}</div>
              </div>
              <Link to="/pedidos/$id" params={{ id: orderLinked.id }} className="text-sm text-primary underline">
                Abrir
              </Link>
            </div>
          ) : (
            <Button onClick={analizar} size="lg" className="rounded-full w-full mt-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Analizar y convertir en orden
            </Button>
          )}
        </Card>

        {/* Structured preview */}
        {draft && !orderLinked && (
          <Card className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Orden detectada</span>
              <RiskBadge level={draft.riesgo} />
              {draft.fechaEntrega && draft.fechaConfirmada === false && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30">
                  <CalendarClock className="h-3 w-3" /> Fecha: {draft.fechaTextoOriginal} (no confirmada)
                </span>
              )}
              {draft.horaAprox && !draft.horaEntrega && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30">
                  <Clock className="h-3 w-3" /> Hora: {draft.horaAprox} (aproximada)
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              <span className="font-medium text-foreground">Resumen:</span> {draft.descripcion || "Sin resumen"}
            </div>
            <DraftEditor draft={draft} onChange={setDraft} />

            {/* Mensaje sugerido visible ANTES de los botones */}
            <div className="mt-4 p-4 rounded-2xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Mensaje sugerido para el cliente</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 mb-3 whitespace-pre-wrap">
                {buildSmartReply(draft)}
              </p>
              <Button size="sm" className="rounded-full" onClick={() => copiar(buildSmartReply(draft))}>
                <Copy className="h-4 w-4 mr-1" /> Copiar mensaje
              </Button>
            </div>

            {draft.faltantes.length > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2 mb-1.5 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" /> Faltan datos
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draft.faltantes.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-card border border-warning/40">{f}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={guardarOrden} size="lg" className="rounded-full flex-1 min-w-[160px]">
                <Save className="h-4 w-4 mr-2" /> Guardar como orden
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Respuesta automática (intent + decisión + acciones) */}
      {auto && (
        <section className="mt-8">
          <Card className="p-5 rounded-xl border-primary/30 bg-primary/4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Respuesta generada automáticamente</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {INTENT_LABELS[auto.intent]}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                DECISION_TONE[auto.decision] === "success" ? "bg-success/10 text-success border-success/20" :
                DECISION_TONE[auto.decision] === "danger" ? "bg-danger/10 text-danger border-danger/20" :
                DECISION_TONE[auto.decision] === "warning" ? "bg-warning/10 text-foreground/80 border-warning/30" :
                "bg-foreground/5 text-foreground/80 border-border"
              }`}>
                {DECISION_LABELS[auto.decision]}
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                Canal: {CHANNEL_LABELS[message.canal ?? "whatsapp"]} · Modo: {autoReplyMode}
              </span>
            </div>

            {auto.needsReview && (
              <div className="mb-3 p-3 rounded-2xl bg-warning/10 border border-warning/30 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Este mensaje requiere revisión humana — Operia no lo enviará en automático.
              </div>
            )}

            {editing ? (
              <Textarea
                value={autoReplyText ?? ""}
                onChange={(e) => setAutoReplyText(e.target.value)}
                className="rounded-xl text-sm min-h-32 resize-none"
              />
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap p-3 rounded-2xl bg-card border border-border">
                {autoReplyText}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={enviarAuto}
                disabled={sending || !autoReplyText}
                size="lg"
                className="rounded-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Enviando…" : "Enviar automático"}
              </Button>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {editing ? "Listo" : "Editar"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => { setAutoReplyText(auto.message); setEditing(false); toast.message("Respuesta restaurada"); }}
              >
                Restaurar sugerida
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-muted-foreground"
                onClick={() => { setAutoReplyText(null); setMessageStatus(message.id, "respondido"); toast.message("Respuesta cancelada"); }}
              >
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            </div>
          </Card>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl mb-3">Respuestas sugeridas</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Ningún mensaje se envía automáticamente. Copia, revisa y envía desde WhatsApp.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {replies.map((r) => (
            <Card key={r.title} className="p-4 rounded-2xl">
              <div className="font-medium text-sm mb-2">{r.title}</div>
              <Textarea
                readOnly
                value={r.body}
                className="rounded-xl text-sm min-h-24 resize-none bg-secondary/40"
              />
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="rounded-full" onClick={() => copiar(r.body)}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar respuesta
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    copiar(r.body);
                    setMessageStatus(message.id, "respondido");
                  }}
                >
                  Copiar y marcar respondido
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function DraftEditor({ draft, onChange }: { draft: Order; onChange: (o: Order) => void }) {
  const update = (patch: Partial<Order>) => onChange({ ...draft, ...patch });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field label="Cliente" value={draft.cliente} onChange={(v) => update({ cliente: v })} />
      <Field label="Teléfono" value={draft.telefono} onChange={(v) => update({ telefono: v })} />
      <div>
        <Label className="text-xs text-muted-foreground">Tipo</Label>
        <select
          value={draft.tipo}
          onChange={(e) => update({ tipo: e.target.value as OrderType })}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(typeLabels) as OrderType[]).map((t) => (
            <option key={t} value={t}>{typeLabels[t]}</option>
          ))}
        </select>
      </div>
      <Field label="Cantidad" value={draft.cantidad} onChange={(v) => update({ cantidad: v })} />
      <div className="sm:col-span-2">
        <Label className="text-xs text-muted-foreground">Descripción</Label>
        <Input value={draft.descripcion} onChange={(e) => update({ descripcion: e.target.value })} className="mt-1 rounded-xl" />
      </div>
      <Field label="Fecha" type="date" value={draft.fechaEntrega} onChange={(v) => update({ fechaEntrega: v })} />
      <Field label="Hora" type="time" value={draft.horaEntrega} onChange={(v) => update({ horaEntrega: v })} />
      <div className="sm:col-span-2">
        <Label className="text-xs text-muted-foreground">Dirección</Label>
        <Input value={draft.direccion} onChange={(e) => update({ direccion: e.target.value })} className="mt-1 rounded-xl" />
      </div>
      <div className="sm:col-span-2">
        <Label className="text-xs text-muted-foreground">Detalles</Label>
        <Textarea value={draft.detalles} onChange={(e) => update({ detalles: e.target.value })} className="mt-1 rounded-xl resize-none" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 rounded-xl" />
    </div>
  );
}
