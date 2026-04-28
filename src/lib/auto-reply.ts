/**
 * Motor de decisión + respuestas automáticas multicanal.
 *
 * Antes de generar cualquier respuesta, este motor:
 *   1. Detecta intención del mensaje
 *   2. Valida contra catálogo (producto existe)
 *   3. Valida capacidad (personas / cantidad vs tamaño máximo)
 *   4. Valida stock disponible
 *   5. Valida tiempo de preparación / anticipación
 *   6. Valida día y horario
 *   7. Si TODO está disponible → cierra venta y ofrece link de pago
 *   8. Si faltan datos críticos → pide SOLO lo mínimo
 *   9. Si algo falla → ofrece alternativa concreta del catálogo
 *
 * Tono: vendedor experto, natural, sin preguntas innecesarias.
 * Regla dura: nunca cobrar sin disponibilidad confirmada.
 */

import type {
  Channel,
  Order,
  WhatsappMessage,
  AutoReplyIntent,
  AutoReplyDecision,
} from "./operia-store";
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

/* ----------------------------- Decisión ---------------------------------- */

export interface DecideInput {
  text: string;
  canal: Channel;
  catalog: CatalogItem[];
  orders: Order[];
  matchedOrder?: Order;
}

export interface AutoReplyResult {
  intent: AutoReplyIntent;
  decision: AutoReplyDecision;
  message: string;          // ya adaptado al canal
  needsReview: boolean;
  validation?: CatalogValidation;
  draftOrder?: Order;
}

/* --------------------- Helpers de catálogo / alternativas ----------------- */

function capacityNumber(cap: string): number | null {
  const m = (cap || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Sugiere combinación de productos para cubrir N personas usando los items
 * disponibles del catálogo. Ej: 25 personas con tope de 12 → "2 de 12 + 1 chico".
 */
function suggestCombo(catalog: CatalogItem[], personas: number, match?: CatalogItem): string | null {
  if (!personas || personas <= 0) return null;
  const candidates = catalog
    .filter((c) => c.disponible && capacityNumber(c.capacidad))
    .map((c) => ({ item: c, cap: capacityNumber(c.capacidad)! }))
    .sort((a, b) => b.cap - a.cap);
  if (candidates.length === 0) return null;

  const big = match
    ? candidates.find((c) => c.item.id === match.id) ?? candidates[0]
    : candidates[0];
  const n = Math.floor(personas / big.cap);
  const resto = personas - n * big.cap;

  if (n >= 1 && resto === 0) {
    return `${n} ${big.item.nombre.toLowerCase()}`;
  }
  if (n >= 1 && resto > 0) {
    const small = candidates
      .filter((c) => c.cap >= resto && c.cap < big.cap)
      .pop() // más chico que cubra el resto
      ?? candidates[candidates.length - 1];
    return `${n} ${big.item.nombre.toLowerCase()} + 1 ${small.item.nombre.toLowerCase()} (cubre los ${resto} restantes)`;
  }
  return null;
}

function nextAvailableDate(item: CatalogItem): string | null {
  // Próxima fecha que respete prepMinutos + anticipacionHoras y caiga en día disponible
  const minMs = (item.anticipacionHoras * 60 + item.prepMinutos) * 60 * 1000;
  const base = new Date(Date.now() + minMs);
  const map: ("dom"|"lun"|"mar"|"mie"|"jue"|"vie"|"sab")[] = ["dom","lun","mar","mie","jue","vie","sab"];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const dk = map[d.getDay()];
    if (item.diasDisponibles.length === 0 || item.diasDisponibles.includes(dk)) {
      return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
    }
  }
  return null;
}

/* ----------------------------- Motor principal ---------------------------- */

export function decideAutoReply(input: DecideInput): AutoReplyResult {
  const { text, canal, catalog, orders, matchedOrder } = input;
  const intent = detectIntent(text);

  // --- E. Pago ya confirmado ---
  if (matchedOrder?.pago === "pagado") {
    const fecha = matchedOrder.fechaEntrega || "la fecha acordada";
    return finalize(intent, "ya_pago", canal,
      `¡Listo! 🙌\n\nTu pago quedó confirmado. Te apartamos para ${fecha}.\nCualquier cosa por aquí estoy.`);
  }

  // --- D. Link enviado, pendiente de pago ---
  if (matchedOrder?.paymentLink && matchedOrder.pago === "link_enviado") {
    return finalize(intent, "listo_cobrar", canal,
      `Aquí te dejo el link de pago para apartarlo:\n${matchedOrder.paymentLink}\n\nEn cuanto se confirme, queda asegurado automáticamente 🙌`);
  }

  // --- Validar contra catálogo ---
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

  const m = validation.match;
  const p = validation.problems;
  const personas = validation.parsed.personas;

  // --- B. Bloqueos duros → respuestas específicas con alternativa ---

  // 1. Producto no existe en catálogo
  if (p.producto || (!m && validation.parsed.productoTexto)) {
    const opciones = buildAlternativeOffer(catalog);
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Por ahora no manejamos eso, pero te puedo ofrecer:\n\n${stripHeader(opciones)}\n\n¿Te late alguna?`,
      { validation, draftOrder });
  }

  // 2. Capacidad excedida (ej. 25 personas, máx 12)
  if (p.capacidad && m && personas) {
    const combo = suggestCombo(catalog, personas, m);
    const alt = combo
      ? `puedo ofrecerte ${combo}`
      : `puedo ofrecerte varias piezas para cubrir el total`;
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Para ${personas} personas no manejamos ese tamaño, pero ${alt}. ¿Te funciona?`,
      { validation, draftOrder });
  }

  // 3. Stock insuficiente
  if (p.stock && m) {
    const alt = buildAlternativeOffer(catalog, draftOrder?.tipo);
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Justo se nos agotó ${m.nombre.toLowerCase()}. Lo que sí tengo disponible:\n\n${stripHeader(alt)}\n\n¿Te interesa alguno?`,
      { validation, draftOrder });
  }

  // 4. Tiempo de preparación / anticipación insuficiente
  if ((p.anticipacion || p.prep) && m) {
    const next = nextAvailableDate(m);
    const cuando = next ? `la fecha más cercana sería el ${next}` : `necesitamos un poco más de tiempo`;
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Para esa fecha ya no alcanzamos a prepararlo, pero ${cuando}. ¿Te lo aparto?`,
      { validation, draftOrder });
  }

  // 5. Día no disponible
  if (p.dia && m) {
    const dias = m.diasDisponibles.length ? m.diasDisponibles.join(", ") : "lunes a sábado";
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Ese día no trabajamos, pero te lo puedo apartar para otro día (${dias}). ¿Cuál te acomoda?`,
      { validation, draftOrder });
  }

  // 6. Horario fuera de rango
  if (p.horario && m) {
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 A esa hora no entregamos, manejamos de ${m.horarioDesde} a ${m.horarioHasta}. ¿A qué hora dentro de ese rango te lo dejo?`,
      { validation, draftOrder });
  }

  // 7. Capacidad diaria llena
  if (p.capacidadDiaria && m) {
    const next = nextAvailableDate(m);
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Para esa fecha ya no tenemos cupo, pero ${next ? `te lo aparto para el ${next}` : `te ofrezco la siguiente fecha disponible`}. ¿Va?`,
      { validation, draftOrder });
  }

  // 8. Sabor / opción no disponible
  if (p.opcion && m && m.opciones.length > 0) {
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Ese sabor no lo manejamos, pero sí tengo: ${m.opciones.join(", ")}. ¿Cuál prefieres?`,
      { validation, draftOrder });
  }

  // 9. Variante no disponible
  if (p.variante && m && m.variantes.length > 0) {
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Esa variante no la manejamos, pero sí: ${m.variantes.join(", ")}. ¿Cuál te late?`,
      { validation, draftOrder });
  }

  // 10. Producto marcado no disponible
  if (p.disponible && m) {
    const alt = buildAlternativeOffer(catalog, draftOrder?.tipo);
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Justo ${m.nombre.toLowerCase()} no está disponible ahora. Lo que sí tengo:\n\n${stripHeader(alt)}\n\n¿Te interesa?`,
      { validation, draftOrder });
  }

  // --- Ambiguo / sin match → revisión manual ---
  if (validation.availability === "revision" || intent === "desconocido") {
    return finalize(intent, "requiere_revision", canal,
      `¡Hola! 😊 Gracias por escribir. En un momento te confirmo todos los detalles 🙌`,
      { validation, draftOrder, needsReview: true });
  }

  // --- C. Faltan datos mínimos ---
  const order = matchedOrder ?? draftOrder!;
  // Solo lo MÍNIMO necesario para cerrar: hora si no hay, dirección si es entrega
  const faltantesMinimos: string[] = [];
  if (!order.fechaEntrega) faltantesMinimos.push("la fecha");
  else if (!order.horaEntrega && order.tipo !== "producto") faltantesMinimos.push("la hora");
  if (order.tipo === "producto" && /entrega|domicilio|env[ií]o/i.test(text) && !order.direccion) {
    faltantesMinimos.push("la dirección de entrega");
  }
  // No pedimos pago aquí (eso va en el cierre)

  if (faltantesMinimos.length > 0) {
    const lista = listFormat(faltantesMinimos);
    const resumen = m ? buildOrderSummary(m, validation, order) : "tu pedido";
    return finalize(intent, "faltan_datos", canal,
      `¡Hola! 👋 Sí podemos hacer ${resumen}.\n\nPara apartarlo solo necesito ${lista} y te paso el link de pago 🙌`,
      { validation, draftOrder });
  }

  // --- A. TODO disponible → cerrar venta directo con link de pago ---
  const resumen = m ? buildOrderSummary(m, validation, order) : "tu pedido";
  const fecha = order.fechaEntrega ? prettyDate(order.fechaEntrega) : "la fecha que necesitas";
  const hora = order.horaEntrega ? ` a las ${order.horaEntrega}` : "";
  const precio = m?.precioBase ? `\n\nTotal: $${m.precioBase.toLocaleString("es-MX")}` : "";

  return finalize(intent, "venta_posible", canal,
    `¡Hola! 👋 Sí podemos hacer ${resumen} para ${fecha}${hora}.${precio}\n\nEn cuanto confirmes, te paso el link de pago para apartarlo 🙌`,
    { validation, draftOrder });
}

/* ----------------------------- Helpers UI / texto ------------------------- */

function listFormat(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function stripHeader(s: string): string {
  // Quitar saludo "Hola 😊\n\n" si viene de buildAlternativeOffer
  return s.replace(/^Hola[^\n]*\n+/, "").trim();
}

function prettyDate(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return iso;
  }
}

function buildOrderSummary(item: CatalogItem, v: CatalogValidation, order: Order): string {
  const parts: string[] = [];
  // tamaño / personas
  if (v.parsed.personas) parts.push(`para ${v.parsed.personas} personas`);
  else if (item.capacidad) parts.push(`de ${item.capacidad}`);
  // sabor
  const sabor = v.parsed.sabor ?? extractSabor(order.descripcion + " " + order.detalles, item.opciones);
  const base = item.nombre.toLowerCase();
  let frase = `tu ${base}`;
  if (parts.length > 0) frase = `tu ${item.nombre.toLowerCase().split(" ")[0]} ${parts.join(" ")}`;
  if (sabor) frase += ` sabor ${sabor}`;
  return frase;
}

function extractSabor(text: string, opciones: string[]): string | null {
  const lower = text.toLowerCase();
  for (const o of opciones) {
    if (lower.includes(o.toLowerCase())) return o.toLowerCase();
  }
  return null;
}

/* ----------------------------- Finalizador -------------------------------- */

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
