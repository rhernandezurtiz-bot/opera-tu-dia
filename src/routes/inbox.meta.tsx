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
  markConversationRead,
  upsertMetaChannel,
  listMetaChannels,
} from "@/server/meta.functions";
import { Loader2, Send, RefreshCw, MessageCircle, Check, CheckCheck } from "lucide-react";
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
}

function InboxMetaPage() {
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [selected, setSelected] = useState<ConvRow | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
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

  const toggleAuto = async () => {
    if (!selected) return;
    const current = channelModes[selected.channel] ?? "manual";
    const next = current === "auto" ? "manual" : "auto";
    try {
      await upsertMetaChannel({ data: { channel: selected.channel, reply_mode: next } });
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
                          className={`max-w-[78%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm relative ${
                            m.direction === "outbound"
                              ? "bg-[hsl(140_50%_85%)] dark:bg-[hsl(140_30%_25%)] text-foreground rounded-br-sm"
                              : "bg-background text-foreground rounded-bl-sm"
                          }`}
                        >
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
