/**
 * Webhook PÚBLICO para WhatsApp Cloud API (Meta).
 * GET  → handshake (devuelve hub.challenge)
 * POST → guarda cada mensaje en Supabase (responde 200 inmediato, procesa async)
 *
 * FIXES v2: VERIFY_TOKEN env, HMAC validation, async 200, owner_id,
 *           idempotencia wamid, guard no-texto, limite 24h pedidos, GET 403
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

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "operia_webhook";
const APP_SECRET   = process.env.WHATSAPP_APP_SECRET ?? "";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature-256",
} as const;
const TEXT = { "Content-Type": "text/plain; charset=utf-8", ...CORS };
const ok200 = () => new Response("ok", { status: 200, headers: TEXT });

async function validateHmac(request: Request, rawBody: string): Promise<boolean> {
  if (!APP_SECRET) {
    console.warn("[webhook] WHATSAPP_APP_SECRET no configurado — omitiendo HMAC");
    return true;
  }
  const sig = request.headers.get("x-hub-signature-256");
  if (!sig) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(APP_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const expected = "sha256=" + Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    return sig === expected;
  } catch { return false; }
}

function extractMessages(payload: any): Array<{
  from: string; body: string; waId: string | null;
  profileName: string | null; messageType: string; rawMsg: any;
}> {
  const out: ReturnType<typeof extractMessages> = [];
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      if (messages.length === 0) continue;
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      for (const msg of messages) {
        const from    = String(msg?.from ?? "");
        const msgType = String(msg?.type ?? "text");
        let body: string;
        if (msgType === "text") {
          body = String(msg?.text?.body ?? "");
        } else if (msgType === "button") {
          body = String(msg?.button?.text ?? `[${msgType}]`);
        } else if (msgType === "interactive") {
          body = String(
            msg?.interactive?.button_reply?.title ??
            msg?.interactive?.list_reply?.title ??
            "[interactive]"
          );
        } else {
          body = `[${msgType}]`;
        }
        const contact     = contacts.find((c: any) => c?.wa_id === from) ?? null;
        const profileName = contact?.profile?.name ?? null;
        const waId        = msg?.id ?? null;
        if (!from) continue;
        out.push({ from, body, waId, profileName, messageType: msgType, rawMsg: msg });
      }
    }
  }
  return out;
}

async function resolveOwnerId(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("meta_channels").select("owner_id")
    .eq("channel", "whatsapp").eq("connected", true)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  return data?.owner_id ?? null;
}

async function processMessage(
  from: string, body: string, waId: string | null,
  profileName: string | null, messageType: string,
  rawMsg: any, ownerId: string | null,
): Promise<void> {
  // 1) Idempotencia
  if (waId) {
    const { data: dup } = await supabaseAdmin
      .from("meta_messages").select("id")
      .eq("external_message_id", waId).maybeSingle();
    if (dup) {
      console.log(`[webhook] duplicado ignorado wamid=${waId.slice(-8)}`);
      return;
    }
  }

  // 2) Buscar o crear conversacion
  const { data: conv, error: convErr } = await supabaseAdmin
    .from("meta_conversations").select("id, unread_count, sender_name")
    .eq("channel", "whatsapp").eq("phone", from).maybeSingle();
  if (convErr) console.error("[webhook] buscando conv:", convErr.message);

  let conversationId: string;
  let customerName: string | null = profileName;

  if (conv) {
    conversationId = conv.id;
    customerName   = profileName ?? conv.sender_name ?? null;
    const upd: Record<string, unknown> = {
      last_message_at:      new Date().toISOString(),
      last_message_preview: body.slice(0, 140),
      unread_count:         (conv.unread_count ?? 0) + 1,
    };
    if (profileName && profileName !== conv.sender_name) upd.sender_name = profileName;
    await supabaseAdmin.from("meta_conversations").update(upd).eq("id", conversationId);
  } else {
    const { data: created, error: createErr } = await supabaseAdmin
      .from("meta_conversations")
      .upsert({
        owner_id: ownerId, channel: "whatsapp", phone: from,
        external_conversation_id: from, external_sender_id: from,
        sender_name: profileName, last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 140), unread_count: 1,
      }, { onConflict: "owner_id,channel,external_conversation_id", ignoreDuplicates: false })
      .select("id").single();
    if (createErr || !created) {
      console.error("[webhook] creando conv:", createErr?.message); return;
    }
    conversationId = created.id;
    console.log("[webhook] conv nueva:", conversationId);
  }

  // 3) Insertar mensaje (upsert por wamid)
  const { data: inserted, error: msgErr } = await supabaseAdmin
    .from("meta_messages")
    .upsert({
      owner_id: ownerId, conversation_id: conversationId,
      channel: "whatsapp", direction: "inbound", status: "received",
      phone: from, text: body, external_message_id: waId,
      raw_payload: { type: messageType, ...rawMsg },
    }, { onConflict: "external_message_id", ignoreDuplicates: true })
    .select("id, created_at").maybeSingle();
  if (msgErr) { console.error("[webhook] insertando msg:", msgErr.message); return; }
  console.log(`[webhook] guardado type=${messageType}`);

  // 4) Solo analizar texto
  if (messageType !== "text" || !body.trim()) return;

  const analysis = analyzeMessage(body);
  const { data: chan } = await supabaseAdmin
    .from("meta_channels").select("reply_mode, owner_id")
    .eq("channel", "whatsapp")
    .order("owner_id", { ascending: true, nullsFirst: false })
    .limit(1).maybeSingle();
  const replyMode = chan?.reply_mode ?? "manual";
  const chanOwner = chan?.owner_id ?? ownerId;

  // 5) Pedido / cotizacion
  let orderRow: { id: string; status: string } | null = null;
  if (analysis.intent === "pedido_nuevo" || analysis.intent === "cotizacion") {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingOrder } = await supabaseAdmin
      .from("orders").select("*").eq("conversation_id", conversationId)
      .not("status", "in", "(entregado,cancelado)").gte("created_at", cutoff)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const merged = {
      product_requested: analysis.product_requested ?? existingOrder?.product_requested ?? null,
      quantity:          analysis.quantity          ?? existingOrder?.quantity          ?? null,
      requested_date:    analysis.requested_date    ?? existingOrder?.requested_date    ?? null,
      requested_time:    analysis.requested_time    ?? existingOrder?.requested_time    ?? null,
      delivery_address:  analysis.delivery_address  ?? existingOrder?.delivery_address  ?? null,
      delivery_mode:     analysis.delivery_mode     ?? existingOrder?.delivery_mode     ?? null,
    };
    const missing = computeMissingFields({ ...merged, phone: from });
    const status  = missing.length === 0 ? "por_confirmar" : "faltan_datos";
    const risk    = detectRiskLevel(analysis.intent, body, missing);
    const orderPayload = {
      owner_id: chanOwner, conversation_id: conversationId, customer_name: customerName,
      phone: from, channel: "whatsapp",
      original_message: existingOrder?.original_message
        ? `${existingOrder.original_message}\n— ${body}` : body,
      intent: analysis.intent, ...merged, missing_fields: missing, risk_level: risk, status,
    };
    if (existingOrder) {
      const { data: upd } = await supabaseAdmin.from("orders")
        .update(orderPayload).eq("id", existingOrder.id).select("id, status").single();
      orderRow = upd;
    } else {
      const { data: ins } = await supabaseAdmin.from("orders")
        .insert(orderPayload).select("id, status").single();
      orderRow = ins;
    }
    console.log(`[webhook] pedido: ${orderRow?.status}`);
    const { data: convData } = await supabaseAdmin
      .from("meta_conversations").select("tags").eq("id", conversationId).single();
    const tags: string[] = Array.isArray(convData?.tags) ? convData!.tags : [];
    if (!tags.includes("pedido_detectado")) {
      await supabaseAdmin.from("meta_conversations")
        .update({ tags: [...tags, "pedido_detectado"] }).eq("id", conversationId);
    }
  }

  // 6) Respuesta automatica
  try {
    let missingForReply: string[] = [];
    let orderForReply: {
      product_requested: string | null; requested_date: string | null;
      requested_time: string | null; delivery_mode: string | null;
    } | undefined;
    if (orderRow) {
      const { data: ord } = await supabaseAdmin.from("orders")
        .select("missing_fields, product_requested, requested_date, requested_time, delivery_mode")
        .eq("id", orderRow.id).single();
      if (ord) {
        missingForReply = ord.missing_fields ?? [];
        orderForReply = { product_requested: ord.product_requested,
          requested_date: ord.requested_date, requested_time: ord.requested_time,
          delivery_mode: ord.delivery_mode };
      }
    }
    const reply = buildReplyForIntent({
      intent: analysis.intent, customerName, missing: missingForReply, order: orderForReply,
    });
    const shouldAutoSend = replyMode === "auto" && reply.safeToAutoSend;

    if (!shouldAutoSend) {
      if (inserted) {
        await supabaseAdmin.from("meta_messages")
          .update({ decision: { suggested_reply: reply.text, intent: analysis.intent } })
          .eq("id", inserted.id);
      }
      if (replyMode === "auto" && !reply.safeToAutoSend && orderRow) {
        await supabaseAdmin.from("orders")
          .update({ status: "requiere_revision", risk_level: "alto" }).eq("id", orderRow.id);
      }
      if (replyMode === "auto" && !reply.safeToAutoSend && !orderRow &&
          ["queja", "cancelacion", "ambiguo"].includes(analysis.intent)) {
        await supabaseAdmin.from("orders").insert({
          owner_id: chanOwner, conversation_id: conversationId, customer_name: customerName,
          phone: from, channel: "whatsapp", original_message: body,
          intent: analysis.intent, status: "requiere_revision", risk_level: "alto",
        });
      }
      return;
    }

    const sendRes = await sendViaMeta({ channel: "whatsapp", to: from, message: reply.text });
    await supabaseAdmin.from("meta_messages").insert({
      owner_id: chanOwner, conversation_id: conversationId, channel: "whatsapp",
      direction: "outbound", text: reply.text, phone: from,
      status: sendRes.ok ? "sent" : "failed", external_message_id: sendRes.messageId,
      raw_payload: { kind: "auto_reply", intent: analysis.intent, ...sendRes } as any,
    });
    await supabaseAdmin.from("meta_conversations").update({
      last_message_at: new Date().toISOString(), last_message_preview: reply.text.slice(0, 140),
    }).eq("id", conversationId);
    await supabaseAdmin.from("meta_message_logs").insert({
      owner_id: chanOwner, channel: "whatsapp", direction: "outbound", ok: sendRes.ok,
      info: { kind: "auto_reply", intent: analysis.intent, mode: sendRes.mode,
              provider: sendRes.provider, messageId: sendRes.messageId,
              status: sendRes.status, error: sendRes.error },
    });
    console.log(`[webhook] auto-reply ok=${sendRes.ok}`);
  } catch (err) {
    console.error("[webhook] excepcion respuesta:", (err as Error).message);
  }
}

export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 200, headers: { ...CORS } }),

      GET: async ({ request }) => {
        const url       = new URL(request.url);
        const mode      = url.searchParams.get("hub.mode");
        const token     = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
          console.log("[webhook] handshake OK");
          return new Response(challenge, { status: 200, headers: TEXT });
        }
        console.warn(`[webhook] handshake fallido mode=${mode}`);
        return new Response("Forbidden", { status: 403, headers: TEXT });
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();
        const valid = await validateHmac(request, rawBody);
        if (!valid) {
          console.warn("[webhook] HMAC invalido — rechazado");
          return new Response("Forbidden", { status: 403, headers: TEXT });
        }
        let payload: any = null;
        try { payload = JSON.parse(rawBody); }
        catch { console.error("[webhook] JSON invalido"); return ok200(); }

        const messages = extractMessages(payload);
        console.log(`[webhook] ${messages.length} mensaje(s)`);

        // Responder 200 inmediatamente — procesar en background
        const responsePromise = ok200();
        ;(async () => {
          try {
            const ownerId = await resolveOwnerId();
            for (const { from, body, waId, profileName, messageType, rawMsg } of messages) {
              try {
                await processMessage(from, body, waId, profileName, messageType, rawMsg, ownerId);
              } catch (err) {
                console.error("[webhook] error msg:", (err as Error).message);
              }
            }
          } catch (err) {
            console.error("[webhook] error batch:", (err as Error).message);
          }
        })();
        return responsePromise;
      },
    },
  },
});
