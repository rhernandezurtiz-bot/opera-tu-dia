/**
 * Cliente de Facebook Messenger (FRONT — simulado).
 *
 * Hoy: loggea el envío y devuelve un resultado "ok" simulado para que el
 * motor de cobro pueda registrar "Mensaje enviado" sin backend real.
 *
 * Mañana: estos helpers llamarán a:
 *   - POST /api/send-facebook                  → enviar mensaje (Messenger Send API)
 *   - POST /api/public/webhooks/facebook       → recibir mensajes (Meta webhook)
 */

export interface FacebookMessageInput {
  /** PSID (Page-Scoped User ID) del destinatario */
  userId: string;
  message: string;
}

export interface FacebookSendResult {
  ok: boolean;
  at: number;
  provider: "simulado" | "meta_facebook";
  messageId?: string;
  error?: string;
}

export interface FacebookIncomingMessage {
  /** PSID del usuario que escribió */
  userId: string;
  /** Nombre visible si está disponible */
  handle?: string;
  text: string;
  receivedAt: number;
}

export async function sendFacebookMessage(
  { userId, message }: FacebookMessageInput,
): Promise<FacebookSendResult> {
  const at = Date.now();
  if (!userId) return { ok: false, at, provider: "simulado", error: "userId requerido" };
  if (!message?.trim()) return { ok: false, at, provider: "simulado", error: "Mensaje vacío" };

  // eslint-disable-next-line no-console
  console.log("[facebook:simulado] →", { userId, preview: message.slice(0, 60) + "…" });

  // TODO (producción):
  // const res = await fetch("/api/send-facebook", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ userId, message }),
  // });
  // const data = await res.json();
  // if (!res.ok) return { ok: false, at, provider: "meta_facebook", error: data?.error ?? `HTTP ${res.status}` };
  // return { ok: true, at, provider: "meta_facebook", messageId: data.messageId };

  return { ok: true, at, provider: "simulado", messageId: `fbsim_${at.toString(36)}` };
}

export function receiveFacebookMessage(msg: FacebookIncomingMessage) {
  // eslint-disable-next-line no-console
  console.log("[facebook:received]", msg);
  return msg;
}

/**
 * Procesa el payload completo de un webhook de Messenger y devuelve los
 * mensajes normalizados. Stub para integración real.
 */
export function handleFacebookWebhook(event: any): FacebookIncomingMessage[] {
  const out: FacebookIncomingMessage[] = [];
  try {
    const entries = Array.isArray(event?.entry) ? event.entry : [];
    for (const entry of entries) {
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];
      for (const m of messaging) {
        const text = m?.message?.text;
        const userId = m?.sender?.id;
        if (text && userId) {
          out.push({
            userId: String(userId),
            text: String(text),
            receivedAt: m?.timestamp ?? Date.now(),
          });
        }
      }
    }
  } catch {
    /* swallow — stub */
  }
  return out;
}
