import { useEffect } from "react";
import { useOperia } from "./operia-store";
import {
  buildPaymentReminder,
  buildPaymentReceivedMessage,
  buildAutoPaymentReminder,
  isReadyForAutoPayment,
} from "./ui-store";

/**
 * Motor de cobro automático.
 * Lee del store con getState() para evitar re-suscripciones que causan loops.
 * Reglas:
 *  1. Pedido confirmado + sin pago + sin link → genera link automáticamente.
 *  2. Link enviado hace > webhookSimMinutos → simula webhook de pago recibido.
 *  3. Link enviado hace > recordatorioMinutos sin recordatorio → envía recordatorio.
 */
export function usePaymentEngine() {
  // Habilitación reactiva (única dep) para arrancar/detener el intervalo
  const enabled = useOperia((s) => s.negocio.autoCobroEnabled);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const state = useOperia.getState();
      const { orders, negocio, generatePaymentLink, markPaymentPaid, sendPaymentReminder } = state;
      const now = Date.now();
      const webhookMs = (negocio.webhookSimMinutos ?? 1) * 60 * 1000;
      const reminderMs = (negocio.recordatorioMinutos ?? 30) * 60 * 1000;

      for (const o of orders) {
        if (o.estado === "cancelado" || o.estado === "entregado") continue;

        // Regla 1: criterios cumplidos (fecha confirmada + dirección + monto) y sin link → genera link automáticamente
        if (!o.paymentLink && isReadyForAutoPayment(o)) {
          generatePaymentLink(o.id);
          continue;
        }

        if (!o.precio || o.precio <= 0) continue;

        // Regla 2: link_enviado y pasó tiempo de webhook → simular pago recibido
        if (o.pago === "link_enviado" && o.paymentLinkAt && now - o.paymentLinkAt >= webhookMs) {
          markPaymentPaid(o.id);
          continue;
        }

        // Regla 3: link_enviado, pasaron recordatorioMinutos sin recordatorio
        if (
          o.pago === "link_enviado" &&
          o.paymentLinkAt &&
          now - o.paymentLinkAt >= reminderMs &&
          (!o.paymentReminderAt || now - o.paymentReminderAt >= reminderMs)
        ) {
          sendPaymentReminder(o.id);
        }
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [enabled]);
}

export { buildPaymentReminder, buildPaymentReceivedMessage };
