import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * POST /api/send-message — endpoint UNIFICADO multicanal (stub).
 *
 * Cuerpo: { canal: "whatsapp"|"instagram"|"facebook", to: string, message: string }
 *
 * Hoy: valida y devuelve respuesta simulada (provider=null).
 *
 * Para producción, despachar al proveedor del canal:
 *  - whatsapp  → Meta WhatsApp Cloud API o Twilio (ver /api/send-whatsapp)
 *  - instagram → Meta Graph API /me/messages (ver /api/send-instagram)
 *  - facebook  → Meta Graph API Messenger (ver /api/send-facebook)
 *
 * Mantener un solo endpoint público facilita la auditoría y el rate-limit.
 */

const Body = z.object({
  canal: z.enum(["whatsapp", "instagram", "facebook"]),
  to: z.string().min(1).max(64),
  message: z.string().min(1).max(4096),
});

export const Route = createFileRoute("/api/send-message")({
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

        // eslint-disable-next-line no-console
        console.log("[/api/send-message] (stub) →", {
          canal: parsed.canal,
          to: parsed.to,
          preview: parsed.message.slice(0, 80),
        });

        return Response.json({
          ok: true,
          mode: "simulation",
          canal: parsed.canal,
          provider: null,
          messageId: `sim_${Date.now().toString(36)}`,
          sentAt: Date.now(),
        });
      },
    },
  },
});
