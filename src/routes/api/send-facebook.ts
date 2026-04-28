import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Endpoint stub para enviar mensajes por Facebook Messenger.
 * Producción: usar Messenger Send API (Page access token con pages_messaging).
 *   POST https://graph.facebook.com/v21.0/me/messages?access_token=PAGE_TOKEN
 *     { recipient: { id: "<PSID>" }, message: { text } }
 */
export const Route = createFileRoute("/api/send-facebook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const Schema = z.object({
          userId: z.string().min(1).max(64),
          message: z.string().min(1).max(2000),
        });
        let body: unknown;
        try { body = await request.json(); } catch {
          return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
        }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
        }

        const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

        if (!FB_TOKEN || !FB_PAGE_ID) {
          return Response.json({
            ok: true,
            mode: "demo",
            messageId: `fbsim_${Date.now().toString(36)}`,
          });
        }

        // TODO producción:
        // const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${FB_TOKEN}`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ recipient: { id: parsed.data.userId }, message: { text: parsed.data.message } }),
        // });
        // const data = await res.json();
        // if (!res.ok) return Response.json({ ok: false, error: data?.error?.message ?? `HTTP ${res.status}` }, { status: 502 });
        // return Response.json({ ok: true, messageId: data.message_id });

        return Response.json({ ok: true, mode: "stub", messageId: `fbstub_${Date.now().toString(36)}` });
      },
    },
  },
});
