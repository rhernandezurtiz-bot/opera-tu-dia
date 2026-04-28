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
  selectBestOption,
  suggestVariantCombo,
  remainingCapacity,
  type CatalogItem,
  type CatalogValidation,
  type ScoredOption,
  type ComboSuggestion,
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
  // Aprendizaje
  productoDetectado?: string;
  productoId?: string;
  varianteId?: string;
  precioEstimado?: number;
}

/* --------------------- Helpers de catálogo / alternativas ----------------- */

function formatCombo(combo: ComboSuggestion): string {
  const partes = combo.pieces.map((p) =>
    p.cantidad > 1
      ? `${p.cantidad} ${p.variant.nombre.toLowerCase()}`
      : `1 ${p.variant.nombre.toLowerCase()}`,
  );
  const lista = partes.length === 1
    ? partes[0]
    : `${partes.slice(0, -1).join(", ")} + ${partes[partes.length - 1]}`;
  const precio = combo.totalPrecio
    ? ` ($${combo.totalPrecio.toLocaleString("es-MX")} total)`
    : "";
  return `${lista}${precio}`;
}

function formatBest(best: ScoredOption): string {
  const precio = best.variant.precio
    ? ` ($${best.variant.precio.toLocaleString("es-MX")})`
    : "";
  return `${best.item.nombre} — ${best.variant.nombre}${precio}`;
}

function nextAvailableDate(item: CatalogItem, orders: Order[]): string | null {
  // Próxima fecha que respete prepMinutos + anticipacionHoras, día disponible y capacidad libre
  const minMs = (item.anticipacionHoras * 60 + item.prepMinutos) * 60 * 1000;
  const base = new Date(Date.now() + minMs);
  const map: ("dom"|"lun"|"mar"|"mie"|"jue"|"vie"|"sab")[] = ["dom","lun","mar","mie","jue","vie","sab"];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const dk = map[d.getDay()];
    if (item.diasDisponibles.length > 0 && !item.diasDisponibles.includes(dk)) continue;
    const iso = d.toISOString().slice(0, 10);
    if (remainingCapacity(item, iso, orders) > 0) {
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

  const sabor = validation.parsed.sabor;
  const fechaISO = matchedOrder?.fechaEntrega || draftOrder?.fechaEntrega;

  // 1. Producto no existe en catálogo → recomendar la mejor opción disponible
  if (p.producto || (!m && validation.parsed.productoTexto)) {
    const best = selectBestOption(catalog, { personas, sabor, fechaISO, tipo: draftOrder?.tipo }, orders);
    if (best) {
      return finalize(intent, "sin_disponibilidad", canal,
        `Hola 👋 Eso no lo manejamos, pero te recomiendo: ${formatBest(best)}. ${capitalize(best.reason)}. ¿Te lo aparto?`,
        { validation, draftOrder });
    }
    const opciones = buildAlternativeOffer(catalog);
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Eso no lo manejamos, pero te puedo ofrecer:\n\n${stripHeader(opciones)}\n\n¿Te late alguna?`,
      { validation, draftOrder });
  }

  // 2. Capacidad excedida (ej. 25 personas, máx 12) → combinación real de variantes
  if (p.capacidad && m && personas) {
    const combo = suggestVariantCombo(catalog, personas, fechaISO, orders, { sabor, tipo: draftOrder?.tipo });
    if (combo) {
      return finalize(intent, "sin_disponibilidad", canal,
        `Hola 👋 Para ${personas} personas no manejamos ese tamaño, pero puedo armarte ${formatCombo(combo)}. ¿Te funciona?`,
        { validation, draftOrder });
    }
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Para ${personas} personas no manejamos ese tamaño. ¿Quieres que te proponga varias piezas que sumen el total?`,
      { validation, draftOrder });
  }

  // 3. Stock insuficiente → mejor alternativa disponible
  if (p.stock && m) {
    const best = selectBestOption(catalog, { personas, sabor, fechaISO, tipo: draftOrder?.tipo }, orders);
    if (best && best.item.id !== m.id) {
      return finalize(intent, "sin_disponibilidad", canal,
        `Hola 👋 Justo se nos agotó ${m.nombre.toLowerCase()}. Lo que sí tengo: ${formatBest(best)}. ¿Te lo aparto?`,
        { validation, draftOrder });
    }
    const alt = buildAlternativeOffer(catalog, draftOrder?.tipo);
    return finalize(intent, "sin_disponibilidad", canal,
      `Hola 👋 Justo se nos agotó ${m.nombre.toLowerCase()}. Lo que sí tengo:\n\n${stripHeader(alt)}\n\n¿Te interesa alguno?`,
      { validation, draftOrder });
  }

  // 4. Tiempo de preparación / anticipación insuficiente → próxima fecha real
  if ((p.anticipacion || p.prep) && m) {
    const next = nextAvailableDate(m, orders);
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

  // 7. Capacidad diaria llena → siguiente fecha con cupo real
  if (p.capacidadDiaria && m) {
    const next = nextAvailableDate(m, orders);
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
    const escasez = scarcityHint(m, orders, order.fechaEntrega);
    return finalize(intent, "faltan_datos", canal,
      `¡Sí podemos! 🙌 ${capitalize(resumen)}.${escasez ? `\n\n${escasez}` : ""}\n\nPásame ${lista} y te mando el link de pago al instante.`,
      { validation, draftOrder });
  }

  // --- A. TODO disponible → cerrar venta con urgencia ligera + escasez + anticipo ---
  const resumen = m ? buildOrderSummary(m, validation, order) : "tu pedido";
  const fecha = order.fechaEntrega ? prettyDate(order.fechaEntrega) : "la fecha que necesitas";
  const hora = order.horaEntrega ? ` a las ${order.horaEntrega}` : "";
  const cobro = paymentHint(m, order);
  const escasez = scarcityHint(m, orders, order.fechaEntrega);

  const bestForLog = selectBestOption(catalog, { personas, sabor, fechaISO, tipo: draftOrder?.tipo }, orders);
  return finalize(intent, "venta_posible", canal,
    `¡Sí, va! 🙌 Te aparto ${resumen} para ${fecha}${hora}.${cobro ? `\n\n${cobro}` : ""}${escasez ? `\n${escasez}` : ""}\n\nConfirma y te mando el link de pago para asegurarlo ✨`,
    {
      validation, draftOrder,
      productoDetectado: m?.nombre,
      productoId: m?.id,
      varianteId: bestForLog?.variant.id,
      precioEstimado: bestForLog?.variant.precio ?? m?.precioBase,
    });
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Mensaje de escasez basado en stock o capacidad diaria restante.
 * Devuelve "" si no aplica.
 */
function scarcityHint(item: CatalogItem | undefined, orders: Order[], fechaISO?: string): string {
  if (!item) return "";
  if (item.stockDisponible > 0 && item.stockDisponible <= 3) {
    return `⚡ Solo quedan ${item.stockDisponible} disponibles.`;
  }
  if (item.capacidadDiaria > 0 && fechaISO) {
    const usados = orders.filter(
      (o) => o.fechaEntrega === fechaISO && o.estado !== "cancelado",
    ).length;
    const libres = item.capacidadDiaria - usados;
    if (libres > 0 && libres <= 2) {
      return `⚡ Solo quedan ${libres} cupo${libres === 1 ? "" : "s"} para esa fecha.`;
    }
  }
  return "";
}

/**
 * Sugerencia de cobro: anticipo si supera umbral, total si no.
 */
function paymentHint(item: CatalogItem | undefined, order: Order): string {
  const total = order.precio || item?.precioBase || 0;
  if (!total) return "";
  const UMBRAL = 1500;
  const PCT = 50;
  if (total >= UMBRAL) {
    const anticipo = Math.round((total * PCT) / 100);
    return `Total: $${total.toLocaleString("es-MX")} · Apartas con $${anticipo.toLocaleString("es-MX")} de anticipo (${PCT}%).`;
  }
  return `Total: $${total.toLocaleString("es-MX")}.`;
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
