/**
 * Envío de mensajes salientes a las APIs oficiales de Meta.
 *
 * Si no hay tokens configurados, devolvemos `{ ok:true, mode:"simulation" }`
 * para que el flujo de Operia siga funcionando en desarrollo.
 *
 * SECRETOS esperados en `process.env` (server-side):
 *   - WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 *   - IG_ACCESS_TOKEN
 *   - FB_PAGE_ACCESS_TOKEN
 */

export type MetaChannel = "whatsapp" | "instagram" | "facebook";

export interface SendMetaInput {
  channel: MetaChannel;
  to: string;
  message: string;
}

export interface SendMetaResult {
  ok: boolean;
  mode: "simulation" | "live";
  provider: "meta_whatsapp" | "meta_instagram" | "meta_facebook" | null;
  messageId?: string;
  error?: string;
  status?: number;
}

async function postJson(url: string, body: unknown, token: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function sendViaMeta({ channel, to, message }: SendMetaInput): Promise<SendMetaResult> {
  if (channel === "whatsapp") {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) return { ok: true, mode: "simulation", provider: "meta_whatsapp", messageId: `sim_${Date.now()}` };
    try {
      const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
      const { res, data } = await postJson(url, {
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }, token);
      if (!res.ok) return { ok: false, mode: "live", provider: "meta_whatsapp", error: data?.error?.message ?? `HTTP ${res.status}`, status: res.status };
      return { ok: true, mode: "live", provider: "meta_whatsapp", messageId: data?.messages?.[0]?.id, status: res.status };
    } catch (err: any) {
      return { ok: false, mode: "live", provider: "meta_whatsapp", error: err?.message ?? "send failed" };
    }
  }

  if (channel === "instagram") {
    const token = process.env.IG_ACCESS_TOKEN;
    if (!token) return { ok: true, mode: "simulation", provider: "meta_instagram", messageId: `sim_${Date.now()}` };
    try {
      const url = `https://graph.facebook.com/v20.0/me/messages`;
      const { res, data } = await postJson(url, {
        recipient: { id: to },
        message: { text: message },
        messaging_type: "RESPONSE",
      }, token);
      if (!res.ok) return { ok: false, mode: "live", provider: "meta_instagram", error: data?.error?.message ?? `HTTP ${res.status}`, status: res.status };
      return { ok: true, mode: "live", provider: "meta_instagram", messageId: data?.message_id, status: res.status };
    } catch (err: any) {
      return { ok: false, mode: "live", provider: "meta_instagram", error: err?.message ?? "send failed" };
    }
  }

  // facebook
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return { ok: true, mode: "simulation", provider: "meta_facebook", messageId: `sim_${Date.now()}` };
  try {
    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const { res, data } = await postJson(url, {
      recipient: { id: to },
      message: { text: message },
      messaging_type: "RESPONSE",
    }, token);
    if (!res.ok) return { ok: false, mode: "live", provider: "meta_facebook", error: data?.error?.message ?? `HTTP ${res.status}`, status: res.status };
    return { ok: true, mode: "live", provider: "meta_facebook", messageId: data?.message_id, status: res.status };
  } catch (err: any) {
    return { ok: false, mode: "live", provider: "meta_facebook", error: err?.message ?? "send failed" };
  }
}
