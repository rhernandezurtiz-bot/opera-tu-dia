import { useEffect } from "react";
import { useOperia } from "./operia-store";
import {
  buildPaymentReminder,
  buildPaymentReceivedMessage,
  buildAutoPaymentMessage,
  buildAutoPaymentReminder,
  isReadyForAutoPayment,
  adaptMessageForChannel,
} from "./ui-store";
import { sendWhatsAppMessage } from "./whatsapp";
import { sendInstagramDM } from "./instagram";
import { sendFacebookMessage } from "./facebook";
import { useCatalog, validateOrder } from "./catalog-store";

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

      const catalog = useCatalog.getState().items;
      for (const o of orders) {
        if (o.estado === "cancelado" || o.estado === "entregado") continue;

        // Bloquea cobro automático si la validación de catálogo lo indica
        const validation = validateOrder(o, catalog, orders);
        const blockedByCatalog = validation.blockPayment;

        // Regla 1: criterios listos y sin link → generar link + enviar por canal de origen
        if (!o.paymentLink && !blockedByCatalog && isReadyForAutoPayment(o) && !sendingNow.has(o.id)) {
          sendingNow.add(o.id);
          const link = generatePaymentLink(o.id);
          // Construye el mensaje y adáptalo al tono del canal
          const baseMsg = buildAutoPaymentMessage({ ...o, paymentLink: link });
          const msg = adaptMessageForChannel(baseMsg, o.canal);
          const canal = o.canal ?? "whatsapp";

          let result: { ok: boolean; at: number; provider: string; messageId?: string; error?: string } | null = null;

          if (canal === "instagram" && o.canalUserId) {
            result = await sendInstagramDM({ userId: o.canalUserId, message: msg });
          } else if (canal === "facebook" && o.canalUserId) {
            result = await sendFacebookMessage({ userId: o.canalUserId, message: msg });
          } else if (o.telefono) {
            // whatsapp / manual con teléfono → WhatsApp
            result = await sendWhatsAppMessage({ phone: o.telefono, message: msg });
          }

          if (result) {
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

        // Regla 3: ≥30 min sin pago → enviar recordatorio automático por canal de origen
        if (
          o.pago === "link_enviado" &&
          o.paymentLinkAt &&
          now - o.paymentLinkAt >= reminderMs &&
          (!o.paymentReminderAt || now - o.paymentReminderAt >= reminderMs)
        ) {
          const baseMsg = buildAutoPaymentReminder(o);
          const msg = adaptMessageForChannel(baseMsg, o.canal);
          const canal = o.canal ?? "whatsapp";
          try {
            if (canal === "instagram" && o.canalUserId) {
              await sendInstagramDM({ userId: o.canalUserId, message: msg });
            } else if (canal === "facebook" && o.canalUserId) {
              await sendFacebookMessage({ userId: o.canalUserId, message: msg });
            } else if (o.telefono) {
              await sendWhatsAppMessage({ phone: o.telefono, message: msg });
            }
          } catch {
            // silencioso: el log de eventos lo registra sendPaymentReminder
          }
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
