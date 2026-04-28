/**
 * Cliente de envío de WhatsApp (FRONT — simulado).
 *
 * Hoy: solo loggea y devuelve un resultado tipo "ok" para que el motor de
 * cobro pueda marcar el pedido como "Mensaje enviado" sin backend real.
 *
 * Mañana: este mismo helper debe llamar a /api/send-whatsapp (TanStack server
 * route) que internamente despachará a Twilio o Meta Cloud API.
 */

export interface SendWhatsAppInput {
  phone: string;
  message: string;
}

export interface SendWhatsAppResult {
  ok: boolean;
  at: number;
  provider: "simulado" | "twilio" | "meta_cloud";
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  { phone, message }: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const at = Date.now();
  const phoneClean = phone.replace(/\D/g, "");

  if (!phoneClean) {
    return { ok: false, at, provider: "simulado", error: "Teléfono inválido" };
  }
  if (!message || message.trim().length === 0) {
    return { ok: false, at, provider: "simulado", error: "Mensaje vacío" };
  }

  // ── Simulación ────────────────────────────────────────────────────────────
  // En producción, descomentar el bloque del endpoint y eliminar este log.
  // eslint-disable-next-line no-console
  console.log("[whatsapp:simulado] →", { phone: phoneClean, preview: message.slice(0, 60) + "…" });

  // TODO (producción): llamar al endpoint real
  // const res = await fetch("/api/send-whatsapp", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ phone: phoneClean, message }),
  // });
  // const data = await res.json();
  // if (!res.ok) return { ok: false, at, provider: "twilio", error: data?.error ?? `HTTP ${res.status}` };
  // return { ok: true, at, provider: "twilio", messageId: data.messageId };

  return {
    ok: true,
    at,
    provider: "simulado",
    messageId: `sim_${at.toString(36)}`,
  };
}
