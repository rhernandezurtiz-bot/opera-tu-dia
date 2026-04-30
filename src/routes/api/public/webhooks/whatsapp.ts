/**
 * Webhook PÚBLICO para WhatsApp Cloud API (Meta).
 *
 *   GET  /api/public/webhooks/whatsapp  → handshake (devuelve hub.challenge)
 *   POST /api/public/webhooks/whatsapp  → guarda cada mensaje en Supabase
 *
 * Usa supabaseAdmin (service role) → bypass RLS, sin auth de usuario.
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const VERIFY_TOKEN = "operia123";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature, X-Hub-Signature-256",
} as const;
const TEXT = { "Content-Type": "text/plain; charset=utf-8", ...CORS };

/**
 * Recorre el payload de WhatsApp Cloud API y devuelve [{ from, body }, ...]
 */
function extractMessages(payload: any): Array<{ from: string; body: string; waId: string | null }> {
  const out: Array<{ from: string; body: string; waId: string | null }> = [];
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];
      for (const msg of messages) {
        const from: string | undefined = msg?.from;
        const body: string | undefined =
          msg?.text?.body ??
          msg?.button?.text ??
          msg?.interactive?.button_reply?.title ??
          msg?.interactive?.list_reply?.title;
        if (from && body) {
          out.push({ from: String(from), body: String(body), waId: msg?.id ?? null });
        }
      }
    }
  }
  return out;
}

async function saveMessage(from: string, body: string, waId: string | null, raw: any) {
  // 1) ¿Existe conversación para este número?
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("meta_conversations")
    .select("id, unread_count")
    .eq("channel", "whatsapp")
    .eq("phone", from)
    .limit(1)
    .maybeSingle();

  if (findErr) {
    console.error("[whatsapp-webhook] ❌ error buscando conversación:", findErr);
  }

  let conversationId: string;

  if (existing?.id) {
    conversationId = existing.id;
    const { error: updErr } = await supabaseAdmin
      .from("meta_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 140),
        unread_count: (existing.unread_count ?? 0) + 1,
      })
      .eq("id", existing.id);
    if (updErr) console.error("[whatsapp-webhook] ❌ error actualizando conversación:", updErr);
    console.log("[whatsapp-webhook] ✓ conversación existente reutilizada:", conversationId);
  } else {
    // 2) Crear nueva conversación
    const { data: created, error: createErr } = await supabaseAdmin
      .from("meta_conversations")
      .insert({
        channel: "whatsapp",
        phone: from,
        external_conversation_id: from,
        external_sender_id: from,
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 140),
        unread_count: 1,
      })
      .select("id")
      .single();

    if (createErr || !created) {
      console.error("[whatsapp-webhook] ❌ error creando conversación:", createErr);
      return;
    }
    conversationId = created.id;
    console.log("[whatsapp-webhook] ✓ conversación nueva creada:", conversationId);
  }

  // 3) Insertar mensaje
  const { data: inserted, error: msgErr } = await supabaseAdmin
    .from("meta_messages")
    .insert({
      conversation_id: conversationId,
      channel: "whatsapp",
      direction: "inbound",
      status: "received",
      phone: from,
      text: body,
      external_message_id: waId,
      raw_payload: raw,
    })
    .select("id, created_at")
    .single();

  if (msgErr) {
    console.error("[whatsapp-webhook] ❌ error insertando mensaje:", msgErr);
    return;
  }

  console.log("MENSAJE GUARDADO", {
    id: inserted?.id,
    phone: from,
    body,
    created_at: inserted?.created_at,
    conversationId,
  });

  // 4) Detección automática de "pedido"
  if (/\bpedido(s)?\b/i.test(body)) {
    console.log("[whatsapp-webhook] 🛒 palabra 'pedido' detectada → creando pedido + etiqueta");

    // 4a) Crear pedido
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        conversation_id: conversationId,
        phone: from,
        channel: "whatsapp",
        source_message_text: body,
        status: "nuevo",
      })
      .select("id")
      .single();

    if (orderErr) {
      console.error("[whatsapp-webhook] ❌ error creando pedido:", orderErr);
    } else {
      console.log("PEDIDO CREADO", { id: order?.id, phone: from, conversationId });
    }

    // 4b) Etiquetar conversación (añadir 'pedido_detectado' sin duplicar)
    const { data: convTags } = await supabaseAdmin
      .from("meta_conversations")
      .select("tags")
      .eq("id", conversationId)
      .single();

    const currentTags: string[] = Array.isArray(convTags?.tags) ? convTags!.tags : [];
    if (!currentTags.includes("pedido_detectado")) {
      const { error: tagErr } = await supabaseAdmin
        .from("meta_conversations")
        .update({ tags: [...currentTags, "pedido_detectado"] })
        .eq("id", conversationId);
      if (tagErr) console.error("[whatsapp-webhook] ❌ error etiquetando conversación:", tagErr);
      else console.log("[whatsapp-webhook] 🏷️ conversación etiquetada 'pedido_detectado'");
    }
  }
}

export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 200, headers: { ...CORS } }),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
          return new Response(challenge, { status: 200, headers: TEXT });
        }
        return new Response("", { status: 200, headers: TEXT });
      },

      POST: async ({ request }) => {
        let payload: any = null;
        try {
          payload = await request.json();
        } catch (e) {
          console.error("[whatsapp-webhook] ❌ JSON inválido:", e);
          return new Response("ok", { status: 200, headers: TEXT });
        }

        console.log("[whatsapp-webhook] 📥 PAYLOAD RECIBIDO:", JSON.stringify(payload));

        const messages = extractMessages(payload);
        console.log(`[whatsapp-webhook] → ${messages.length} mensaje(s) detectado(s)`);

        for (const m of messages) {
          try {
            await saveMessage(m.from, m.body, m.waId, payload);
          } catch (err) {
            console.error("[whatsapp-webhook] ❌ excepción al guardar:", err);
          }
        }

        return new Response("ok", { status: 200, headers: TEXT });
      },
    },
  },
});
