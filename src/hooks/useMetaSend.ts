/**
 * useMetaSend — hook para enviar mensajes de WhatsApp desde el inbox manual.
 * Llama a POST /api/send-whatsapp y devuelve ok, messageId, error, savedId.
 */
import { useState } from "react";

interface SendOptions {
  phone:          string;
  message:        string;
  conversationId: string;
  ownerId?:       string;
}

interface SendResult {
  ok:         boolean;
  messageId?: string | null;
  error?:     string | null;
  savedId?:   string | null;
}

export function useMetaSend() {
  const [sending,   setSending]   = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const send = async (opts: SendOptions): Promise<SendResult> => {
    setSending(true);
    setLastError(null);
    try {
      const res = await fetch("/api/send-whatsapp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone:           opts.phone,
          message:         opts.message,
          conversation_id: opts.conversationId,
          owner_id:        opts.ownerId,
        }),
      });
      const data: SendResult = await res.json();
      if (!data.ok) setLastError(data.error ?? "Error enviando mensaje");
      return data;
    } catch (err: any) {
      const msg = err?.message ?? "Error de red";
      setLastError(msg);
      return { ok: false, error: msg };
    } finally {
      setSending(false);
    }
  };

  const retry = async (opts: SendOptions): Promise<SendResult> => {
    return send(opts);
  };

  return { send, retry, sending, lastError };
}
