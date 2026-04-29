/**
 * Webhook real para WhatsApp Cloud API (Meta).
 *
 *   GET  /api/public/webhooks/whatsapp  → handshake (devuelve hub.challenge en texto plano)
 *   POST /api/public/webhooks/whatsapp  → eventos entrantes
 *
 * Verify token: "operia123"
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeMetaPayload } from "@/lib/meta-normalize";
import { persistAndMaybeReply } from "./meta";

const VERIFY_TOKEN = "operia123";

export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      // Handshake de verificación de Meta
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
          // Texto puro, sin JSON, sin envoltura
          return new Response(challenge, {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
        return new Response(null, { status: 403 });
      },

      // Eventos entrantes de WhatsApp
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response("invalid_json", { status: 400 });
        }

        // Log raw payload
        try {
          await (supabaseAdmin.from("meta_message_logs") as any).insert({
            channel: "whatsapp",
            direction: "inbound",
            ok: true,
            info: { source: "whatsapp_webhook", payload },
          });
        } catch {
          // no bloquear si falla el log
        }

        const messages = normalizeMetaPayload(payload).filter(
          (m) => m.channel === "whatsapp",
        );

        for (const m of messages) {
          try {
            await persistAndMaybeReply(m);
          } catch (err: any) {
            console.error("[whatsapp-webhook] persist error", err);
            try {
              await (supabaseAdmin.from("meta_message_logs") as any).insert({
                channel: "whatsapp",
                direction: "inbound",
                ok: false,
                info: { reason: "exception", error: String(err?.message ?? err) },
              });
            } catch {
              // ignore
            }
          }
        }

        // Meta exige 200 rápido
        return new Response("ok", { status: 200 });
      },
    },
  },
});
