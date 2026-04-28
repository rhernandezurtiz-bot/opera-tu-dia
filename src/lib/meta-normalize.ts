/**
 * Normaliza payloads entrantes de Meta (WhatsApp Cloud / Instagram Messaging /
 * Facebook Messenger) a un formato único para Operia.
 *
 * Meta envía un objeto `entry[].changes[]` para WhatsApp y `entry[].messaging[]`
 * para Instagram/Facebook. Aquí los aplanamos a una lista de mensajes.
 */

export type MetaChannel = "whatsapp" | "instagram" | "facebook";

export interface NormalizedMessage {
  channel: MetaChannel;
  externalConversationId: string;
  externalSenderId: string;
  senderName: string | null;
  externalAccountId: string | null;
  text: string;
  timestamp: number;
  externalMessageId: string | null;
  rawPayload: unknown;
}

interface MetaEnvelope {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    changes?: Array<{ field?: string; value?: any }>;
    messaging?: Array<any>;
  }>;
}

export function normalizeMetaPayload(payload: unknown): NormalizedMessage[] {
  const env = payload as MetaEnvelope;
  if (!env || typeof env !== "object" || !Array.isArray(env.entry)) return [];
  const out: NormalizedMessage[] = [];

  for (const entry of env.entry) {
    // ── WhatsApp Cloud ────────────────────────────────────────────────────
    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        if (change.field !== "messages" && change.field !== "message") continue;
        const value = change.value ?? {};
        const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
        const contacts: any[] = Array.isArray(value.contacts) ? value.contacts : [];
        const messages: any[] = Array.isArray(value.messages) ? value.messages : [];

        for (const msg of messages) {
          const from: string = msg?.from ?? "";
          const text =
            msg?.text?.body ??
            msg?.button?.text ??
            msg?.interactive?.button_reply?.title ??
            msg?.interactive?.list_reply?.title ??
            "";
          if (!from || !text) continue;
          const contact = contacts.find((c) => c?.wa_id === from);
          out.push({
            channel: "whatsapp",
            externalConversationId: from,
            externalSenderId: from,
            senderName: contact?.profile?.name ?? null,
            externalAccountId: phoneNumberId ?? entry.id ?? null,
            text: String(text),
            timestamp: Number(msg.timestamp) ? Number(msg.timestamp) * 1000 : Date.now(),
            externalMessageId: msg?.id ?? null,
            rawPayload: msg,
          });
        }
      }
    }

    // ── Instagram Messaging / Facebook Messenger ──────────────────────────
    if (Array.isArray(entry.messaging)) {
      const channel: MetaChannel =
        env.object === "instagram" ? "instagram" : "facebook";
      for (const m of entry.messaging) {
        const senderId: string = m?.sender?.id ?? "";
        const recipientId: string = m?.recipient?.id ?? "";
        const text: string = m?.message?.text ?? m?.postback?.title ?? "";
        if (!senderId || !text) continue;
        out.push({
          channel,
          externalConversationId: senderId,
          externalSenderId: senderId,
          senderName: m?.sender?.name ?? null,
          externalAccountId: recipientId || entry.id || null,
          text: String(text),
          timestamp: Number(m.timestamp) || Date.now(),
          externalMessageId: m?.message?.mid ?? null,
          rawPayload: m,
        });
      }
    }
  }

  return out;
}
