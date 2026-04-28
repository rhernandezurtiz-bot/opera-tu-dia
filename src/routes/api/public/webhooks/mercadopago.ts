import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Webhook de Mercado Pago — /api/public/webhooks/mercadopago
 *
 * FASE 1 (actual): simulación segura. Aceptamos el ping, validamos forma del
 * payload y respondemos 200. La actualización del pedido vive en el frontend
 * vía store (markPaymentPaid) hasta que se conecte una DB real.
 *
 * FASE 2 (producción): descomentar los bloques marcados TODO y conectar:
 *   - MP_ACCESS_TOKEN     → para consultar /v1/payments/{id}
 *   - MP_WEBHOOK_SECRET   → para verificar la firma "x-signature"
 *   - DB / store servidor → para persistir el pago confirmado
 *
 * Las credenciales NUNCA viven en frontend ni en el store del cliente.
 */

// Forma típica del payload IPN/Webhook v2 de Mercado Pago
const MpWebhookPayload = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),          // "payment" | "merchant_order" | ...
  action: z.string().optional(),        // "payment.created" | "payment.updated"
  data: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
  // Algunos eventos vienen con esto ya resuelto:
  external_reference: z.string().optional(),
});

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      // GET de verificación al configurar el webhook en el panel de MP
      GET: async () => {
        return Response.json({
          ok: true,
          provider: "mercadopago",
          mode: "simulation",
        });
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();

        // ───── 1. Verificación de firma ─────────────────────────────────
        // TODO (producción): habilitar verificación HMAC con MP_WEBHOOK_SECRET
        //
        // import { createHmac, timingSafeEqual } from "crypto";
        // const signature = request.headers.get("x-signature") ?? "";
        // const requestId = request.headers.get("x-request-id") ?? "";
        // const dataId    = new URL(request.url).searchParams.get("data.id") ?? "";
        // const ts        = signature.match(/ts=([^,]+)/)?.[1] ?? "";
        // const v1        = signature.match(/v1=([^,]+)/)?.[1] ?? "";
        // const manifest  = `id:${dataId};request-id:${requestId};ts:${ts};`;
        // const expected  = createHmac("sha256", process.env.MP_WEBHOOK_SECRET!)
        //   .update(manifest).digest("hex");
        // if (!v1 || !timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) {
        //   return new Response("Invalid signature", { status: 401 });
        // }

        // ───── 2. Parseo seguro del payload ─────────────────────────────
        let parsed: z.infer<typeof MpWebhookPayload> = {};
        try {
          parsed = MpWebhookPayload.parse(JSON.parse(rawBody || "{}"));
        } catch {
          // En simulación toleramos pings sin cuerpo válido.
          parsed = {};
        }

        // ───── 3. Resolver orderId ──────────────────────────────────────
        // En producción: external_reference se setea al crear la preference
        // con el ID del pedido de Operia. Aquí lo leemos directo si vino,
        // si no, habría que hacer fetch al pago para obtenerlo.
        const orderId =
          parsed.external_reference ??
          // TODO (producción):
          // const paymentId = parsed.data?.id;
          // const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          //   headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}` },
          // });
          // const payment = await res.json();
          // status === "approved" → markPaymentPaid(payment.external_reference)
          // status === "rejected" → markPaymentFailed(payment.external_reference, payment.status_detail)
          undefined;

        // eslint-disable-next-line no-console
        console.log("[mp-webhook] received", {
          type: parsed.type,
          action: parsed.action,
          dataId: parsed.data?.id,
          orderId,
        });

        // Responder 200 rápido (MP reintenta si tarda > 22s)
        return Response.json({
          ok: true,
          mode: "simulation",
          received: { type: parsed.type, action: parsed.action, orderId },
        });
      },
    },
  },
});
