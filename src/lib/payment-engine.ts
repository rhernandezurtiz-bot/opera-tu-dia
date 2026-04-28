import { useEffect } from "react";
import { useOperia } from "./operia-store";
import {
  buildPaymentReminder,
  buildPaymentReceivedMessage,
  buildAutoPaymentMessage,
  buildAutoPaymentReminder,
  isReadyForAutoPayment,
} from "./ui-store";
import { sendWhatsAppMessage } from "./whatsapp";

/**
 * Motor de cobro automático.
 * Lee del store con getState() para evitar re-suscripciones que causan loops.
 * Reglas:
 *  1. Criterios cumplidos + sin link → genera link y envía WhatsApp automático.
 *  2. Link enviado hace > webhookSimMinutos → simula webhook de pago recibido.
 *  3. Link enviado hace > recordatorioMinutos sin recordatorio → genera recordatorio.
 */
export function usePaymentEngine() {
  const enabled = useOperia((s) => s.negocio.autoCobroEnabled);

  useEffect(() => {
    if (!enabled) return;

    // Evita re-disparar el envío para el mismo pedido en ticks consecutivos
    // mientras el set() del store aún no propaga el linkSentAt.
    const sendingNow = new Set<string>();

    const tick = async () => {
      const state = useOperia.getState();
      const {
        orders,
        negocio,
        generatePaymentLink,
        markPaymentPaid,
        sendPaymentReminder,
        markLinkSent,
      } = state;
      const now = Date.now();
      const webhookMs = (negocio.webhookSimMinutos ?? 1) * 60 * 1000;
      const reminderMs = (negocio.recordatorioMinutos ?? 30) * 60 * 1000;

      for (const o of orders) {
        if (o.estado === "cancelado" || o.estado === "entregado") continue;

        // Regla 1: criterios listos y sin link → generar link + enviar WhatsApp
        if (!o.paymentLink && isReadyForAutoPayment(o) && !sendingNow.has(o.id)) {
          sendingNow.add(o.id);
          const link = generatePaymentLink(o.id);
          // Construye el mensaje con el link recién generado
          const msg = buildAutoPaymentMessage({ ...o, paymentLink: link });
          if (o.telefono) {
            const result = await sendWhatsAppMessage({ phone: o.telefono, message: msg });
            markLinkSent(o.id, {
              ok: result.ok,
              at: result.at,
              provider: result.provider,
              messageId: result.messageId,
              error: result.error,
            });
          }
          sendingNow.delete(o.id);
          continue;
        }

        if (!o.precio || o.precio <= 0) continue;

        // Regla 2: link_enviado y pasó tiempo de webhook → simular pago recibido
        if (o.pago === "link_enviado" && o.paymentLinkAt && now - o.paymentLinkAt >= webhookMs) {
          markPaymentPaid(o.id);
          continue;
        }

        // Regla 3: ≥30 min sin pago → registrar recordatorio (no envía solo)
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

export {
  buildPaymentReminder,
  buildPaymentReceivedMessage,
  buildAutoPaymentMessage,
  buildAutoPaymentReminder,
};
