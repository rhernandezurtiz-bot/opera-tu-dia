import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * POST /api/send-whatsapp  — ESQUELETO (no conectado todavía).
 *
 * Cuerpo esperado: { phone: string (E.164), message: string }
 *
 * Hoy: valida payload y devuelve respuesta simulada. NO envía nada.
 *
 * Para activar en producción, elegir UNA de las dos rutas:
 *
 *  ── Opción A) Meta WhatsApp Cloud API ────────────────────────────────────
 *     Secrets requeridos (backend, NUNCA en frontend):
 *       - META_WHATSAPP_TOKEN
 *       - META_WHATSAPP_PHONE_NUMBER_ID
 *
 *     const res = await fetch(
 *       `https://graph.facebook.com/v20.0/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
 *       {
 *         method: "POST",
 *         headers: {
 *           Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
 *           "Content-Type": "application/json",
 *         },
 *         body: JSON.stringify({
 *           messaging_product: "whatsapp",
 *           to: phone,
 *           type: "text",
 *           text: { body: message },
 *         }),
 *       },
 *     );
 *
 *  ── Opción B) Twilio (vía connector gateway de Lovable) ──────────────────
 *     Secrets requeridos:
 *       - LOVABLE_API_KEY (provisto por Lovable)
 *       - TWILIO_API_KEY  (provisto al conectar el connector Twilio)
 *
 *     const res = await fetch(
 *       "https://connector-gateway.lovable.dev/twilio/Messages.json",
 *       {
 *         method: "POST",
 *         headers: {
 *           Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
 *           "X-Connection-Api-Key": process.env.TWILIO_API_KEY!,
 *           "Content-Type": "application/x-www-form-urlencoded",
 *         },
 *         body: new URLSearchParams({
 *           To: `whatsapp:${phone}`,
 *           From: "whatsapp:+14155238886", // sandbox o número WhatsApp aprobado
 *           Body: message,
 *         }),
 *       },
 *     );
 *
 *  En ambos casos: parsear la respuesta, devolver { ok, messageId } al front.
 */

const Body = z.object({
  phone: z.string().min(6).max(32),
  message: z.string().min(1).max(4096),
});

export const Route = createFileRoute("/api/send-whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (err: any) {
          return Response.json(
            { ok: false, error: "Invalid payload", details: err?.issues ?? null },
            { status: 400 },
          );
        }

        const phoneClean = parsed.phone.replace(/\D/g, "");

        // eslint-disable-next-line no-console
        console.log("[/api/send-whatsapp] (stub) →", {
          phone: phoneClean,
          preview: parsed.message.slice(0, 80),
        });

        return Response.json({
          ok: true,
          mode: "simulation",
          provider: null, // "twilio" | "meta_cloud" cuando se conecte
          messageId: `sim_${Date.now().toString(36)}`,
          sentAt: Date.now(),
        });
      },
    },
  },
});
