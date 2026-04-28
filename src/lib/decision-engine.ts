/**
 * Motor de decisión central de Operia.
 *
 * Antes de guardar, responder o cobrar, Operia evalúa:
 *   catálogo + variante + sabor + fecha/hora + tiempo de prep + capacidad + stock + datos.
 *
 * Devuelve una decisión comercial accionable, con mensaje listo para enviar
 * al cliente (humano, comercial, máximo 2 emojis, nunca formulario).
 */

import {
  parseRequestFromText,
  remainingCapacity,
  selectBestOption,
  suggestVariantCombo,
  type CatalogItem,
  type CatalogVariant,
  type ParsedRequest,
} from "./catalog-store";
import type { Order } from "./operia-store";

export type DecisionType =
  | "READY_TO_SELL"
  | "NEEDS_MORE_INFO"
  | "OUT_OF_CATALOG"
  | "CAPACITY_EXCEEDED"
  | "OUT_OF_STOCK"
  | "TIME_NOT_AVAILABLE"
  | "NEEDS_MANUAL_REVIEW";

export type ClosingAction =
  | "SEND_PAYMENT_LINK"
  | "ASK_CONFIRMATION"
  | "OFFER_ALTERNATIVE"
  | "ASK_MINIMAL_INFO";

export type RiskLevelDec = "low" | "medium" | "high";

export type MissingField =
  | "fecha"
  | "hora"
  | "producto"
  | "direccion"
  | "contacto"
  | "pago";

export interface DecisionAlternative {
  label: string;                       // Texto humano para mostrar/sugerir
  itemId?: string;
  variantId?: string;
  cantidad?: number;
  precioEstimado?: number;
  fechaSugerida?: string;
}

export interface OrderDecision {
  decisionType: DecisionType;
  canCharge: boolean;
  riskLevel: RiskLevelDec;
  missingFields: MissingField[];
  recommendedAction: string;           // texto interno para el operador
  customerMessage: string;             // mensaje listo para el cliente
  alternatives: DecisionAlternative[];
  // Contexto interno
  matchedItem?: CatalogItem;
  matchedVariant?: CatalogVariant;
  reason: string;                      // motivo corto para UI
  parsed: ParsedRequest;
}

export interface BusinessConfig {
  nombre?: string;
  // Reservado para reglas futuras (mín. anticipo, etc.)
}

/* ============== Helpers ============== */

function pickVariant(item: CatalogItem, parsed: ParsedRequest): CatalogVariant | undefined {
  const vs = item.variantesDetalle || [];
  if (vs.length === 0) return undefined;
  if (parsed.personas != null) {
    // Variante exacta o la más pequeña que cubra
    const exact = vs.find((v) => v.personas === parsed.personas);
    if (exact) return exact;
    const fits = vs.filter((v) => v.personas >= parsed.personas!).sort((a, b) => a.personas - b.personas);
    if (fits[0]) return fits[0];
    return undefined; // ninguna variante cubre — se evaluará como CAPACITY_EXCEEDED
  }
  return vs[0];
}

function maxPersonasInItem(item: CatalogItem): number {
  const vs = item.variantesDetalle || [];
  return vs.reduce((max, v) => Math.max(max, v.personas || 0), 0);
}

function flavorAvailable(variant: CatalogVariant | undefined, item: CatalogItem, sabor?: string): boolean {
  if (!sabor) return true;
  const pool = (variant?.sabores?.length ? variant.sabores : item.opciones) || [];
  if (pool.length === 0) return true; // sin restricción
  return pool.some(
    (s) => s.toLowerCase().includes(sabor.toLowerCase()) || sabor.toLowerCase().includes(s.toLowerCase()),
  );
}

function findClosestProduct(catalog: CatalogItem[], parsed: ParsedRequest): CatalogItem | undefined {
  if (!parsed.productoTexto) return undefined;
  const key = parsed.productoTexto.toLowerCase();
  return catalog.find((c) =>
    (c.nombre + " " + c.descripcion).toLowerCase().includes(key),
  );
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-MX");
}

function dateLabel(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  } catch { return iso; }
}

/* ============== Evaluación principal ============== */

export interface EvaluateInput {
  order: Order;
  catalog: CatalogItem[];
  allOrders?: Order[];
  business?: BusinessConfig;
}

export function evaluateOrderDecision(input: EvaluateInput): OrderDecision {
  const { order, catalog, allOrders = [] } = input;

  const text = [order.mensajeOriginal, order.descripcion, order.detalles].filter(Boolean).join(" — ");
  const parsed = parseRequestFromText(text);
  if (order.fechaEntrega) parsed.fechaISO = order.fechaEntrega;
  if (order.horaEntrega) parsed.hora = order.horaEntrega;
  const cantidadOrden = order.cantidad ? parseInt(order.cantidad, 10) : undefined;
  if (Number.isFinite(cantidadOrden)) parsed.cantidad = cantidadOrden;

  // Limpia sabor: solo primera palabra significativa
  if (parsed.sabor) {
    parsed.sabor = parsed.sabor.split(/\s+/).find((w) => w.length > 2) || parsed.sabor;
  }

  const fullText = (text || "").trim();
  const meaningful = fullText.split(/\s+/).filter((w) => w.length > 3).length;

  // Sin texto útil — revisión manual / pedir más info
  if (!parsed.productoTexto && !order.descripcion?.trim() && meaningful < 2) {
    return askForMoreInfo({
      parsed,
      order,
      ask: ["producto", parsed.fechaISO ? null : "fecha"].filter(Boolean) as MissingField[],
      reason: "Mensaje muy general",
      humanIntro: "Claro 🙌 Cuéntame un poco más para ayudarte:",
    });
  }

  // A. Producto existe
  const matched = findClosestProduct(catalog, parsed);
  if (!matched) {
    const top = catalog.filter((c) => c.disponible).slice(0, 3);
    const opciones = top.map((c) => `• ${c.nombre}${c.precioBase ? ` — desde ${fmt(c.precioBase)}` : ""}`).join("\n");
    return {
      decisionType: "OUT_OF_CATALOG",
      canCharge: false,
      riskLevel: "high",
      missingFields: [],
      recommendedAction: "Ofrecer opciones del catálogo",
      reason: parsed.productoTexto
        ? `"${parsed.productoTexto}" no está en el catálogo`
        : "No identificamos el producto pedido",
      parsed,
      alternatives: top.map((c) => ({
        label: `${c.nombre}${c.precioBase ? ` (${fmt(c.precioBase)})` : ""}`,
        itemId: c.id,
        precioEstimado: c.precioBase,
      })),
      customerMessage: top.length
        ? `Hola 😊 Justo eso no lo manejamos, pero te puedo ofrecer:\n\n${opciones}\n\n¿Te late alguna y te aparto?`
        : `Hola 😊 Justo eso no lo manejamos por ahora. ¿Quieres que te avise cuando tengamos algo similar?`,
    };
  }

  // B. Variante / tamaño
  const variant = pickVariant(matched, parsed);
  const maxPers = maxPersonasInItem(matched);

  if (parsed.personas && maxPers > 0 && parsed.personas > maxPers) {
    // CAPACITY_EXCEEDED — sugerir combinación
    const combo = suggestVariantCombo(catalog, parsed.personas, parsed.fechaISO, allOrders, {
      sabor: parsed.sabor,
    });
    const altList: DecisionAlternative[] = [];
    let comboTxt = "";
    if (combo) {
      comboTxt = combo.pieces
        .map((p) => `${p.cantidad} × ${p.item.nombre} (${p.variant.nombre})`)
        .join(" + ");
      altList.push({
        label: `${comboTxt} — ${fmt(combo.totalPrecio)} para ${combo.totalPersonas} personas`,
        precioEstimado: combo.totalPrecio,
      });
    }
    return {
      decisionType: "CAPACITY_EXCEEDED",
      canCharge: false,
      riskLevel: "high",
      missingFields: [],
      recommendedAction: "Sugerir combinación de productos",
      matchedItem: matched,
      reason: `Pidió para ${parsed.personas} personas; máximo por unidad: ${maxPers}`,
      parsed,
      alternatives: altList,
      customerMessage: combo
        ? `Para ${parsed.personas} personas no tenemos un solo ${matched.nombre.toLowerCase()} de ese tamaño, pero sí podemos cubrirlo con ${comboTxt} (${fmt(combo.totalPrecio)}) 🎂\n\n¿Te lo aparto así o prefieres que ajustemos?`
        : `Para ${parsed.personas} personas no tenemos un solo ${matched.nombre.toLowerCase()} de ese tamaño. ¿Quieres que te proponga una combinación o lo ajustamos a un grupo más chico?`,
    };
  }

  // C. Sabor / opción
  if (parsed.sabor && !flavorAvailable(variant, matched, parsed.sabor)) {
    const sabores = (variant?.sabores?.length ? variant.sabores : matched.opciones) || [];
    return {
      decisionType: "OUT_OF_CATALOG",
      canCharge: false,
      riskLevel: "medium",
      missingFields: [],
      recommendedAction: "Ofrecer sabores disponibles",
      matchedItem: matched,
      matchedVariant: variant,
      reason: `Sabor "${parsed.sabor}" no disponible`,
      parsed,
      alternatives: sabores.slice(0, 4).map((s) => ({ label: s, itemId: matched.id, variantId: variant?.id })),
      customerMessage: `¡Buena elección! 🙌 De ${matched.nombre.toLowerCase()} ese sabor no lo manejamos, pero sí tenemos ${sabores.join(", ")}. ¿Cuál te late?`,
    };
  }

  // D. Fecha / hora claras
  const missing: MissingField[] = [];
  if (!order.fechaEntrega) missing.push("fecha");
  if (!order.horaEntrega) missing.push("hora");

  // E. Tiempo de preparación / anticipación
  if (order.fechaEntrega) {
    const targetISO = order.horaEntrega
      ? `${order.fechaEntrega}T${order.horaEntrega}:00`
      : `${order.fechaEntrega}T12:00:00`;
    const target = new Date(targetISO).getTime();
    const horas = (target - Date.now()) / 3_600_000;
    const minHoras =
      (matched.anticipacionHoras || 0) +
      ((variant?.tiempoPreparacion || matched.prepMinutos || 0) / 60);
    if (Number.isFinite(horas) && horas < minHoras && horas > -24) {
      // Sugerir siguiente fecha disponible (mismo item, +1 día)
      const next = new Date();
      const minMs = minHoras * 3_600_000;
      next.setTime(Date.now() + minMs + 6 * 3_600_000);
      const sugerida = next.toISOString().slice(0, 10);
      return {
        decisionType: "TIME_NOT_AVAILABLE",
        canCharge: false,
        riskLevel: "high",
        missingFields: [],
        recommendedAction: "Sugerir otra fecha que respete preparación",
        matchedItem: matched,
        matchedVariant: variant,
        reason: `Necesita ${Math.round(minHoras)}h de anticipación`,
        parsed,
        alternatives: [{ label: `Mover a ${dateLabel(sugerida)}`, fechaSugerida: sugerida }],
        customerMessage: `Para tu ${matched.nombre.toLowerCase()} necesitamos al menos ${Math.round(minHoras)}h de preparación 🙌 ¿Te funciona si lo dejamos para ${dateLabel(sugerida)}?`,
      };
    }
  }

  // F. Capacidad para esa fecha
  if (order.fechaEntrega) {
    const restante = remainingCapacity(matched, order.fechaEntrega, allOrders.filter((o) => o.id !== order.id));
    if (restante <= 0) {
      // sugerir +1 día
      const d = new Date(order.fechaEntrega + "T12:00:00");
      d.setDate(d.getDate() + 1);
      const sugerida = d.toISOString().slice(0, 10);
      return {
        decisionType: "CAPACITY_EXCEEDED",
        canCharge: false,
        riskLevel: "high",
        missingFields: [],
        recommendedAction: "Sugerir otra fecha disponible",
        matchedItem: matched,
        matchedVariant: variant,
        reason: `Sin capacidad para ${order.fechaEntrega}`,
        parsed,
        alternatives: [{ label: `Mover a ${dateLabel(sugerida)}`, fechaSugerida: sugerida }],
        customerMessage: `Para ${dateLabel(order.fechaEntrega)} ya no tenemos espacio de ${matched.nombre.toLowerCase()} 🙏 ¿Te late si lo dejamos para ${dateLabel(sugerida)}?`,
      };
    }
  }

  // G. Stock disponible
  if (matched.stockDisponible > 0) {
    const necesario = parsed.cantidad ?? 1;
    if (necesario > matched.stockDisponible) {
      // Buscar mejor alternativa
      const best = selectBestOption(catalog, { personas: parsed.personas, sabor: parsed.sabor, fechaISO: order.fechaEntrega, hora: order.horaEntrega }, allOrders);
      const alts: DecisionAlternative[] = best && best.item.id !== matched.id
        ? [{ label: `${best.item.nombre} (${best.variant.nombre}) — ${fmt(best.variant.precio)}`, itemId: best.item.id, variantId: best.variant.id, precioEstimado: best.variant.precio }]
        : [];
      return {
        decisionType: "OUT_OF_STOCK",
        canCharge: false,
        riskLevel: "high",
        missingFields: [],
        recommendedAction: "Ofrecer alternativa o nueva fecha",
        matchedItem: matched,
        matchedVariant: variant,
        reason: `Solo ${matched.stockDisponible} disponibles`,
        parsed,
        alternatives: alts,
        customerMessage: `Justo de ${matched.nombre.toLowerCase()} solo quedan ${matched.stockDisponible} disponibles 😅 ${alts[0] ? `¿Te late ${alts[0].label}?` : "¿Quieres que veamos otra fecha?"}`,
      };
    }
  }

  // D-bis. Si faltan datos, pide MÁXIMO 2 (prioridad: fecha/hora → producto → dirección/recolección → contacto → pago)
  if (missing.length > 0) {
    const hasContacto = !!(order.telefono || order.canalUserId);
    if (!hasContacto) missing.push("contacto");
    return askForMoreInfo({
      parsed,
      order,
      matched,
      variant,
      ask: missing.slice(0, 2),
      reason: "Faltan datos clave para cerrar",
      humanIntro: variant
        ? `¡Sí podemos hacer tu ${matched.nombre.toLowerCase()} (${variant.nombre})! 🙌`
        : `¡Sí podemos hacer tu ${matched.nombre.toLowerCase()}! 🙌`,
    });
  }

  // H. Datos mínimos para cobrar
  const hasDireccion = !!order.direccion?.trim();
  const hasContacto = !!(order.telefono || order.canalUserId);
  if (!hasDireccion || !hasContacto) {
    const ask: MissingField[] = [];
    if (!hasDireccion) ask.push("direccion");
    if (!hasContacto) ask.push("contacto");
    return askForMoreInfo({
      parsed,
      order,
      matched,
      variant,
      ask: ask.slice(0, 2),
      reason: "Cierre listo, solo falta confirmar logística",
      humanIntro: variant
        ? `¡Perfecto! Sí podemos hacer tu ${matched.nombre.toLowerCase()} (${variant.nombre}) para ${dateLabel(order.fechaEntrega)}${order.horaEntrega ? ` a las ${order.horaEntrega}` : ""} 🎂`
        : `¡Perfecto! Sí podemos hacerlo 🎂`,
    });
  }

  // I. Todo OK → READY_TO_SELL
  const precio = variant?.precio || matched.precioBase || order.precio || 0;
  const fechaTxt = `${dateLabel(order.fechaEntrega)}${order.horaEntrega ? ` a las ${order.horaEntrega}` : ""}`;
  const cierreTxt = variant
    ? `tu ${matched.nombre.toLowerCase()} (${variant.nombre})`
    : `tu ${matched.nombre.toLowerCase()}`;

  return {
    decisionType: "READY_TO_SELL",
    canCharge: true,
    riskLevel: "low",
    missingFields: [],
    recommendedAction: "Generar link de pago y cerrar venta",
    matchedItem: matched,
    matchedVariant: variant,
    reason: "Todo validado",
    parsed,
    alternatives: [],
    customerMessage: order.pago === "pagado"
      ? `¡Listo! Tu pedido para ${fechaTxt} ya está confirmado 🙌 Cualquier cosa te aviso por aquí.`
      : `¡Perfecto! Sí podemos hacer ${cierreTxt} para ${fechaTxt} 🎂 Para apartarlo${precio ? ` (${fmt(precio)})` : ""}, te paso el link de pago en un momento.`,
  };
}

/* ============== NEEDS_MORE_INFO builder ============== */

function askForMoreInfo(args: {
  parsed: ParsedRequest;
  order: Order;
  ask: MissingField[];
  reason: string;
  humanIntro: string;
  matched?: CatalogItem;
  variant?: CatalogVariant;
}): OrderDecision {
  const { ask, reason, humanIntro, matched, variant, parsed } = args;
  const limited = ask.slice(0, 2);

  const partes: string[] = [];
  for (const f of limited) {
    switch (f) {
      case "fecha": partes.push("para qué fecha lo necesitas"); break;
      case "hora": partes.push("a qué hora te queda mejor"); break;
      case "producto": partes.push("qué producto te interesa"); break;
      case "direccion": partes.push("si sería entrega o recolección"); break;
      case "contacto": partes.push("un número de WhatsApp para coordinar"); break;
      case "pago": partes.push("cómo prefieres pagar"); break;
    }
  }
  const pregunta = partes.length === 1
    ? `¿Me confirmas ${partes[0]}?`
    : `¿Me confirmas ${partes[0]} y ${partes[1]}?`;

  return {
    decisionType: "NEEDS_MORE_INFO",
    canCharge: false,
    riskLevel: "medium",
    missingFields: limited,
    recommendedAction: `Pedir: ${limited.join(", ")}`,
    matchedItem: matched,
    matchedVariant: variant,
    reason,
    parsed,
    alternatives: [],
    customerMessage: `${humanIntro} ${pregunta}`,
  };
}

/* ============== Labels para UI ============== */

export const DECISION_LABEL: Record<DecisionType, string> = {
  READY_TO_SELL: "Listo para vender",
  NEEDS_MORE_INFO: "Falta confirmar algo",
  OUT_OF_CATALOG: "Fuera de catálogo",
  CAPACITY_EXCEEDED: "Excede capacidad",
  OUT_OF_STOCK: "Sin stock",
  TIME_NOT_AVAILABLE: "Tiempo insuficiente",
  NEEDS_MANUAL_REVIEW: "Requiere revisión",
};

export const DECISION_TONE: Record<DecisionType, "success" | "warning" | "danger" | "muted"> = {
  READY_TO_SELL: "success",
  NEEDS_MORE_INFO: "warning",
  OUT_OF_CATALOG: "danger",
  CAPACITY_EXCEEDED: "danger",
  OUT_OF_STOCK: "danger",
  TIME_NOT_AVAILABLE: "warning",
  NEEDS_MANUAL_REVIEW: "muted",
};
