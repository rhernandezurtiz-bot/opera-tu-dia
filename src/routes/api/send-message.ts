import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendViaMeta } from "@/lib/meta-send";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * POST /api/send-message — endpoint unificado multicanal.
 * Despacha al canal Meta correspondiente y registra en meta_message_logs.
 *
 * Cuerpo: { canal, to, message, ownerId? }
 *
 * Nota de seguridad: este endpoint NO está bajo /api/public/, requiere ser
 * llamado con el bearer del usuario autenticado por el front. Para flujos de
 * envío server-side se prefiere `sendMetaMessage` (server function).
 */

const Body = z.object({
  canal: z.enum(["whatsapp", "instagram", "facebook"]),
  to: z.string().min(1).max(64),
  message: z.string().min(1).max(4096),
  ownerId: z.string().uuid().optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/send-message")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (err: any) {
          return Response.json(
            { ok: false, error: "Invalid payload", details: err?.issues ?? null },
            { status: 400, headers: CORS },
          );
        }

        const result = await sendViaMeta({
          channel: parsed.canal,
          to: parsed.to,
          message: parsed.message,
        });

        // Log mejor esfuerzo (sin owner si no se pasó)
        try {
          await supabaseAdmin.from("meta_message_logs").insert({
            owner_id: parsed.ownerId ?? null,
            channel: parsed.canal,
            direction: "outbound",
            ok: result.ok,
            info: { mode: result.mode, provider: result.provider, to: parsed.to, preview: parsed.message.slice(0, 80), error: result.error },
          });
        } catch {/* no romper la respuesta por un fallo de log */}

        return Response.json(
          {
            ok: result.ok,
            mode: result.mode,
            provider: result.provider,
            messageId: result.messageId,
            error: result.error,
            sentAt: Date.now(),
          },
          { status: result.ok ? 200 : 502, headers: CORS },
        );
      },
    },
  },
});
