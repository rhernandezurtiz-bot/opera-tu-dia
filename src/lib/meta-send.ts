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
  /** Mensaje de error legible para el usuario final (p.ej. token expirado). */
  userError?: string;
  status?: number;
  /** Body completo de la respuesta de Meta (para debug en meta_message_logs). */
  responseBody?: unknown;
  /** phone_number_id (WhatsApp) o id de página usado en el envío. */
  phoneNumberId?: string;
  /** Número/destinatario al que se intentó enviar. */
  to?: string;
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
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { _rawText: text };
  }
  return { res, data };
}

/**
 * Detecta errores típicos de Meta y devuelve un mensaje amigable.
 * Códigos comunes:
 *   - 190: token expirado / inválido (OAuthException)
 *   - 100: parámetro inválido (a veces número no registrado)
 *   - 131030: número no permitido en sandbox
 */
function humanizeMetaError(status: number | undefined, body: any): string {
  const code = body?.error?.code;
  const subcode = body?.error?.error_subcode;
  const msg: string = body?.error?.message ?? "";

  if (code === 190 || /access token|expired|invalid token|session has expired/i.test(msg)) {
    return "Token de WhatsApp expirado o inválido";
  }
  if (status === 401 || status === 403) {
    return "Token de WhatsApp expirado o inválido";
  }
  if (code === 131030 || subcode === 2018278) {
    return "El número destino no está permitido en este entorno (sandbox/prueba). Agrégalo en Meta o pide acceso a producción.";
  }
  if (code === 131026) {
    return "El destinatario no tiene WhatsApp o el número no es válido.";
  }
  if (msg) return msg;
  if (status) return `HTTP ${status}`;
  return "Error desconocido enviando a Meta";
}

export async function sendViaMeta({ channel, to, message }: SendMetaInput): Promise<SendMetaResult> {
  if (channel === "whatsapp") {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      return {
        ok: true,
        mode: "simulation",
        provider: "meta_whatsapp",
        messageId: `sim_${Date.now()}`,
        to,
      };
    }
    const cleanedTo = to.replace(/\D/g, "");
    try {
      const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
      const { res, data } = await postJson(
        url,
        {
          messaging_product: "whatsapp",
          to: cleanedTo,
          type: "text",
          text: { body: message },
        },
        token,
      );

      const messageId: string | undefined = data?.messages?.[0]?.id;

      // Éxito real: HTTP OK Y messages[0].id presente.
      if (res.ok && messageId) {
        return {
          ok: true,
          mode: "live",
          provider: "meta_whatsapp",
          messageId,
          status: res.status,
          responseBody: data,
          phoneNumberId: phoneId,
          to: cleanedTo,
        };
      }

      const userError = humanizeMetaError(res.status, data);
      return {
        ok: false,
        mode: "live",
        provider: "meta_whatsapp",
        error: data?.error?.message ?? `HTTP ${res.status}`,
        userError,
        status: res.status,
        responseBody: data,
        phoneNumberId: phoneId,
        to: cleanedTo,
      };
    } catch (err: any) {
      return {
        ok: false,
        mode: "live",
        provider: "meta_whatsapp",
        error: err?.message ?? "send failed",
        userError: "No se pudo conectar con WhatsApp Cloud API",
        responseBody: { exception: String(err) },
        phoneNumberId: phoneId,
        to: cleanedTo,
      };
    }
  }

  if (channel === "instagram") {
    const token = process.env.IG_ACCESS_TOKEN;
    if (!token) return { ok: true, mode: "simulation", provider: "meta_instagram", messageId: `sim_${Date.now()}`, to };
    try {
      const url = `https://graph.facebook.com/v20.0/me/messages`;
      const { res, data } = await postJson(url, {
        recipient: { id: to },
        message: { text: message },
        messaging_type: "RESPONSE",
      }, token);
      const messageId: string | undefined = data?.message_id;
      if (res.ok && messageId) {
        return { ok: true, mode: "live", provider: "meta_instagram", messageId, status: res.status, responseBody: data, to };
      }
      return {
        ok: false, mode: "live", provider: "meta_instagram",
        error: data?.error?.message ?? `HTTP ${res.status}`,
        userError: humanizeMetaError(res.status, data),
        status: res.status, responseBody: data, to,
      };
    } catch (err: any) {
      return { ok: false, mode: "live", provider: "meta_instagram", error: err?.message ?? "send failed", responseBody: { exception: String(err) }, to };
    }
  }

  // facebook
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return { ok: true, mode: "simulation", provider: "meta_facebook", messageId: `sim_${Date.now()}`, to };
  try {
    const url = `https://graph.facebook.com/v20.0/me/messages`;
    const { res, data } = await postJson(url, {
      recipient: { id: to },
      message: { text: message },
      messaging_type: "RESPONSE",
    }, token);
    const messageId: string | undefined = data?.message_id;
    if (res.ok && messageId) {
      return { ok: true, mode: "live", provider: "meta_facebook", messageId, status: res.status, responseBody: data, to };
    }
    return {
      ok: false, mode: "live", provider: "meta_facebook",
      error: data?.error?.message ?? `HTTP ${res.status}`,
      userError: humanizeMetaError(res.status, data),
      status: res.status, responseBody: data, to,
    };
  } catch (err: any) {
    return { ok: false, mode: "live", provider: "meta_facebook", error: err?.message ?? "send failed", responseBody: { exception: String(err) }, to };
  }
}
