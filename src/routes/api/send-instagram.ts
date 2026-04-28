import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Endpoint stub para enviar DMs de Instagram.
 * Producción: usar Instagram Graph API (Page access token con instagram_manage_messages).
 *   POST https://graph.facebook.com/v21.0/{ig_business_id}/messages
 *     { recipient: { id: "<IGSID>" }, message: { text } }
 */
export const Route = createFileRoute("/api/send-instagram")({
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

        const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
        const IG_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

        if (!IG_TOKEN || !IG_BUSINESS_ID) {
          // Modo demo — sin credenciales reales
          return Response.json({
            ok: true,
            mode: "demo",
            messageId: `igsim_${Date.now().toString(36)}`,
          });
        }

        // TODO producción:
        // const res = await fetch(`https://graph.facebook.com/v21.0/${IG_BUSINESS_ID}/messages`, {
        //   method: "POST",
        //   headers: { Authorization: `Bearer ${IG_TOKEN}`, "Content-Type": "application/json" },
        //   body: JSON.stringify({ recipient: { id: parsed.data.userId }, message: { text: parsed.data.message } }),
        // });
        // const data = await res.json();
        // if (!res.ok) return Response.json({ ok: false, error: data?.error?.message ?? `HTTP ${res.status}` }, { status: 502 });
        // return Response.json({ ok: true, messageId: data.message_id });

        return Response.json({ ok: true, mode: "stub", messageId: `igstub_${Date.now().toString(36)}` });
      },
    },
  },
});
