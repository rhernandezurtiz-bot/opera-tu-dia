/**
 * POST /api/send-whatsapp
 * Envía un mensaje de WhatsApp desde el inbox manual.
 * FIX: conectado a sendViaMeta real (antes era stub de simulación).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendViaMeta } from "@/lib/meta-send";

const Body = z.object({
  phone:           z.string().min(7).max(20),
  message:         z.string().min(1).max(4096),
  conversation_id: z.string().uuid(),
  owner_id:        z.string().uuid().optional(),
});

export const Route = createFileRoute("/api/send-whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Validar payload
        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch (err: any) {
          return Response.json(
            { ok: false, error: "Payload inválido", details: err?.issues ?? null },
            { status: 400 }
          );
        }

        const { phone, message, conversation_id, owner_id } = parsed;
        const phoneClean = phone.replace(/\D/g, "");

        // Enviar vía Meta WhatsApp Cloud API (REAL — no simulación)
        const sendRes = await sendViaMeta({
          channel: "whatsapp",
          to:      phoneClean,
          message,
        });

        // Guardar mensaje saliente en DB
        const msgPayload = {
          owner_id:            owner_id ?? null,
          conversation_id,
          channel:             "whatsapp" as const,
          direction:           "outbound" as const,
          text:                message,
          phone:               phoneClean,
          status:              sendRes.ok ? ("sent" as const) : ("failed" as const),
          external_message_id: sendRes.messageId ?? null,
          raw_payload:         sendRes as any,
        };

        const { data: savedMsg, error: saveErr } = await supabaseAdmin
          .from("meta_messages")
          .insert(msgPayload)
          .select("id, created_at")
          .single();

        if (saveErr) {
          console.error("[send-whatsapp] error guardando mensaje:", saveErr.message);
        }

        // Actualizar preview de conversación
        await supabaseAdmin
          .from("meta_conversations")
          .update({
            last_message_at:      new Date().toISOString(),
            last_message_preview: message.slice(0, 140),
          })
          .eq("id", conversation_id);

        // Log de actividad
        await supabaseAdmin.from("meta_message_logs").insert({
          owner_id:  owner_id ?? null,
          channel:   "whatsapp",
          direction: "outbound",
          ok:        sendRes.ok,
          info: {
            kind:      "manual_send",
            mode:      sendRes.mode,
            provider:  sendRes.provider,
            messageId: sendRes.messageId,
            status:    sendRes.status,
            error:     sendRes.error,
            userError: sendRes.userError,
          },
        });

        return Response.json({
          ok:        sendRes.ok,
          mode:      sendRes.mode,
          messageId: sendRes.messageId ?? null,
          error:     sendRes.userError ?? sendRes.error ?? null,
          savedId:   savedMsg?.id ?? null,
        });
      },
    },
  },
});
