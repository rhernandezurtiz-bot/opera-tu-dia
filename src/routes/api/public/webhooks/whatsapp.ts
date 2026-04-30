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
import { sendViaMeta } from "@/lib/meta-send";
import {
  analyzeMessage,
  buildReplyForIntent,
  computeMissingFields,
  detectRiskLevel,
} from "@/server/order-intent.server";

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
function extractMessages(payload: any): Array<{ from: string; body: string; waId: string | null; profileName: string | null }> {
  const out: Array<{ from: string; body: string; waId: string | null; profileName: string | null }> = [];
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value ?? {};
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const msg of messages) {
        const from: string | undefined = msg?.from;
        const body: string | undefined =
          msg?.text?.body ??
          msg?.button?.text ??
          msg?.interactive?.button_reply?.title ??
          msg?.interactive?.list_reply?.title;
        const contact = contacts.find((c: any) => c?.wa_id === from) ?? contacts[0];
        const profileName: string | null = contact?.profile?.name ?? null;
        if (from && body) {
          out.push({ from: String(from), body: String(body), waId: msg?.id ?? null, profileName });
        }
      }
    }
  }
  return out;
}

async function saveMessage(from: string, body: string, waId: string | null, profileName: string | null, raw: any) {
  // 1) ¿Existe conversación para este número?
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("meta_conversations")
    .select("id, unread_count, sender_name")
    .eq("channel", "whatsapp")
    .eq("phone", from)
    .limit(1)
    .maybeSingle();

  if (findErr) {
    console.error("[whatsapp-webhook] ❌ error buscando conversación:", findErr);
  }

  let conversationId: string;
  let customerName: string | null = profileName ?? null;

  if (existing?.id) {
    conversationId = existing.id;
    customerName = profileName ?? existing.sender_name ?? null;
    const update: {
      last_message_at: string;
      last_message_preview: string;
      unread_count: number;
      sender_name?: string;
    } = {
      last_message_at: new Date().toISOString(),
      last_message_preview: body.slice(0, 140),
      unread_count: (existing.unread_count ?? 0) + 1,
    };
    if (profileName && profileName !== existing.sender_name) {
      update.sender_name = profileName;
    }
    const { error: updErr } = await supabaseAdmin
      .from("meta_conversations")
      .update(update)
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
        sender_name: profileName,
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

  // 4) Análisis de intención + extracción de campos
  const analysis = analyzeMessage(body);
  console.log("[whatsapp-webhook] 🧠 análisis:", analysis);

  // 5) Buscar canal (para reply_mode + owner)
  const { data: chan } = await supabaseAdmin
    .from("meta_channels")
    .select("reply_mode, owner_id")
    .eq("channel", "whatsapp")
    .order("owner_id", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const replyMode = chan?.reply_mode ?? "manual";
  const ownerId = chan?.owner_id ?? null;

  // 6) Si la intención es de pedido/cotización → upsert en orders
  let orderRow: { id: string; status: string } | null = null;

  if (analysis.intent === "pedido_nuevo" || analysis.intent === "cotizacion") {
    // Buscar pedido abierto reciente para esta conversación (último 24h)
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("conversation_id", conversationId)
      .not("status", "in", "(entregado,cancelado)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const merged = {
      product_requested: analysis.product_requested ?? existingOrder?.product_requested ?? null,
      quantity: analysis.quantity ?? existingOrder?.quantity ?? null,
      requested_date: analysis.requested_date ?? existingOrder?.requested_date ?? null,
      requested_time: analysis.requested_time ?? existingOrder?.requested_time ?? null,
      delivery_address: analysis.delivery_address ?? existingOrder?.delivery_address ?? null,
      delivery_mode: analysis.delivery_mode ?? existingOrder?.delivery_mode ?? null,
    };

    const missing = computeMissingFields({
      ...merged,
      phone: from,
    });

    const status = missing.length === 0 ? "por_confirmar" : "faltan_datos";
    const risk = detectRiskLevel(analysis.intent, body, missing);

    const orderPayload = {
      conversation_id: conversationId,
      customer_name: customerName,
      phone: from,
      channel: "whatsapp",
      original_message: existingOrder?.original_message
        ? `${existingOrder.original_message}\n— ${body}`
        : body,
      intent: analysis.intent,
      product_requested: merged.product_requested,
      quantity: merged.quantity,
      requested_date: merged.requested_date,
      requested_time: merged.requested_time,
      delivery_address: merged.delivery_address,
      delivery_mode: merged.delivery_mode,
      missing_fields: missing,
      risk_level: risk,
      status,
      owner_id: ownerId,
    };

    if (existingOrder?.id) {
      const { data: updated, error: updErr } = await supabaseAdmin
        .from("orders")
        .update(orderPayload)
        .eq("id", existingOrder.id)
        .select("id, status")
        .single();
      if (updErr) console.error("[whatsapp-webhook] ❌ error actualizando pedido:", updErr);
      else {
        orderRow = updated;
        console.log("PEDIDO ACTUALIZADO", { id: updated?.id, status: updated?.status, missing });
      }
    } else {
      const { data: created, error: insErr } = await supabaseAdmin
        .from("orders")
        .insert(orderPayload)
        .select("id, status")
        .single();
      if (insErr) console.error("[whatsapp-webhook] ❌ error creando pedido:", insErr);
      else {
        orderRow = created;
        console.log("PEDIDO CREADO", { id: created?.id, status: created?.status, missing });
      }
    }

    // Etiqueta en conversación
    const { data: convTags } = await supabaseAdmin
      .from("meta_conversations")
      .select("tags")
      .eq("id", conversationId)
      .single();
    const currentTags: string[] = Array.isArray(convTags?.tags) ? convTags!.tags : [];
    if (!currentTags.includes("pedido_detectado")) {
      await supabaseAdmin
        .from("meta_conversations")
        .update({ tags: [...currentTags, "pedido_detectado"] })
        .eq("id", conversationId);
    }
  }

  // 7) Generar respuesta y, si aplica, enviarla automáticamente
  try {
    // Calcular missing real (para texto contextual)
    let missingForReply: string[] = [];
    if (orderRow) {
      const { data: o } = await supabaseAdmin
        .from("orders")
        .select("missing_fields")
        .eq("id", orderRow.id)
        .single();
      missingForReply = (o?.missing_fields as string[] | null) ?? [];
    }

    const reply = buildReplyForIntent({
      intent: analysis.intent,
      customerName,
      missing: missingForReply,
    });

    // Política de envío:
    // - manual: nunca enviar (la UI propone)
    // - suggested: nunca enviar; la UI muestra propuesta
    // - auto: enviar SOLO si reply.safeToAutoSend
    const shouldAutoSend = replyMode === "auto" && reply.safeToAutoSend;

    if (!shouldAutoSend) {
      console.log("[whatsapp-webhook] ⏸️ no se auto-envía", {
        replyMode,
        intent: analysis.intent,
        safe: reply.safeToAutoSend,
      });

      // Si es ambiguo/queja en modo auto → marcar revisión humana
      if (replyMode === "auto" && !reply.safeToAutoSend && orderRow) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "requiere_revision", risk_level: "alto" })
          .eq("id", orderRow.id);
      } else if (replyMode === "auto" && !reply.safeToAutoSend && !orderRow) {
        // Crear pedido marcador para revisión humana en queja/cancelación/ambiguo
        if (analysis.intent === "queja" || analysis.intent === "cancelacion" || analysis.intent === "ambiguo") {
          await supabaseAdmin.from("orders").insert({
            conversation_id: conversationId,
            customer_name: customerName,
            phone: from,
            channel: "whatsapp",
            original_message: body,
            intent: analysis.intent,
            status: "requiere_revision",
            risk_level: "alto",
            owner_id: ownerId,
          });
        }
      }
      return;
    }

    console.log("[whatsapp-webhook] 🤖 enviando respuesta automática real");
    const sendRes = await sendViaMeta({ channel: "whatsapp", to: from, message: reply.text });
    if (!sendRes.ok) console.error("[whatsapp-webhook] ❌ envío Meta falló:", sendRes);

    await supabaseAdmin.from("meta_messages").insert({
      owner_id: ownerId,
      conversation_id: conversationId,
      channel: "whatsapp",
      direction: "outbound",
      text: reply.text,
      phone: from,
      status: sendRes.ok ? "sent" : "failed",
      external_message_id: sendRes.messageId,
      raw_payload: { kind: "auto_reply", intent: analysis.intent, ...sendRes } as any,
    });

    await supabaseAdmin
      .from("meta_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: reply.text.slice(0, 140),
      })
      .eq("id", conversationId);

    await supabaseAdmin.from("meta_message_logs").insert({
      owner_id: ownerId,
      channel: "whatsapp",
      direction: "outbound",
      ok: sendRes.ok,
      info: {
        kind: "auto_reply",
        intent: analysis.intent,
        mode: sendRes.mode,
        provider: sendRes.provider,
        messageId: sendRes.messageId,
        status: sendRes.status,
        error: sendRes.error,
        to: from,
      } as any,
    });

    console.log("AUTO-RESPUESTA", { intent: analysis.intent, ok: sendRes.ok, mode: sendRes.mode });
  } catch (err) {
    console.error("[whatsapp-webhook] ❌ excepción en respuesta:", err);
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
            await saveMessage(m.from, m.body, m.waId, m.profileName, payload);
          } catch (err) {
            console.error("[whatsapp-webhook] ❌ excepción al guardar:", err);
          }
        }

        return new Response("ok", { status: 200, headers: TEXT });
      },
    },
  },
});
