import { createFileRoute } from "@tanstack/react-router";
import { handleFacebookWebhook } from "@/lib/facebook";

/**
 * Webhook público de Facebook Messenger.
 * - GET: handshake de verificación (Meta envía hub.challenge).
 * - POST: recibe eventos. En producción se valida X-Hub-Signature-256 con APP_SECRET.
 */
export const Route = createFileRoute("/api/public/webhooks/facebook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expected = process.env.FACEBOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && expected && token === expected && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        let payload: unknown;
        try { payload = await request.json(); } catch {
          return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
        }
        // TODO producción: validar X-Hub-Signature-256 con FACEBOOK_APP_SECRET
        const messages = handleFacebookWebhook(payload);
        // eslint-disable-next-line no-console
        console.log("[fb webhook] received", messages.length, "messages");
        return Response.json({ ok: true, received: messages.length });
      },
    },
  },
});
