/**
 * Webhook PÚBLICO para WhatsApp Cloud API (Meta).
 *
 *   GET  /api/public/webhooks/whatsapp  → handshake (devuelve hub.challenge en texto plano)
 *   POST /api/public/webhooks/whatsapp  → eventos entrantes (siempre 200)
 *
 * Verify token: "operia123"
 *
 * IMPORTANTE: este endpoint es totalmente público. NO requiere sesión,
 * cookies ni headers de autenticación. Meta nunca envía credenciales.
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeMetaPayload } from "@/lib/meta-normalize";
import { persistAndMaybeReply } from "./meta";

const VERIFY_TOKEN = "operia123";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature, X-Hub-Signature-256",
  "Access-Control-Max-Age": "86400",
} as const;

export const Route = createFileRoute("/api/public/webhooks/whatsapp")({
  server: {
    handlers: {
      // Preflight CORS — público, sin auth
      OPTIONS: async () => {
        return new Response(null, { status: 200, headers: { ...CORS_HEADERS } });
      },

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
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              ...CORS_HEADERS,
            },
          });
        }
        return new Response("forbidden", {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS },
        });
      },

      // Eventos entrantes de WhatsApp — siempre devolvemos 200 OK
      POST: async ({ request }) => {
        let payload: unknown = null;
        try {
          payload = await request.json();
        } catch {
          // Meta espera 200 rápido aunque el body sea inválido
          return new Response("ok", {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS },
          });
        }

        // Log raw payload (best-effort)
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

        try {
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
        } catch (err) {
          console.error("[whatsapp-webhook] normalize error", err);
        }

        // Meta exige 200 rápido siempre
        return new Response("ok", {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS },
        });
      },
    },
  },
});
