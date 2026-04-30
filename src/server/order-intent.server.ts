/**
 * Análisis de mensajes WhatsApp para gestión de pedidos.
 *
 * Estrategia:
 * 1) Heurísticos rápidos (regex/keywords) — siempre se ejecutan.
 * 2) Si LOVABLE_API_KEY está disponible y el mensaje es ambiguo, refina con IA.
 *
 * SOLO se usa server-side (.server.ts).
 */

export type OrderIntent =
  | "pedido_nuevo"
  | "cotizacion"
  | "pregunta_precio"
  | "seguimiento"
  | "cancelacion"
  | "queja"
  | "ambiguo";

export interface ExtractedOrder {
  intent: OrderIntent;
  product_requested: string | null;
  quantity: number | null;
  requested_date: string | null; // YYYY-MM-DD
  requested_time: string | null; // HH:MM:SS
  delivery_address: string | null;
  delivery_mode: "entrega" | "recoger" | null;
  notes: string | null;
}

const KEYWORDS: Record<OrderIntent, RegExp[]> = {
  pedido_nuevo: [
    /\b(pedido|ordenar|orden|quiero pedir|me das|me apartas|me reservas|encargar|encargo)\b/i,
  ],
  cotizacion: [/\b(cotizaci[oó]n|presupuesto|cu[aá]nto cuesta el paquete|cu[aá]nto saldr[ií]a)\b/i],
  pregunta_precio: [/\b(precio|cu[aá]nto cuesta|cu[aá]nto vale|valor)\b/i],
  seguimiento: [/\b(estado|status|seguimiento|ya est[aá]|cu[aá]ndo llega|cuando llega|tracking)\b/i],
  cancelacion: [/\b(cancelar|cancela|anular|ya no quiero|olv[ií]dalo)\b/i],
  queja: [/\b(queja|reclamo|p[eé]simo|terrible|fatal|me quej[oó]|fraude|inacept|no llegó|no llego)\b/i],
  ambiguo: [],
};

function detectIntentHeuristic(text: string): OrderIntent {
  // Orden de prioridad: cancelación > queja > seguimiento > pedido > cotización > pregunta_precio
  const order: OrderIntent[] = [
    "cancelacion",
    "queja",
    "seguimiento",
    "pedido_nuevo",
    "cotizacion",
    "pregunta_precio",
  ];
  for (const intent of order) {
    if (KEYWORDS[intent].some((rx) => rx.test(text))) return intent;
  }
  // Fallback: si menciona un producto del catálogo o pide algo "para" una fecha → pedido_nuevo
  if (/\b(pastel|torta|cupcake|galleta|panqu[eé]|dona|brownie|pizza)\b/i.test(text)) {
    return "pedido_nuevo";
  }
  if (/\bpara\s+(hoy|mañana|el\s+\w+|\d)/i.test(text) && extractTime(text)) {
    return "pedido_nuevo";
  }
  return "ambiguo";
}

// ─── Extracción rápida con regex ──────────────────────────────────────────
function extractQuantity(text: string): number | null {
  const m = text.match(/\b(\d{1,4})\s*(unidades|piezas|pzas|pz|cajas|kilos|kg|litros|lt|docenas|paquetes)?\b/i);
  if (m) return parseFloat(m[1]);
  return null;
}

const NUM_WORDS: Record<string, number> = {
  un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, media: 0.5,
};

function extractQuantityWord(text: string): number | null {
  const m = text.toLowerCase().match(/\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|media)\b/);
  if (m) return NUM_WORDS[m[1]] ?? null;
  return null;
}

function extractDate(text: string): string | null {
  const t = text.toLowerCase();
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  if (/\bhoy\b/.test(t)) return fmt(today);
  if (/\bmañana\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return fmt(d);
  }
  if (/\bpasado\s*mañana\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return fmt(d);
  }

  // Día de la semana próximo
  const dias = ["domingo", "lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado"];
  for (let i = 0; i < dias.length; i++) {
    const re = new RegExp(`\\b${dias[i]}\\b`);
    if (re.test(t)) {
      const target = i >= 7 ? (i === 7 ? 6 : 3) : i; // normaliza miércoles/sábado
      const cur = today.getDay();
      const diff = ((target - cur + 7) % 7) || 7;
      const d = new Date(today);
      d.setDate(d.getDate() + diff);
      return fmt(d);
    }
  }

  // dd/mm o dd-mm o dd de mes
  const m = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/);
  if (m) {
    const day = parseInt(m[1]);
    const month = parseInt(m[2]);
    const year = m[3] ? parseInt(m[3].length === 2 ? "20" + m[3] : m[3]) : today.getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const d = new Date(year, month - 1, day);
      return fmt(d);
    }
  }
  return null;
}

function extractTime(text: string): string | null {
  // 14:30 / 2pm / 2 p.m. / 14h
  let m = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm|hrs?|h)?\b/i);
  if (m) {
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    const ap = m[3]?.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h >= 0 && h < 24 && min >= 0 && min < 60) {
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
    }
  }
  m = text.match(/\b(\d{1,2})\s*(am|pm|p\.?\s*m\.?|a\.?\s*m\.?)\b/i);
  if (m) {
    let h = parseInt(m[1]);
    const ap = m[2].toLowerCase().replace(/[\.\s]/g, "");
    if (ap.startsWith("p") && h < 12) h += 12;
    if (ap.startsWith("a") && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00:00`;
  }
  return null;
}

function extractDeliveryMode(text: string): "entrega" | "recoger" | null {
  if (/\b(recoger|paso por|recojo|pickup|pasar por)\b/i.test(text)) return "recoger";
  if (/\b(entrega|env[ií]o|env[ií]a|domicilio|llevar|llevan|repartir|delivery)\b/i.test(text)) return "entrega";
  return null;
}

function extractAddress(text: string): string | null {
  // Heurística simple: "calle/av/avenida/colonia ... número"
  const m = text.match(
    /\b((?:calle|c\.|av\.?|avenida|blvd\.?|boulevard|colonia|col\.?|fracc\.?|fraccionamiento|barrio|cerrada|priv\.?|privada)\s+[^\.\n,]{3,80})/i,
  );
  if (m) return m[1].trim();
  return null;
}

// Catálogo de productos frecuentes (pastelería/repostería). Se puede ampliar.
const PRODUCT_CATALOG: Array<{ rx: RegExp; label: string }> = [
  { rx: /\bpastel(?:ito)?\s+de\s+([a-záéíóúñ ]{3,40}?)(?=\s+(?:para|por|el|la|los|las|de\s+\d|\d|hoy|mañana|el\s+\w+)|[\.,;\n\?!]|$)/i, label: "pastel de $1" },
  { rx: /\bpastel(?:ito)?\b/i, label: "pastel" },
  { rx: /\btorta\s+de\s+([a-záéíóúñ ]{3,40}?)(?=\s+(?:para|por|el|la|los|las)|[\.,;\n\?!]|$)/i, label: "torta de $1" },
  { rx: /\btorta\b/i, label: "torta" },
  { rx: /\bcupcakes?\b/i, label: "cupcakes" },
  { rx: /\bgalletas?\b/i, label: "galletas" },
  { rx: /\bpanqu[eé]s?\b/i, label: "panqué" },
  { rx: /\bdonas?\b/i, label: "donas" },
  { rx: /\bbrownies?\b/i, label: "brownies" },
  { rx: /\bpizza\b/i, label: "pizza" },
];

function extractProduct(text: string, intent: OrderIntent): string | null {
  if (intent !== "pedido_nuevo" && intent !== "cotizacion" && intent !== "pregunta_precio") return null;

  // 1) Catálogo conocido
  for (const { rx, label } of PRODUCT_CATALOG) {
    const m = text.match(rx);
    if (m) {
      if (label.includes("$1") && m[1]) {
        const sabor = m[1].trim().replace(/\s+$/, "");
        return label.replace("$1", sabor);
      }
      return label;
    }
  }

  // 2) "quiero/pedir/me das X" → captura tras el verbo
  const m = text.match(
    /\b(?:quiero|pedir|ordenar|encargar|me das|me apartas|me reservas|necesito|me mandas|me env[ií]as)\s+([^\.\n,;\?\!]{3,80})/i,
  );
  if (m) return m[1].trim().replace(/\s+(para|por|el|la|los|las)\s+(hoy|mañana|el|la).*/i, "").trim();
  return null;
}

/**
 * parseOrder — API simple solicitada por la app.
 * Devuelve los campos clave + qué falta (en español).
 */
export function parseOrder(message_text: string): {
  product: string | null;
  date: string | null;
  time: string | null;
  delivery_type: "recoger" | "domicilio" | null;
  quantity: number | null;
  missing_fields: string[];
} {
  const intent = detectIntentHeuristic(message_text);
  const product = extractProduct(message_text, intent === "ambiguo" ? "pedido_nuevo" : intent);
  const date = extractDate(message_text);
  const time = extractTime(message_text);
  const mode = extractDeliveryMode(message_text);
  const delivery_type: "recoger" | "domicilio" | null =
    mode === "recoger" ? "recoger" : mode === "entrega" ? "domicilio" : null;
  const quantity = extractQuantity(message_text) ?? extractQuantityWord(message_text);

  const missing_fields: string[] = [];
  if (!product) missing_fields.push("producto");
  if (!date) missing_fields.push("fecha");
  if (!time) missing_fields.push("hora");
  if (!delivery_type) missing_fields.push("tipo_entrega");

  return { product, date, time, delivery_type, quantity, missing_fields };
}

function detectRiskLevel(intent: OrderIntent, text: string, missing: string[]): "bajo" | "medio" | "alto" {
  if (intent === "queja" || intent === "cancelacion") return "alto";
  if (intent === "ambiguo") return "medio";
  if (missing.length >= 3) return "medio";
  if (/\b(urgente|ya|inmediato|ahora mismo)\b/i.test(text)) return "medio";
  return "bajo";
}

export function analyzeMessage(text: string): ExtractedOrder {
  const intent = detectIntentHeuristic(text);
  const quantity = extractQuantity(text) ?? extractQuantityWord(text);
  const requested_date = extractDate(text);
  const requested_time = extractTime(text);
  const delivery_address = extractAddress(text);
  const delivery_mode = extractDeliveryMode(text);
  const product_requested = extractProduct(text, intent);

  return {
    intent,
    product_requested,
    quantity,
    requested_date,
    requested_time,
    delivery_address,
    delivery_mode,
    notes: null,
  };
}

// ─── Datos mínimos de un pedido ───────────────────────────────────────────
export const REQUIRED_FIELDS = ["product_requested", "requested_date", "requested_time", "phone", "delivery_or_pickup"] as const;

export function computeMissingFields(order: {
  product_requested: string | null;
  requested_date: string | null;
  requested_time: string | null;
  phone: string | null;
  delivery_address: string | null;
  delivery_mode: string | null;
}): string[] {
  const missing: string[] = [];
  if (!order.product_requested) missing.push("producto");
  if (!order.requested_date) missing.push("fecha");
  if (!order.requested_time) missing.push("hora");
  if (!order.delivery_mode && !order.delivery_address) missing.push("tipo_entrega");
  return missing;
}

export { detectRiskLevel };

// ─── Generación de respuestas ─────────────────────────────────────────────

function formatHumanDate(iso: string | null): string | null {
  if (!iso) return null;
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (iso === fmt(today)) return "hoy";
  if (iso === fmt(tomorrow)) return "mañana";
  // dd/mm
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)}/${parseInt(m)}`;
}

function formatHumanTime(t: string | null): string | null {
  if (!t) return null;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr);
  const min = parseInt(mStr);
  const ap = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return min === 0 ? `${h} ${ap}` : `${h}:${String(min).padStart(2, "0")} ${ap}`;
}

export function buildReplyForIntent(args: {
  intent: OrderIntent;
  customerName: string | null;
  missing: string[];
  order?: {
    product_requested?: string | null;
    requested_date?: string | null;
    requested_time?: string | null;
    delivery_mode?: string | null;
  };
}): { text: string; safeToAutoSend: boolean } {
  const greet = args.customerName ? args.customerName.split(" ")[0] : "";
  const hi = greet ? `¡Hola ${greet}!` : "¡Hola!";

  switch (args.intent) {
    case "pedido_nuevo":
    case "cotizacion": {
      const o = args.order ?? {};
      // Mapear "missing" del cómputo del pedido al vocabulario simple del MVP.
      // Solo nos interesan: producto, fecha, hora, tipo_entrega.
      const missing = args.missing
        .map((m) => (m === "entrega o recoger" ? "tipo_entrega" : m))
        .filter((m) => ["producto", "fecha", "hora", "tipo_entrega"].includes(m));

      if (missing.length === 0) {
        const fecha = formatHumanDate(o.requested_date ?? null) ?? "la fecha indicada";
        const hora = formatHumanTime(o.requested_time ?? null) ?? "la hora indicada";
        const tipo = o.delivery_mode === "recoger" ? "recoger" : "domicilio";
        const prod = o.product_requested ?? "tu pedido";
        return {
          text: `Perfecto 🙌 Tengo tu pedido de ${prod} para ${fecha} a las ${hora} (${tipo}). ¿Confirmas tu pedido?`,
          safeToAutoSend: true,
        };
      }

      // Preguntar SOLO lo que falta, una pregunta concreta por cada campo.
      const lines: string[] = [];
      if (missing.includes("producto")) lines.push("¿Qué producto te gustaría pedir?");
      if (missing.includes("fecha")) lines.push("¿Para qué día lo necesitas?");
      if (missing.includes("hora")) lines.push("¿Para qué hora lo necesitas?");
      if (missing.includes("tipo_entrega")) lines.push("¿Será para recoger o envío a domicilio?");

      // Si tenemos algunos datos, los reconocemos antes de preguntar.
      const known: string[] = [];
      if (!missing.includes("producto") && o.product_requested) known.push(o.product_requested);
      if (!missing.includes("fecha") && o.requested_date) known.push(`para ${formatHumanDate(o.requested_date)}`);
      if (!missing.includes("hora") && o.requested_time) known.push(`a las ${formatHumanTime(o.requested_time)}`);

      const prefix = known.length > 0
        ? `${hi} Anoté ${known.join(" ")}. `
        : `${hi} `;

      return {
        text: `${prefix}${lines.join(" ")}`,
        safeToAutoSend: true,
      };
    }
    case "pregunta_precio":
      return {
        text: `${hi} Gracias por tu interés. Te paso los precios en un momento 💬`,
        safeToAutoSend: true,
      };
    case "seguimiento":
      return {
        text: `${hi} Déjanos consultar el estado de tu pedido y te confirmamos en breve 🙌`,
        safeToAutoSend: true,
      };
    case "cancelacion":
      return {
        text: `${hi} Recibimos tu solicitud. Un agente te confirmará la cancelación en breve.`,
        safeToAutoSend: false,
      };
    case "queja":
      return {
        text: `${hi} Lamentamos lo ocurrido. Un agente revisará tu caso de inmediato.`,
        safeToAutoSend: false,
      };
    case "ambiguo":
    default:
      return {
        text: `${hi} Gracias por escribirnos. En breve te atendemos personalmente.`,
        safeToAutoSend: false,
      };
  }
}
