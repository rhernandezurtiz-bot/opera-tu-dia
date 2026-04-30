/**
 * Server functions para administrar la integración Meta desde el frontend.
 * Toda lectura/escritura pasa por RLS — `requireSupabaseAuth` adjunta el
 * cliente con el bearer del usuario.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendViaMeta } from "@/lib/meta-send";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const ChannelEnum = z.enum(["whatsapp", "instagram", "facebook"]);
const ReplyModeEnum = z.enum(["manual", "suggested", "auto"]);
const StatusEnum = z.enum(["no_conectado", "pendiente", "conectado", "error"]);

async function getOptionalUserScopedSupabase() {
  const authHeader = getRequest()?.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "").trim();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  return { supabase, userId };
}

// ── Listar canales del usuario (asegura que existan las 3 filas) ──────────
export const listMetaChannels = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await getOptionalUserScopedSupabase();
  if (!auth) return { channels: [] };
  const { supabase, userId } = auth;

  // Asegurar fila para cada canal (idempotente)
  for (const channel of ["whatsapp", "instagram", "facebook"] as const) {
    await supabase
      .from("meta_channels")
      .upsert(
        { owner_id: userId, channel, status: "no_conectado", reply_mode: "manual" },
        { onConflict: "owner_id,channel", ignoreDuplicates: true },
      );
  }

  const { data, error } = await supabase
    .from("meta_channels")
    .select("*")
    .eq("owner_id", userId)
    .order("channel", { ascending: true });
  if (error) throw new Error(error.message);
  return { channels: data ?? [] };
});

// ── Upsert configuración de canal ────────────────────────────────────────
export const upsertMetaChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        channel: ChannelEnum,
        connected: z.boolean().optional(),
        status: StatusEnum.optional(),
        account_label: z.string().max(255).nullable().optional(),
        external_account_id: z.string().max(255).nullable().optional(),
        reply_mode: ReplyModeEnum.optional(),
        error_message: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // leer el actual para preservar campos no enviados
    const { data: cur } = await supabase
      .from("meta_channels")
      .select("*")
      .eq("owner_id", userId)
      .eq("channel", data.channel)
      .maybeSingle();

    const next = {
      owner_id: userId,
      channel: data.channel,
      connected: data.connected ?? cur?.connected ?? false,
      status: data.status ?? cur?.status ?? "no_conectado",
      account_label:
        data.account_label !== undefined ? data.account_label : (cur?.account_label ?? null),
      external_account_id:
        data.external_account_id !== undefined
          ? data.external_account_id
          : (cur?.external_account_id ?? null),
      reply_mode: data.reply_mode ?? cur?.reply_mode ?? "manual",
      error_message:
        data.error_message !== undefined ? data.error_message : (cur?.error_message ?? null),
    };

    const { data: row, error } = await supabase
      .from("meta_channels")
      .upsert(next, { onConflict: "owner_id,channel" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { channel: row };
  });

// ── Probar conexión (mock) ───────────────────────────────────────────────
export const testMetaConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        channel: ChannelEnum,
        // Modo de simulación elegido por el usuario
        outcome: z.enum(["success", "token_error", "webhook_unverified", "auto"]).default("auto"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: cur } = await supabase
      .from("meta_channels")
      .select("*")
      .eq("owner_id", userId)
      .eq("channel", data.channel)
      .maybeSingle();

    if (!cur) throw new Error("Canal no encontrado");

    // En 'auto' decidimos según completitud de campos
    let outcome = data.outcome;
    if (outcome === "auto") {
      if (!cur.external_account_id) outcome = "webhook_unverified";
      else if (!cur.account_label) outcome = "token_error";
      else outcome = "success";
    }

    let status: "conectado" | "error" | "pendiente" = "conectado";
    let error_message: string | null = null;
    let connected = true;

    if (outcome === "token_error") {
      status = "error";
      connected = false;
      error_message =
        "Access Token inválido o expirado. Vuelve a generar el token en Meta Business Suite.";
    } else if (outcome === "webhook_unverified") {
      status = "pendiente";
      connected = false;
      error_message =
        "Webhook no verificado por Meta. Pega la URL y el Verify Token en la app de Meta.";
    }

    const { data: updated, error } = await supabase
      .from("meta_channels")
      .update({ status, connected, error_message })
      .eq("owner_id", userId)
      .eq("channel", data.channel)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("meta_message_logs").insert({
      owner_id: userId,
      channel: data.channel,
      direction: "outbound",
      ok: outcome === "success",
      info: { kind: "test_connection", outcome, error: error_message },
    });

    return { channel: updated, outcome };
  });

// ── Listar conversaciones ────────────────────────────────────────────────
// Devuelve TODAS las conversaciones (incluso sin owner_id). Usa supabaseAdmin
// para bypass de RLS — el inbox es compartido en este modo demo.
export const listMetaConversations = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("meta_conversations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[listMetaConversations] error", error);
    return { conversations: [] };
  }
  return { conversations: data ?? [] };
});

// ── Listar mensajes de una conversación ──────────────────────────────────
// No filtra por owner_id ni requiere auth de propietario; cualquier usuario
// autenticado puede leer los mensajes de cualquier conversación visible.
export const listMetaMessages = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("meta_messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[listMetaMessages] error", error);
      return { messages: [] };
    }
    return { messages: rows ?? [] };
  });

// ── Listar logs de un canal ──────────────────────────────────────────────
export const listChannelLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ channel: ChannelEnum, limit: z.number().min(1).max(200).default(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("meta_message_logs")
      .select("*")
      .eq("owner_id", userId)
      .eq("channel", data.channel)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { logs: rows ?? [] };
  });

// ── Enviar mensaje ───────────────────────────────────────────────────────
export const sendMetaMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        conversationId: z.string().uuid(),
        text: z.string().min(1).max(4096),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: conv, error: convErr } = await supabase
      .from("meta_conversations")
      .select("*")
      .eq("id", data.conversationId)
      .eq("owner_id", userId)
      .single();
    if (convErr || !conv) throw new Error("Conversación no encontrada");

    const sendRes = await sendViaMeta({
      channel: conv.channel,
      to: conv.external_sender_id,
      message: data.text,
    });

    const { data: msg, error: msgErr } = await supabase
      .from("meta_messages")
      .insert({
        owner_id: userId,
        conversation_id: conv.id,
        channel: conv.channel,
        direction: "outbound",
        text: data.text,
        status: sendRes.ok ? "sent" : "failed",
        external_message_id: sendRes.messageId,
        raw_payload: sendRes as any,
      })
      .select("*")
      .single();
    if (msgErr) throw new Error(msgErr.message);

    await supabase
      .from("meta_channels")
      .update({ last_outbound_at: new Date().toISOString() })
      .eq("owner_id", userId)
      .eq("channel", conv.channel);

    await supabase.from("meta_message_logs").insert({
      owner_id: userId,
      channel: conv.channel,
      direction: "outbound",
      ok: sendRes.ok,
      info: {
        mode: sendRes.mode,
        provider: sendRes.provider,
        error: sendRes.error,
        preview: data.text.slice(0, 80),
      },
    });

    return { ok: sendRes.ok, mode: sendRes.mode, message: msg };
  });

// ── Marcar conversación como leída ───────────────────────────────────────
export const markConversationRead = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("meta_conversations")
      .update({ unread_count: 0 })
      .eq("id", data.conversationId);
    if (error) {
      console.error("[markConversationRead] error:", error);
      return { ok: false };
    }
    return { ok: true };
  });

// ── Simular mensaje entrante (mismo flujo que el webhook) ────────────────
export const simulateInboundMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        channel: ChannelEnum,
        senderName: z.string().min(1).max(120),
        senderId: z.string().min(1).max(120).optional(),
        text: z.string().min(1).max(4096),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const senderId = data.senderId ?? `sim_${data.senderName.toLowerCase().replace(/\s+/g, "_")}`;
    const now = new Date().toISOString();

    // Upsert conversación
    const { data: conv, error: convErr } = await supabaseAdmin
      .from("meta_conversations")
      .upsert(
        {
          owner_id: userId,
          channel: data.channel,
          external_conversation_id: senderId,
          external_sender_id: senderId,
          sender_name: data.senderName,
          last_message_at: now,
          last_message_preview: data.text.slice(0, 140),
        },
        { onConflict: "owner_id,channel,external_conversation_id" },
      )
      .select("id, unread_count")
      .single();
    if (convErr || !conv) throw new Error(convErr?.message ?? "No se pudo crear la conversación");

    await supabaseAdmin
      .from("meta_conversations")
      .update({ unread_count: (conv.unread_count ?? 0) + 1 })
      .eq("id", conv.id);

    await supabaseAdmin.from("meta_messages").insert({
      owner_id: userId,
      conversation_id: conv.id,
      channel: data.channel,
      direction: "inbound",
      text: data.text,
      status: "received",
      raw_payload: { simulated: true, senderName: data.senderName } as any,
    });

    await supabaseAdmin
      .from("meta_channels")
      .update({ last_message_at: now })
      .eq("owner_id", userId)
      .eq("channel", data.channel);

    await supabaseAdmin.from("meta_message_logs").insert({
      owner_id: userId,
      channel: data.channel,
      direction: "inbound",
      ok: true,
      info: { kind: "simulated", sender: data.senderName, preview: data.text.slice(0, 80) },
    });

    // Modo de respuesta del canal
    const { data: chan } = await supabaseAdmin
      .from("meta_channels")
      .select("reply_mode")
      .eq("owner_id", userId)
      .eq("channel", data.channel)
      .maybeSingle();

    if (!chan || chan.reply_mode === "manual") {
      return { conversationId: conv.id, mode: "manual" as const };
    }

    const suggested = `Hola ${data.senderName.split(" ")[0]} 🙌 Recibimos tu mensaje y te confirmamos los detalles para apartarlo.`;

    if (chan.reply_mode === "suggested") {
      await supabaseAdmin.from("meta_messages").insert({
        owner_id: userId,
        conversation_id: conv.id,
        channel: data.channel,
        direction: "outbound",
        text: suggested,
        status: "pending",
        raw_payload: { kind: "suggested" } as any,
      });
      await supabaseAdmin.from("meta_message_logs").insert({
        owner_id: userId,
        channel: data.channel,
        direction: "outbound",
        ok: true,
        info: { kind: "suggested_generated", preview: suggested.slice(0, 80) },
      });
      return { conversationId: conv.id, mode: "suggested" as const, suggested };
    }

    // auto
    const sendRes = await sendViaMeta({ channel: data.channel, to: senderId, message: suggested });
    await supabaseAdmin.from("meta_messages").insert({
      owner_id: userId,
      conversation_id: conv.id,
      channel: data.channel,
      direction: "outbound",
      text: suggested,
      status: sendRes.ok ? "sent" : "failed",
      external_message_id: sendRes.messageId,
      raw_payload: sendRes as any,
    });
    await supabaseAdmin
      .from("meta_channels")
      .update({ last_outbound_at: new Date().toISOString() })
      .eq("owner_id", userId)
      .eq("channel", data.channel);
    await supabaseAdmin.from("meta_message_logs").insert({
      owner_id: userId,
      channel: data.channel,
      direction: "outbound",
      ok: sendRes.ok,
      info: {
        kind: "auto_reply",
        mode: sendRes.mode,
        provider: sendRes.provider,
        error: sendRes.error,
      },
    });

    return { conversationId: conv.id, mode: "auto" as const, suggested };
  });
