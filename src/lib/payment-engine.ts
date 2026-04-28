import { useEffect } from "react";
import { useOperia } from "./operia-store";
import { buildPaymentReminder, buildPaymentReceivedMessage } from "./ui-store";

/**
 * Motor de cobro automático.
 * Se ejecuta cada 5s y aplica reglas:
 *  1. Pedido confirmado + sin pago + sin link → genera link automáticamente.
 *  2. Link enviado hace > webhookSimMinutos → simula webhook de pago recibido.
 *  3. Link enviado hace > recordatorioMinutos sin recordatorio → envía recordatorio.
 *  4. Pago recibido → emite mensaje "¡Pago recibido!" (solo una vez).
 */
export function usePaymentEngine() {
  const orders = useOperia((s) => s.orders);
  const negocio = useOperia((s) => s.negocio);
  const generatePaymentLink = useOperia((s) => s.generatePaymentLink);
  const markPaymentPaid = useOperia((s) => s.markPaymentPaid);
  const sendPaymentReminder = useOperia((s) => s.sendPaymentReminder);

  useEffect(() => {
    if (!negocio.autoCobroEnabled) return;
    const tick = () => {
      const now = Date.now();
      const webhookMs = negocio.webhookSimMinutos * 60 * 1000;
      const reminderMs = negocio.recordatorioMinutos * 60 * 1000;

      for (const o of orders) {
        if (o.estado === "cancelado" || o.estado === "entregado") continue;
        if (o.precio <= 0) continue;

        // Regla 1: confirmado, sin pago, sin link → genera link
        if (
          o.estado === "confirmado" &&
          o.pago === "pendiente" &&
          !o.paymentLink &&
          (o.faltantes ?? []).length === 0
        ) {
          generatePaymentLink(o.id);
          continue;
        }

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
  }, [orders, negocio, generatePaymentLink, markPaymentPaid, sendPaymentReminder]);
}

// Helpers exportados para componer mensajes desde la UI
export { buildPaymentReminder, buildPaymentReceivedMessage };
