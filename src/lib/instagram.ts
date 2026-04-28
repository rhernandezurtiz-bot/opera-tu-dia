/**
 * Cliente de Instagram DM (FRONT — simulado).
 *
 * Hoy: loggea el envío y devuelve un resultado "ok" simulado para que el
 * motor de cobro pueda registrar "Mensaje enviado" sin backend real.
 *
 * Mañana: estos helpers llamarán a:
 *   - POST /api/send-instagram          → enviar DM (Instagram Graph API)
 *   - POST /api/public/webhooks/instagram → recibir mensajes (Meta webhook)
 */

export interface InstagramMessageInput {
  /** IGSID del destinatario (Instagram-scoped user id) */
  userId: string;
  message: string;
}

export interface InstagramSendResult {
  ok: boolean;
  at: number;
  provider: "simulado" | "meta_instagram";
  messageId?: string;
  error?: string;
}

export interface InstagramIncomingMessage {
  /** IGSID del usuario que escribió */
  userId: string;
  /** @handle si está disponible */
  handle?: string;
  text: string;
  receivedAt: number;
}

export async function sendInstagramDM(
  { userId, message }: InstagramMessageInput,
): Promise<InstagramSendResult> {
  const at = Date.now();
  if (!userId) return { ok: false, at, provider: "simulado", error: "userId requerido" };
  if (!message?.trim()) return { ok: false, at, provider: "simulado", error: "Mensaje vacío" };

  // eslint-disable-next-line no-console
  console.log("[instagram:simulado] →", { userId, preview: message.slice(0, 60) + "…" });

  // TODO (producción):
  // const res = await fetch("/api/send-instagram", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ userId, message }),
  // });
  // const data = await res.json();
  // if (!res.ok) return { ok: false, at, provider: "meta_instagram", error: data?.error ?? `HTTP ${res.status}` };
  // return { ok: true, at, provider: "meta_instagram", messageId: data.messageId };

  return { ok: true, at, provider: "simulado", messageId: `igsim_${at.toString(36)}` };
}

/**
 * Recibe un DM de Instagram (simulado). En producción esto se invoca desde
 * el handler del webhook después de validar la firma de Meta.
 */
export function receiveInstagramMessage(msg: InstagramIncomingMessage) {
  // eslint-disable-next-line no-console
  console.log("[instagram:received]", msg);
  return msg;
}

/**
 * Procesa el payload completo de un webhook de Instagram Messaging y
 * devuelve los mensajes normalizados. Stub para integración real.
 */
export function handleInstagramWebhook(event: any): InstagramIncomingMessage[] {
  const out: InstagramIncomingMessage[] = [];
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
