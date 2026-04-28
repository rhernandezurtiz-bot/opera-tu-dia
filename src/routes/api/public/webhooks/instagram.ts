import { createFileRoute } from "@tanstack/react-router";
import { handleInstagramWebhook } from "@/lib/instagram";

/**
 * Webhook público de Instagram Messaging.
 * - GET: handshake de verificación (Meta envía hub.challenge).
 * - POST: recibe eventos. En producción se valida X-Hub-Signature-256 con APP_SECRET.
 */
export const Route = createFileRoute("/api/public/webhooks/instagram")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expected = process.env.INSTAGRAM_VERIFY_TOKEN;
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
        // TODO producción: validar X-Hub-Signature-256 con INSTAGRAM_APP_SECRET
        const messages = handleInstagramWebhook(payload);
        // eslint-disable-next-line no-console
        console.log("[ig webhook] received", messages.length, "messages");
        return Response.json({ ok: true, received: messages.length });
      },
    },
  },
});
