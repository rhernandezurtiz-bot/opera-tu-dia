/**
 * Motor de respuestas automáticas.
 *
 * Observa los mensajes "nuevo" del Inbox y, según el modo:
 *   - manual:     no hace nada
 *   - sugerido:   genera respuesta y la guarda en log (no envía)
 *   - automatico: genera respuesta, la envía por el canal correcto y registra
 *
 * Reglas de seguridad:
 *  - Nunca envía si requiere revisión manual.
 *  - Nunca cobra si no hay disponibilidad confirmada (la decisión ya lo respeta).
 */

import { useEffect } from "react";
import { useOperia } from "./operia-store";
import { useCatalog } from "./catalog-store";
import { autoReplyForMessage } from "./auto-reply";
import { sendWhatsAppMessage } from "./whatsapp";
import { sendInstagramDM } from "./instagram";
import { sendFacebookMessage } from "./facebook";

export function useAutoReplyEngine() {
  const mode = useOperia((s) => s.autoReplyMode);

  useEffect(() => {
    if (mode === "manual") return;

    const handled = new Set<string>();

    const tick = async () => {
      const state = useOperia.getState();
      const catalog = useCatalog.getState().items;
      const { messages, orders, logAutoReply, updateAutoReplyLog, setMessageStatus } = state;

      // Solo procesa los mensajes "nuevo" no atendidos aún
      for (const m of messages) {
        if (m.estado !== "nuevo") continue;
        if (handled.has(m.id)) continue;
        // Si ya hay un log enviado o pendiente para este messageId, no repetir
        const already = state.autoReplyLog.find((e) => e.messageId === m.id);
        if (already) { handled.add(m.id); continue; }

        const result = autoReplyForMessage(m, catalog, orders);

        if (mode === "sugerido") {
          // Solo registrar la sugerencia
          logAutoReply({
            canal: m.canal ?? "whatsapp",
            cliente: m.cliente,
            messageId: m.id,
            ordenId: m.ordenId,
            recibido: m.texto,
            intencion: result.intent,
            decision: result.decision,
            respuesta: result.message,
            enviado: false,
            modo: "sugerido",
            resultado: "pendiente",
          });
          handled.add(m.id);
          continue;
        }

        // mode === "automatico"
        if (result.needsReview) {
          // Marca como sugerencia pendiente, no envía
          logAutoReply({
            canal: m.canal ?? "whatsapp",
            cliente: m.cliente,
            messageId: m.id,
            ordenId: m.ordenId,
            recibido: m.texto,
            intencion: result.intent,
            decision: result.decision,
            respuesta: result.message,
            enviado: false,
            modo: "automatico",
            resultado: "pendiente",
          });
          handled.add(m.id);
          continue;
        }

        const logId = logAutoReply({
          canal: m.canal ?? "whatsapp",
          cliente: m.cliente,
          messageId: m.id,
          ordenId: m.ordenId,
          recibido: m.texto,
          intencion: result.intent,
          decision: result.decision,
          respuesta: result.message,
          enviado: false,
          modo: "automatico",
          resultado: "pendiente",
        });
        handled.add(m.id);

        const canal = m.canal ?? "whatsapp";
        let send: { ok: boolean; error?: string } = { ok: false, error: "Sin destinatario" };

        try {
          if (canal === "instagram" && m.canalUserId) {
            const r = await sendInstagramDM({ userId: m.canalUserId, message: result.message });
            send = { ok: r.ok, error: r.error };
          } else if (canal === "facebook" && m.canalUserId) {
            const r = await sendFacebookMessage({ userId: m.canalUserId, message: result.message });
            send = { ok: r.ok, error: r.error };
          } else if (m.telefono) {
            const r = await sendWhatsAppMessage({ phone: m.telefono, message: result.message });
            send = { ok: r.ok, error: r.error };
          }
        } catch (err: any) {
          send = { ok: false, error: err?.message ?? "Error desconocido" };
        }

        updateAutoReplyLog(logId, {
          enviado: send.ok,
          resultado: send.ok ? "ok" : "error",
          error: send.error,
        });

        if (send.ok) setMessageStatus(m.id, "respondido");
      }
    };

    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [mode]);
}
