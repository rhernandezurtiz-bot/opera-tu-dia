/**
 * Inbox real: muestra conversaciones y mensajes provenientes del webhook Meta.
 * Permite responder manualmente y cambiar el modo de respuesta del canal.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChannelBadge } from "@/components/ChannelBadge";
import {
  listMetaConversations,
  listMetaMessages,
  sendMetaMessage,
  retrySendMessage,
  markConversationRead,
  upsertMetaChannel,
  listMetaChannels,
} from "@/server/meta.functions";
import { Loader2, Send, RefreshCw, MessageCircle, Check, CheckCheck, RotateCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";

export const Route = createFileRoute("/inbox/meta")({
  head: () => ({
    meta: [
      { title: "Inbox Meta — Operia" },
      {
        name: "description",
        content: "Mensajes reales de WhatsApp, Instagram y Facebook recibidos por webhook.",
      },
    ],
  }),
  component: InboxMetaPage,
});

const AUTO_REPLY_PREVIEW =
  "¡Hola! Gracias por escribir a Operia. Ya recibimos tu mensaje y en breve te ayudamos 🙌";

interface ConvRow {
  id: string;
  channel: "whatsapp" | "instagram" | "facebook";
  external_sender_id: string;
  sender_name: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
}

interface MsgRow {
  id: string;
  direction: "inbound" | "outbound";
  text: string | null;
  status: string;
  created_at: string;
  raw_payload?: Record<string, unknown> | null;
}

function isAutoReply(m: MsgRow): boolean {
  const raw = m.raw_payload;
  if (!raw || typeof raw !== "object") return false;
  return (raw as { kind?: string }).kind === "auto_reply";
}

function getSendError(m: MsgRow): string | null {
  const raw = m.raw_payload;
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { userError?: string; error?: string };
  return r.userError ?? r.error ?? null;
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Hoy";
  if (sameDay(d, yesterday)) return "Ayer";
  return d.toLocaleDateString([], { day: "2-digit", month: "long", year: "numeric" });
}

function InboxMetaPage() {
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [selected, setSelected] = useState<ConvRow | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [channelModes, setChannelModes] = useState<Record<string, "manual" | "suggested" | "auto">>(
    {},
  );

  const refreshConvs = async () => {
    try {
      const [conversationResult, channelResult] = await Promise.all([
        listMetaConversations(),
        listMetaChannels(),
      ]);
      const conversations = Array.isArray(conversationResult?.conversations)
        ? (conversationResult.conversations as ConvRow[])
        : [];
      const channels = Array.isArray(channelResult?.channels) ? channelResult.channels : [];

      setConvs(conversations);
      const modes: Record<string, any> = {};
      for (const c of channels as any[]) modes[c.channel] = c.reply_mode;
      setChannelModes(modes);
      // Mantener seleccionada si sigue existiendo
      if (selected) {
        const still = conversations.find((c) => c.id === selected.id);
        if (still) setSelected(still);
      }
    } catch (err: any) {
      setConvs([]);
      setChannelModes({});
      toast.error(err?.message ?? "Error al cargar conversaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshConvs();
    const t = setInterval(() => void refreshConvs(), 10000);

    // Realtime: refrescar conversaciones cuando cambien o llegue un mensaje nuevo
    const channel = supabase
      .channel("inbox-meta-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meta_conversations" },
        () => void refreshConvs(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meta_messages" },
        (payload: any) => {
          void refreshConvs();
          const newMsg = payload?.new;
          if (newMsg && selected && newMsg.conversation_id === selected.id) {
            setMessages((prev) =>
              prev.some((m) => m.id === newMsg.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: newMsg.id,
                      direction: newMsg.direction,
                      text: newMsg.text,
                      status: newMsg.status,
                      created_at: newMsg.created_at,
                    } as MsgRow,
                  ],
            );
          }
        },
      )
      .subscribe();

    return () => {
      clearInterval(t);
      void supabase.removeChannel(channel);
    };
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    void (async () => {
      try {
        const { messages: rows } = await listMetaMessages({
          data: { conversationId: selected.id },
        });
        setMessages(rows as MsgRow[]);
        if (selected.unread_count > 0) {
          await markConversationRead({ data: { conversationId: selected.id } });
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Error al cargar mensajes");
      }
    })();
  }, [selected?.id]);

  // Auto-scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, selected?.id]);

  const send = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const res = await sendMetaMessage({
        data: { conversationId: selected.id, text: draft.trim() },
      });
      setDraft("");
      toast.success(res.mode === "live" ? "Mensaje enviado" : "Mensaje guardado (modo simulación)");
      // refrescar mensajes
      const { messages: rows } = await listMetaMessages({ data: { conversationId: selected.id } });
      setMessages(rows as MsgRow[]);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo enviar");
    } finally {
      setSending(false);
    }
  };

  const sendAutoReply = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await sendMetaMessage({
        data: { conversationId: selected.id, text: AUTO_REPLY_PREVIEW },
      });
      toast.success("Respuesta automática enviada");
      const { messages: rows } = await listMetaMessages({ data: { conversationId: selected.id } });
      setMessages(rows as MsgRow[]);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo enviar");
    } finally {
      setSending(false);
    }
  };

  const toggleAuto = async () => {
    if (!selected) return;
    const current = channelModes[selected.channel] ?? "manual";
    const next = current === "auto" ? "manual" : "auto";
    try {
      const res = await upsertMetaChannel({
        data: { channel: selected.channel, reply_mode: next },
      });
      if (!res?.ok) {
        toast.error("No se pudo cambiar el modo del canal");
        return;
      }
      setChannelModes((m) => ({ ...m, [selected.channel]: next }));
      toast.success(next === "auto" ? "Modo automático activado" : "Modo manual activado");
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    }
  };

  const safeConvs = Array.isArray(convs) ? convs : [];
  const totalUnread = useMemo(
    () => safeConvs.reduce((s, c) => s + (c.unread_count ?? 0), 0),
    [safeConvs],
  );

  return (
    <AppShell>
      <PageHeader
        title="Inbox Meta"
        subtitle="Mensajes reales recibidos por webhook desde WhatsApp, Instagram y Facebook."
        actions={
          <div className="flex items-center gap-2">
            {totalUnread > 0 && <Badge>{totalUnread} sin leer</Badge>}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void refreshConvs()}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Actualizar
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        {/* Lista */}
        <Card className="rounded-xl overflow-hidden">
          <div className="p-3 border-b text-xs uppercase tracking-wide text-muted-foreground">
            Conversaciones ({safeConvs.length})
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y">
            {loading && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando...
              </div>
            )}
            {!loading && safeConvs.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
                Aún no hay mensajes. Conecta un canal en Configuración y envíate un mensaje de
                prueba.
              </div>
            )}
            {safeConvs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition ${selected?.id === c.id ? "bg-secondary/70" : ""}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {c.sender_name ?? c.external_sender_id}
                  </span>
                  <ChannelBadge canal={c.channel} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {c.last_message_preview ?? "—"}
                  </span>
                  {c.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-xs">{c.unread_count}</Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(c.last_message_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detalle */}
        <Card className="rounded-xl flex flex-col min-h-[70vh]">
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">
              Selecciona una conversación para ver los mensajes.
            </div>
          )}
          {selected && (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base">
                      {selected.sender_name ?? selected.external_sender_id}
                    </span>
                    <ChannelBadge canal={selected.channel} />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {selected.external_sender_id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Modo: {channelModes[selected.channel] ?? "manual"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={channelModes[selected.channel] === "auto" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => void toggleAuto()}
                  >
                    {channelModes[selected.channel] === "auto"
                      ? "Desactivar auto"
                      : "Activar automático"}
                  </Button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
                style={{
                  backgroundColor: "hsl(var(--muted) / 0.4)",
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.04) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              >
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-12">
                    Sin mensajes todavía.
                  </div>
                )}
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const dateLabel = formatDateSeparator(m.created_at);
                  const showSeparator =
                    !prev || formatDateSeparator(prev.created_at) !== dateLabel;
                  const sameSenderAsPrev =
                    prev && prev.direction === m.direction && !showSeparator;
                  return (
                    <div key={m.id}>
                      {showSeparator && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] bg-background/80 backdrop-blur px-3 py-1 rounded-full text-muted-foreground shadow-sm">
                            {dateLabel}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"} ${sameSenderAsPrev ? "mt-0.5" : "mt-2"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm relative border ${
                            m.direction === "outbound"
                              ? "bg-[hsl(140_55%_88%)] dark:bg-[hsl(140_30%_22%)] text-foreground rounded-br-sm border-[hsl(140_40%_70%)]/40"
                              : "bg-background text-foreground rounded-bl-sm border-border"
                          }`}
                        >
                          {!sameSenderAsPrev && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wide ${
                                  m.direction === "outbound"
                                    ? "text-[hsl(140_50%_30%)] dark:text-[hsl(140_50%_70%)]"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {m.direction === "outbound" ? "Operia" : "Cliente"}
                              </span>
                              {isAutoReply(m) && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wider"
                                >
                                  Auto
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap break-words pr-12">
                            {m.text}
                          </div>
                          <div className="float-right inline-flex items-center gap-1 text-[10px] text-muted-foreground -mt-1 ml-2">
                            <span>
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {m.direction === "outbound" &&
                              (m.status === "sent" || m.status === "delivered" ? (
                                <Check className="h-3 w-3" />
                              ) : m.status === "read" ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : m.status === "failed" ? (
                                <span className="text-destructive">!</span>
                              ) : null)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const mode = channelModes[selected.channel] ?? "manual";
                // Solo en manual o suggested
                if (mode !== "manual" && mode !== "suggested") return null;
                const lastInbound = [...messages].reverse().find((m) => m.direction === "inbound");
                if (!lastInbound) return null;
                // Si ya hay un outbound posterior al último entrante, no mostrar la caja
                const alreadyAnswered = messages.some(
                  (m) => m.direction === "outbound" && m.created_at > lastInbound.created_at,
                );
                if (alreadyAnswered) return null;
                // En manual solo mostrar si el usuario lo pide explícitamente — aquí
                // mostramos la sugerencia siempre que no haya respuesta aún.
                return (
                  <div className="px-3 pt-3">
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          Respuesta automática que enviaría Operia
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {mode === "suggested" ? "Modo sugerido" : "Modo manual"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {AUTO_REPLY_PREVIEW}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={sending}
                          onClick={() => void sendAutoReply()}
                        >
                          {sending ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Send className="h-3 w-3 mr-1" />
                          )}
                          Enviar ahora
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setDraft(AUTO_REPLY_PREVIEW)}
                        >
                          Editar antes de enviar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 border-t space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {channelModes[selected.channel] === "auto"
                      ? "Operia responde automáticamente. Puedes intervenir en cualquier momento."
                      : channelModes[selected.channel] === "suggested"
                        ? "Modo sugerido: revisa y envía la respuesta propuesta."
                        : "Modo manual: nada se envía sin tu aprobación."}
                  </span>
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={sending || !draft.trim()}
                    onClick={() => void send()}
                  >
                    {sending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
