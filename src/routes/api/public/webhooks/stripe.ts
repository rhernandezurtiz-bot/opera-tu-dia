import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook de Stripe — ESQUELETO (Fase 1: simulación).
 *
 * URL pública: /api/public/webhooks/stripe
 *
 * En producción Stripe envía eventos firmados con header "stripe-signature".
 *
 * TODO (cuando se conecten credenciales reales):
 *  1. Verificar firma con stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET).
 *  2. Manejar eventos relevantes:
 *       - "checkout.session.completed"      → markPaymentPaid(orderId)
 *       - "payment_intent.succeeded"        → markPaymentPaid(orderId)
 *       - "payment_intent.payment_failed"   → markPaymentFailed(orderId, last_payment_error?.message)
 *       - "checkout.session.expired"        → marcar como vencido
 *  3. El orderId de Operia debe ir en metadata.orderId al crear la sesión.
 *  4. Responder 200 rápido (Stripe reintenta con backoff exponencial).
 *
 * IMPORTANTE: STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET viven como secrets
 * del backend, NUNCA en frontend.
 */
export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Stub seguro: aceptamos el ping pero no procesamos nada todavía.
        // const sig = request.headers.get("stripe-signature");
        // const body = await request.text();
        // TODO: const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

        try {
          const payload = await request.json().catch(() => ({}));
          // eslint-disable-next-line no-console
          console.log("[stripe-webhook] received (stub)", {
            type: (payload as any)?.type,
          });
        } catch {
          // ignore body parse errors in stub
        }

        return Response.json({ ok: true, mode: "simulation" });
      },
      GET: async () => {
        return Response.json({ ok: true, provider: "stripe", mode: "simulation" });
      },
    },
  },
});
