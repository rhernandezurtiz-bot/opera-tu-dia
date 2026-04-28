/**
 * Sistema de respuestas automáticas multicanal.
 *
 * Detecta intención del mensaje, lo cruza contra catálogo/stock/disponibilidad,
 * y produce una respuesta lista para enviar (o sugerir, según el modo).
 *
 * NUNCA envía por sí mismo: el motor (auto-reply-engine) decide si dispara.
 */

import type { Channel, Order, WhatsappMessage, AutoReplyIntent, AutoReplyDecision } from "./operia-store";
import { parseWhatsapp } from "./operia-store";
import {
  validateAgainstCatalog,
  validateOrder,
  buildAlternativeOffer,
  type CatalogItem,
  type CatalogValidation,
} from "./catalog-store";
import { adaptMessageForChannel } from "./ui-store";

/* ------------------------- Detección de intención ------------------------- */

const RX_SEGUIMIENTO = /\b(ya pagué|ya pague|hice el pago|comprobante|cuándo llega|cuando llega|mi pedido|estado|status|seguimiento|sigue en pie)\b/i;
const RX_COTIZACION = /\b(cotizar|cotización|cotizacion|presupuesto|cuanto sale|cuánto sale|cuanto cuesta|cuánto cuesta|precio)\b/i;
const RX_PREGUNTA = /\b(hacen|tienen|manejan|tienes|hay|venden|hacen envío|hacen envio|puedo|podrían|podrian|preguntar|duda|consulta)\b/i;
const RX_PEDIDO = /\b(quiero|me gustaría|me gustaria|necesito|encargar|pedir|apartar|reservar|agendar|para (hoy|mañana|manana|el|este))\b/i;

export function detectIntent(text: string): AutoReplyIntent {
  if (!text) return "desconocido";
  if (RX_SEGUIMIENTO.test(text)) return "seguimiento";
  if (RX_COTIZACION.test(text)) return "cotizacion";
  if (RX_PEDIDO.test(text)) return "pedido_nuevo";
  if (RX_PREGUNTA.test(text) || /\?/.test(text)) return "pregunta";
  return "desconocido";
}

/* ----------------------------- Decisión de tipo --------------------------- */

export interface DecideInput {
  text: string;
  canal: Channel;
  catalog: CatalogItem[];
  orders: Order[];
  matchedOrder?: Order; // si el mensaje corresponde a un pedido ya creado
}

export interface AutoReplyResult {
  intent: AutoReplyIntent;
  decision: AutoReplyDecision;
  message: string;          // mensaje listo (ya adaptado al canal)
  needsReview: boolean;     // marcar como "requiere revisión"
  validation?: CatalogValidation;
  draftOrder?: Order;       // pedido sugerido (parseado del texto)
}

/**
 * Genera la respuesta automática para un mensaje entrante.
 * Aplica reglas de seguridad: nunca cobrar sin disponibilidad confirmada.
 */
export function decideAutoReply(input: DecideInput): AutoReplyResult {
  const { text, canal, catalog, orders, matchedOrder } = input;
  const intent = detectIntent(text);

  // E. Si ya pagó (o el pedido ya está pagado) → confirmar
  if (matchedOrder?.pago === "pagado") {
    const fecha = matchedOrder.fechaEntrega || "la fecha acordada";
    return finalize(intent, "ya_pago", canal,
      `¡Listo! 🙌\n\nTu pago ha sido confirmado.\nTu pedido queda apartado para ${fecha}.`);
  }

  // D. Si el pedido ya tiene link generado y disponibilidad → cobrar
  if (matchedOrder?.paymentLink && matchedOrder.pago === "link_enviado") {
    return finalize(intent, "listo_cobrar", canal,
      `Perfecto 🙌\n\nTu pedido ya está listo para apartarse.\nPuedes realizar el pago aquí:\n${matchedOrder.paymentLink}\n\nEn cuanto se confirme, queda asegurado automáticamente.`);
  }

  // Validar contra catálogo (orden existente o draft del texto)
  let validation: CatalogValidation;
  let draftOrder: Order | undefined;

  if (matchedOrder) {
    validation = validateOrder(matchedOrder, catalog, orders);
  } else {
    draftOrder = parseWhatsapp(text, { canal });
    validation = validateAgainstCatalog(text, catalog, draftOrder.fechaEntrega || undefined, {
      cantidad: draftOrder.cantidad ? parseInt(draftOrder.cantidad, 10) || undefined : undefined,
      hora: draftOrder.horaEntrega || undefined,
    });
  }

  // B. Sin disponibilidad → ofrecer alternativa
  if (validation.availability === "no_disponible") {
    const alt = buildAlternativeOffer(catalog, draftOrder?.tipo);
    return finalize(intent, "sin_disponibilidad", canal, alt, { validation, draftOrder, needsReview: false });
  }

  // Ambiguo / requiere revisión humana
  if (validation.availability === "revision" || intent === "desconocido") {
    return finalize(intent, "requiere_revision", canal,
      `Hola 😊\n\nGracias por tu mensaje. Te confirmo en un momento con todos los detalles 🙌`,
      { validation, draftOrder, needsReview: true });
  }

  // C. Faltan datos críticos
  const order = matchedOrder ?? draftOrder!;
  const missing = (order.faltantes || []).filter((f) => !/pago/i.test(f)).slice(0, 2);
  if (missing.length > 0) {
    const lineas = missing.map((m) => `• ${m}`).join("\n");
    return finalize(intent, "faltan_datos", canal,
      `Perfecto 🙌\n\nSolo necesito confirmar:\n${lineas}\n\nY lo dejamos listo.`,
      { validation, draftOrder });
  }

  // A. Venta posible — confirmar antes de cobrar
  return finalize(intent, "venta_posible", canal,
    `¡Sí podemos hacerlo! 😊\n\nPara apartar tu pedido solo necesito confirmar:\n• Hora\n• Entrega o recolección\n\nEn cuanto me confirmes, te mando el link de pago 🙌`,
    { validation, draftOrder });
}

function finalize(
  intent: AutoReplyIntent,
  decision: AutoReplyDecision,
  canal: Channel,
  message: string,
  extras: Partial<AutoReplyResult> = {},
): AutoReplyResult {
  return {
    intent,
    decision,
    message: adaptMessageForChannel(message, canal),
    needsReview: false,
    ...extras,
  };
}

/* ----------------------------- Etiquetas UI ------------------------------- */

export const INTENT_LABELS: Record<AutoReplyIntent, string> = {
  pedido_nuevo: "Pedido nuevo",
  seguimiento: "Seguimiento",
  pregunta: "Pregunta",
  cotizacion: "Cotización",
  desconocido: "Sin clasificar",
};

export const DECISION_LABELS: Record<AutoReplyDecision, string> = {
  venta_posible: "Venta posible",
  sin_disponibilidad: "Sin disponibilidad",
  faltan_datos: "Faltan datos",
  listo_cobrar: "Listo para cobrar",
  ya_pago: "Pago confirmado",
  requiere_revision: "Requiere revisión",
};

export const DECISION_TONE: Record<AutoReplyDecision, "primary" | "warning" | "danger" | "success"> = {
  venta_posible: "primary",
  sin_disponibilidad: "warning",
  faltan_datos: "warning",
  listo_cobrar: "primary",
  ya_pago: "success",
  requiere_revision: "danger",
};

/* ------------------- Atajo: derivar respuesta de un mensaje --------------- */

export function autoReplyForMessage(
  msg: WhatsappMessage,
  catalog: CatalogItem[],
  orders: Order[],
): AutoReplyResult {
  const matchedOrder = msg.ordenId ? orders.find((o) => o.id === msg.ordenId) : undefined;
  return decideAutoReply({
    text: msg.texto,
    canal: msg.canal ?? "whatsapp",
    catalog,
    orders,
    matchedOrder,
  });
}
