/**
 * Webhook PÚBLICO para WhatsApp Cloud API (Meta).
 *
 *   GET  /api/public/webhooks/whatsapp  → handshake (devuelve hub.challenge)
 *   POST /api/public/webhooks/whatsapp  → eventos entrantes (siempre 200)
 *
 * Persistencia directa con supabaseAdmin: NO depende de auth de usuario ni de
 * que exista un canal conectado. Si hay un canal whatsapp conectado, se asocia
 * el owner_id; si no, el mensaje queda con owner_id NULL y aún así se guarda
 * y aparece en /inbox/meta (modo demo).
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeMetaPayload } from "@/lib/meta-normalize";

const VERIFY_TOKEN = "operia123";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature, X-Hub-Signature-256",
  "Access-Control-Max-Age": "86400",
} as const;

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS };

async function logError(reason: string, info: Record<string, unknown>) {
  try {
    await (supabaseAdmin.from("meta_message_logs") as any).insert({
      channel: "whatsapp",
      direction: "inbound",
      ok: false,
      info: { reason, ...info },
    });
  } catch (e) {
    console.error("[whatsapp-webhook] log insert failed", e);
  }
}

async function resolveOwnerId(externalAccountId: string | null): Promise<string | null> {
  // Match por phone_number_id si viene
  if (externalAccountId) {
    const { data } = await supabaseAdmin
      .from("meta_channels")
      .select("owner_id")
      .eq("channel", "whatsapp")
      .eq("external_account_id", externalAccountId)
      .eq("connected", true)
      .limit(1)
      .maybeSingle();
    if (data?.owner_id) return data.owner_id;
  }
  // Fallback: cualquier canal whatsapp conectado
  const { data } = await supabaseAdmin
    .from("meta_channels")
    .select("owner_id")
    .eq("channel", "whatsapp")
    .eq("connected", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.owner_id ?? null;
}

async function persistWhatsAppMessage(msg: {
  from: string;
  text: string;
  senderName: string | null;
  externalAccountId: string | null;
  externalMessageId: string | null;
  timestamp: number;
  rawPayload: unknown;
}) {
  const ownerId = await resolveOwnerId(msg.externalAccountId);

  // 1) Upsert conversación por (owner_id, channel, external_conversation_id)
  //    Si owner_id es NULL, agrupamos por phone para no duplicar.
  let conversationId: string | null = null;

  if (ownerId) {
    const { data: conv, error } = await supabaseAdmin
      .from("meta_conversations")
      .upsert(
        {
          owner_id: ownerId,
          channel: "whatsapp",
          external_conversation_id: msg.from,
          external_sender_id: msg.from,
          phone: msg.from,
          sender_name: msg.senderName,
          last_message_at: new Date(msg.timestamp).toISOString(),
          last_message_preview: msg.text.slice(0, 140),
        },
        { onConflict: "owner_id,channel,external_conversation_id" },
      )
      .select("id, unread_count")
      .single();

    if (error || !conv) {
      await logError("conversation_upsert_failed", { error: error?.message, from: msg.from });
      return;
    }
    conversationId = conv.id;
    await supabaseAdmin
      .from("meta_conversations")
      .update({ unread_count: (conv.unread_count ?? 0) + 1 })
      .eq("id", conv.id);
  } else {
    // Sin owner: buscar conversación huérfana por phone, o crear
    const { data: existing } = await supabaseAdmin
      .from("meta_conversations")
      .select("id, unread_count")
      .is("owner_id", null)
      .eq("channel", "whatsapp")
      .eq("phone", msg.from)
      .limit(1)
      .maybeSingle();

    if (existing) {
      conversationId = existing.id;
      await supabaseAdmin
        .from("meta_conversations")
        .update({
          unread_count: (existing.unread_count ?? 0) + 1,
          last_message_at: new Date(msg.timestamp).toISOString(),
          last_message_preview: msg.text.slice(0, 140),
          sender_name: msg.senderName,
        })
        .eq("id", existing.id);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("meta_conversations")
        .insert({
          owner_id: null,
          channel: "whatsapp",
          external_conversation_id: msg.from,
          external_sender_id: msg.from,
          phone: msg.from,
          sender_name: msg.senderName,
          last_message_at: new Date(msg.timestamp).toISOString(),
          last_message_preview: msg.text.slice(0, 140),
          unread_count: 1,
        })
        .select("id")
        .single();
      if (error || !created) {
        await logError("conversation_insert_failed", { error: error?.message, from: msg.from });
        return;
      }
      conversationId = created.id;
    }
  }

  // 2) Insertar mensaje
  const { error: msgErr } = await supabaseAdmin.from("meta_messages").insert({
    owner_id: ownerId,
    conversation_id: conversationId,
    channel: "whatsapp",
    direction: "inbound",
    text: msg.text,
    phone: msg.from,
    status: "received",
    external_message_id: msg.externalMessageId,
    raw_payload: msg.rawPayload as any,
  });

  if (msgErr) {
    await logError("message_insert_failed", {
      error: msgErr.message,
      from: msg.from,
      conversationId,
    });
    return;
  }

  // 3) Log éxito
  try {
    await supabaseAdmin.from("meta_message_logs").insert({
      owner_id: ownerId,
      channel: "whatsapp",
      direction: "inbound",
      ok: true,
      info: { from: msg.from, preview: msg.text.slice(0, 80), conversationId },
    });
  } catch {
    // ignore log failure
  }
}

export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 200, headers: { ...CORS_HEADERS } }),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
          return new Response(challenge, { status: 200, headers: TEXT_HEADERS });
        }
        return new Response("", { status: 200, headers: TEXT_HEADERS });
      },

      POST: async ({ request }) => {
        let payload: any = null;
        try {
          payload = await request.json();
        } catch {
          return new Response("ok", { status: 200, headers: TEXT_HEADERS });
        }

        // Log raw best-effort
        try {
          await (supabaseAdmin.from("meta_message_logs") as any).insert({
            channel: "whatsapp",
            direction: "inbound",
            ok: true,
            info: { source: "whatsapp_webhook", payload },
          });
        } catch (e) {
          console.error("[whatsapp-webhook] raw log failed", e);
        }

        try {
          const messages = normalizeMetaPayload(payload).filter((m) => m.channel === "whatsapp");
          for (const m of messages) {
            try {
              await persistWhatsAppMessage({
                from: m.externalSenderId,
                text: m.text,
                senderName: m.senderName,
                externalAccountId: m.externalAccountId,
                externalMessageId: m.externalMessageId,
                timestamp: m.timestamp,
                rawPayload: m.rawPayload,
              });
            } catch (err: any) {
              console.error("[whatsapp-webhook] persist exception", err);
              await logError("exception", { error: String(err?.message ?? err) });
            }
          }
        } catch (err) {
          console.error("[whatsapp-webhook] normalize error", err);
        }

        return new Response("ok", { status: 200, headers: TEXT_HEADERS });
      },
    },
  },
});
