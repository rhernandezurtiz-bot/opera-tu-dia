/**
 * Webhook real para WhatsApp Cloud API (Meta).
 *
 *   GET  /api/public/webhooks/whatsapp  → handshake de verificación de Meta
 *   POST /api/public/webhooks/whatsapp  → eventos entrantes (mensajes)
 *
 * Verify token: "operia123" (también acepta META_VERIFY_TOKEN si está configurado).
 *
 * URL pública para pegar en Meta:
 *   https://project--6e1e1fec-976e-41f3-a2b1-84f636c87b57.lovable.app/api/public/webhooks/whatsapp
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeMetaPayload } from "@/lib/meta-normalize";
import { persistAndMaybeReply } from "./meta";

const VERIFY_TOKEN = "operia123";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature, X-Hub-Signature-256",
};

export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      // Handshake de verificación de Meta
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const expected = process.env.META_VERIFY_TOKEN || VERIFY_TOKEN;

        if (mode === "subscribe" && token === expected && challenge) {
          return new Response(challenge, {
            status: 200,
            headers: { ...CORS, "Content-Type": "text/plain" },
          });
        }
        return new Response("Forbidden", { status: 403, headers: CORS });
      },

      // Eventos entrantes de WhatsApp
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "invalid_json" },
            { status: 400, headers: CORS },
          );
        }

        // Log raw payload siempre
        try {
          await supabaseAdmin.from("meta_message_logs").insert({
            channel: "whatsapp",
            direction: "inbound",
            ok: true,
            info: { source: "whatsapp_webhook", payload } as any,
          } as any);
        } catch {
          // no bloquear
        }
          // no bloquear
        }

        // Normalizar y procesar mensajes
        const messages = normalizeMetaPayload(payload).filter(
          (m) => m.channel === "whatsapp",
        );

        for (const m of messages) {
          try {
            await persistAndMaybeReply(m);
          } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error("[whatsapp-webhook] persist error", err);
            await supabaseAdmin.from("meta_message_logs").insert({
              channel: "whatsapp",
              direction: "inbound",
              ok: false,
              info: { reason: "exception", error: String(err?.message ?? err) },
            });
          }
        }

        // Meta exige 200 rápido
        return Response.json(
          { ok: true, processed: messages.length },
          { status: 200, headers: CORS },
        );
      },
    },
  },
});
