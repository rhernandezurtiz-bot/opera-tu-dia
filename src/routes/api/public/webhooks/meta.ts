/**
 * Webhook unificado para Meta (WhatsApp / Instagram / Facebook).
 *
 *   GET  /api/public/webhooks/meta   → verificación (hub.challenge)
 *   POST /api/public/webhooks/meta   → eventos entrantes
 *
 * Persiste cada mensaje normalizado en `meta_conversations` y `meta_messages`
 * usando el cliente admin (las RLS están en su lugar para los lectores).
 *
 * Para enrutar el mensaje al negocio correcto, se busca un `meta_channels`
 * conectado cuyo `external_account_id` coincida con el destinatario reportado
 * por Meta. Si no se encuentra, se cae al primer canal conectado de ese tipo
 * (útil en un entorno con un solo negocio).
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeMetaPayload, type NormalizedMessage } from "@/lib/meta-normalize";
import { sendViaMeta } from "@/lib/meta-send";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature, X-Hub-Signature-256",
};

export async function resolveOwnerForMessage(msg: NormalizedMessage): Promise<string | null> {
  // 1) match por external_account_id
  if (msg.externalAccountId) {
    const { data } = await supabaseAdmin
      .from("meta_channels")
      .select("owner_id")
      .eq("channel", msg.channel)
      .eq("external_account_id", msg.externalAccountId)
      .eq("connected", true)
      .limit(1)
      .maybeSingle();
    if (data?.owner_id) return data.owner_id;
  }
  // 2) fallback: cualquier canal conectado de ese tipo
  const { data: any2 } = await supabaseAdmin
    .from("meta_channels")
    .select("owner_id")
    .eq("channel", msg.channel)
    .eq("connected", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return any2?.owner_id ?? null;
}

export async function persistAndMaybeReply(msg: NormalizedMessage) {
  const ownerId = await resolveOwnerForMessage(msg);
  if (!ownerId) {
    await supabaseAdmin.from("meta_message_logs").insert({
      channel: msg.channel,
      direction: "inbound",
      ok: false,
      info: { reason: "no_channel_connected", externalAccountId: msg.externalAccountId, sender: msg.externalSenderId },
    });
    return;
  }

  // Upsert conversación
  const { data: conv, error: convErr } = await supabaseAdmin
    .from("meta_conversations")
    .upsert(
      {
        owner_id: ownerId,
        channel: msg.channel,
        external_conversation_id: msg.externalConversationId,
        external_sender_id: msg.externalSenderId,
        sender_name: msg.senderName,
        last_message_at: new Date(msg.timestamp).toISOString(),
        last_message_preview: msg.text.slice(0, 140),
      },
      { onConflict: "owner_id,channel,external_conversation_id" },
    )
    .select("id, unread_count")
    .single();

  if (convErr || !conv) {
    await supabaseAdmin.from("meta_message_logs").insert({
      owner_id: ownerId, channel: msg.channel, direction: "inbound", ok: false,
      info: { reason: "conversation_upsert_failed", error: convErr?.message },
    });
    return;
  }

  await supabaseAdmin.from("meta_conversations").update({
    unread_count: (conv.unread_count ?? 0) + 1,
  }).eq("id", conv.id);

  // Insertar mensaje
  await supabaseAdmin.from("meta_messages").insert({
    owner_id: ownerId,
    conversation_id: conv.id,
    channel: msg.channel,
    direction: "inbound",
    text: msg.text,
    status: "received",
    external_message_id: msg.externalMessageId,
    raw_payload: msg.rawPayload as any,
  });

  await supabaseAdmin.from("meta_channels").update({
    last_message_at: new Date(msg.timestamp).toISOString(),
  }).eq("owner_id", ownerId).eq("channel", msg.channel);

  await supabaseAdmin.from("meta_message_logs").insert({
    owner_id: ownerId, channel: msg.channel, direction: "inbound", ok: true,
    info: { sender: msg.externalSenderId, preview: msg.text.slice(0, 80) },
  });

  // Modo de respuesta del canal
  const { data: chan } = await supabaseAdmin
    .from("meta_channels")
    .select("reply_mode")
    .eq("owner_id", ownerId)
    .eq("channel", msg.channel)
    .maybeSingle();

  if (!chan || chan.reply_mode === "manual") return;

  // Generar respuesta sugerida (acuse simple, el motor de decisión completo
  // requiere catálogo del negocio que vive en el frontend store por ahora).
  const suggested = `Hola${msg.senderName ? " " + msg.senderName.split(" ")[0] : ""} 🙌 Recibimos tu mensaje y en un momento te confirmamos los detalles para apartarlo.`;

  if (chan.reply_mode === "suggested") {
    await supabaseAdmin.from("meta_messages").insert({
      owner_id: ownerId,
      conversation_id: conv.id,
      channel: msg.channel,
      direction: "outbound",
      text: suggested,
      status: "pending",
      raw_payload: { kind: "suggested" } as any,
    });
    return;
  }

  // auto
  const sendRes = await sendViaMeta({ channel: msg.channel, to: msg.externalSenderId, message: suggested });
  await supabaseAdmin.from("meta_messages").insert({
    owner_id: ownerId,
    conversation_id: conv.id,
    channel: msg.channel,
    direction: "outbound",
    text: suggested,
    status: sendRes.ok ? "sent" : "failed",
    external_message_id: sendRes.messageId,
    raw_payload: sendRes as any,
  });
  await supabaseAdmin.from("meta_message_logs").insert({
    owner_id: ownerId, channel: msg.channel, direction: "outbound", ok: sendRes.ok,
    info: { mode: sendRes.mode, provider: sendRes.provider, error: sendRes.error },
  });
}

export const Route = createFileRoute("/api/public/webhooks/meta")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      // Verificación de Meta
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expected = process.env.META_VERIFY_TOKEN;

        if (mode === "subscribe" && expected && token === expected && challenge) {
          return new Response(challenge, { status: 200, headers: { ...CORS, "Content-Type": "text/plain" } });
        }
        return new Response("Forbidden", { status: 403, headers: CORS });
      },

      // Eventos entrantes
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "invalid_json" }, { status: 400, headers: CORS });
        }

        const messages = normalizeMetaPayload(payload);
        // Procesar en serie para mantener orden por conversación
        for (const m of messages) {
          try {
            await persistAndMaybeReply(m);
          } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error("[meta-webhook] persist error", err);
            await supabaseAdmin.from("meta_message_logs").insert({
              channel: m.channel, direction: "inbound", ok: false,
              info: { reason: "exception", error: String(err?.message ?? err) },
            });
          }
        }

        // Meta espera 200 rápido siempre
        return Response.json({ ok: true, processed: messages.length }, { status: 200, headers: CORS });
      },
    },
  },
});
