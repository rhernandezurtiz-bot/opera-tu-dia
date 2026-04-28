import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook de Mercado Pago — ESQUELETO (Fase 1: simulación).
 *
 * URL pública: /api/public/webhooks/mercadopago
 *
 * En producción Mercado Pago envía notificaciones IPN/Webhook con un payload
 * tipo: { action, type, data: { id } } y firma "x-signature".
 *
 * TODO (cuando se conecten credenciales reales):
 *  1. Verificar firma "x-signature" usando MP_WEBHOOK_SECRET.
 *  2. Hacer fetch a https://api.mercadopago.com/v1/payments/{data.id} con
 *     Authorization: Bearer ${MP_ACCESS_TOKEN} para obtener el estado real.
 *  3. Mapear el campo external_reference (que contendrá el orderId de Operia)
 *     y actualizar el pedido en DB:
 *       - status === "approved"  → markPaymentPaid(orderId)
 *       - status === "rejected"  → markPaymentFailed(orderId, status_detail)
 *  4. Responder 200 OK rápido (MP reintenta si tarda > 22s).
 *
 * IMPORTANTE: las credenciales (MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET) deben
 * vivir como secrets del backend, NUNCA en frontend ni en el store.
 */
export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Stub seguro: aceptamos el ping pero no procesamos nada todavía.
        // const signature = request.headers.get("x-signature");
        // const body = await request.text();
        // TODO: verifyMercadoPagoSignature(signature, body, process.env.MP_WEBHOOK_SECRET!);

        try {
          const payload = await request.json().catch(() => ({}));
          // eslint-disable-next-line no-console
          console.log("[mp-webhook] received (stub)", {
            type: (payload as any)?.type,
            action: (payload as any)?.action,
          });
        } catch {
          // ignore body parse errors in stub
        }

        return Response.json({ ok: true, mode: "simulation" });
      },
      GET: async () => {
        // Mercado Pago hace un GET de verificación al configurar el webhook.
        return Response.json({ ok: true, provider: "mercadopago", mode: "simulation" });
      },
    },
  },
});
