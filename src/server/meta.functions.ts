/**
 * Server functions para administrar la integración Meta desde el frontend.
 * Toda lectura/escritura pasa por RLS — `requireSupabaseAuth` adjunta el
 * cliente con el bearer del usuario.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendViaMeta } from "@/lib/meta-send";

const ChannelEnum = z.enum(["whatsapp", "instagram", "facebook"]);
const ReplyModeEnum = z.enum(["manual", "suggested", "auto"]);

// ── Listar canales del usuario ────────────────────────────────────────────
export const listMetaChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("meta_channels")
      .select("*")
      .eq("owner_id", userId)
      .order("channel", { ascending: true });
    if (error) throw new Error(error.message);
    return { channels: data ?? [] };
  });

// ── Upsert de un canal (conectar / actualizar modo / cambiar cuenta) ──────
export const upsertMetaChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      channel: ChannelEnum,
      connected: z.boolean().optional(),
      account_label: z.string().max(255).nullable().optional(),
      external_account_id: z.string().max(255).nullable().optional(),
      reply_mode: ReplyModeEnum.optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("meta_channels")
      .upsert(
        {
          owner_id: userId,
          channel: data.channel,
          connected: data.connected ?? false,
          account_label: data.account_label ?? null,
          external_account_id: data.external_account_id ?? null,
          reply_mode: data.reply_mode ?? "manual",
        },
        { onConflict: "owner_id,channel" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { channel: row };
  });

// ── Listar conversaciones ────────────────────────────────────────────────
export const listMetaConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("meta_conversations")
      .select("*")
      .eq("owner_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { conversations: data ?? [] };
  });

// ── Listar mensajes de una conversación ──────────────────────────────────
export const listMetaMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("meta_messages")
      .select("*")
      .eq("owner_id", userId)
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

// ── Enviar mensaje (registra y dispara envío real si hay token) ──────────
export const sendMetaMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      conversationId: z.string().uuid(),
      text: z.string().min(1).max(4096),
    }).parse(input),
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

    await supabase.from("meta_message_logs").insert({
      owner_id: userId, channel: conv.channel, direction: "outbound", ok: sendRes.ok,
      info: { mode: sendRes.mode, provider: sendRes.provider, error: sendRes.error },
    });

    return { ok: sendRes.ok, mode: sendRes.mode, message: msg };
  });

// ── Marcar conversación como leída ───────────────────────────────────────
export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("meta_conversations")
      .update({ unread_count: 0 })
      .eq("id", data.conversationId)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
