import { create } from "zustand";
import { todayStr, type Order } from "./operia-store";

interface UI {
  newOrderOpen: boolean;
  openNewOrder: () => void;
  closeNewOrder: () => void;
}

export const useUI = create<UI>((set) => ({
  newOrderOpen: false,
  openNewOrder: () => set({ newOrderOpen: true }),
  closeNewOrder: () => set({ newOrderOpen: false }),
}));

// Urgency: tells you how soon something is due, in human Spanish.
export function urgency(fecha: string, hora: string): { label: string; tone: "danger" | "warning" | "muted" | "success"; minutes: number | null } {
  if (!fecha) return { label: "Sin fecha", tone: "danger", minutes: null };
  const today = todayStr();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();

  if (fecha === today) {
    if (!hora) return { label: "Hoy · sin hora", tone: "danger", minutes: 0 };
    const [h, m] = hora.split(":").map(Number);
    const due = new Date(); due.setHours(h, m || 0, 0, 0);
    const diff = Math.round((due.getTime() - Date.now()) / 60000);
    if (diff < 0) return { label: `Atrasado ${formatDiff(-diff)}`, tone: "danger", minutes: diff };
    if (diff <= 120) return { label: `Entrega en ${formatDiff(diff)}`, tone: "danger", minutes: diff };
    if (diff <= 360) return { label: `Hoy en ${formatDiff(diff)}`, tone: "warning", minutes: diff };
    return { label: `Hoy a las ${hora}`, tone: "warning", minutes: diff };
  }
  if (fecha === tomorrow) return { label: hora ? `Mañana ${hora}` : "Mañana", tone: "muted", minutes: null };

  const target = new Date(fecha + "T00:00:00");
  const days = Math.ceil((target.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  if (days < 0) return { label: `Vencido hace ${-days}d`, tone: "danger", minutes: null };
  if (days <= 7) return { label: `En ${days} días${hora ? ` · ${hora}` : ""}`, tone: "muted", minutes: null };
  return { label: `${fecha}${hora ? ` · ${hora}` : ""}`, tone: "muted", minutes: null };
}

function formatDiff(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/* ---------- Money ---------- */

export function money(n: number): string {
  return `$${(n || 0).toLocaleString("es-MX")}`;
}

export interface MoneySummary {
  ingresosHoy: number;
  ingresosEnRiesgo: number;
  pedidosSinAnticipo: number;
  montoSinAnticipo: number;
  cobradoHoy: number;
  pedidosCobradosHoy: number;
  pedidosFallidos: number;
  conversionPct: number; // pedidos pagados / pedidos con cobro requerido (últimos 30d)
}

const MS_30D = 1000 * 60 * 60 * 24 * 30;

export function summarizeMoney(orders: Order[]): MoneySummary {
  const today = todayStr();
  let ingresosHoy = 0;
  let ingresosEnRiesgo = 0;
  let pedidosSinAnticipo = 0;
  let montoSinAnticipo = 0;
  let cobradoHoy = 0;
  let pedidosCobradosHoy = 0;
  let pedidosFallidos = 0;
  let conversionDen = 0;
  let conversionNum = 0;
  const cutoff = Date.now() - MS_30D;

  for (const o of orders) {
    if (o.estado === "cancelado") continue;
    const monto = o.precio || 0;
    if (o.fechaEntrega === today && o.estado !== "entregado") ingresosHoy += monto;
    if ((o.riesgo === "alto" || o.riesgo === "medio") && o.estado !== "entregado") {
      ingresosEnRiesgo += monto;
    }
    if (
      (o.pago === "pendiente" || o.pago === "link_enviado" || o.pago === "vencido" || o.pago === "fallido") &&
      o.estado !== "entregado"
    ) {
      pedidosSinAnticipo += 1;
      montoSinAnticipo += monto;
    }
    if (o.pago === "fallido") pedidosFallidos += 1;
    if (o.pago === "pagado" && o.paymentPaidAt) {
      const paidDate = new Date(o.paymentPaidAt).toISOString().slice(0, 10);
      if (paidDate === today) {
        cobradoHoy += monto;
        pedidosCobradosHoy += 1;
      }
    }
    if (o.pago !== "no_requerido" && o.createdAt >= cutoff) {
      conversionDen += 1;
      if (o.pago === "pagado") conversionNum += 1;
    }
  }
  const conversionPct = conversionDen === 0 ? 0 : Math.round((conversionNum / conversionDen) * 100);
  return {
    ingresosHoy,
    ingresosEnRiesgo,
    pedidosSinAnticipo,
    montoSinAnticipo,
    cobradoHoy,
    pedidosCobradosHoy,
    pedidosFallidos,
    conversionPct,
  };
}

/* ---------- Message templates ---------- */

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

// ---------- Helpers de tono conversacional ----------

// Mapea un campo faltante a una pregunta natural y corta (estilo WhatsApp)
const askMap: Record<string, string> = {
  "producto exacto": "qué te gustaría exactamente",
  "cantidad": "cuántas piezas necesitas",
  "fecha": "para qué fecha lo quieres",
  "fecha exacta": "el día exacto",
  "hora": "a qué hora lo necesitas",
  "hora exacta": "la hora",
  "dirección": "si es entrega o lo recoges",
  "dirección completa": "la dirección de entrega",
  "pago": "cómo te queda mejor el pago",
  "contacto": "un número donde contactarte",
};

// Convierte faltantes a bullets cortos (máximo 2)
function topAsks(faltantes: string[]): string[] {
  const priority = ["hora", "hora exacta", "fecha", "fecha exacta", "cantidad", "dirección", "dirección completa", "producto exacto", "contacto", "pago"];
  const lower = (faltantes || []).map((f) => f.toLowerCase());
  const sorted = [...lower].sort((a, b) => {
    const ia = priority.indexOf(a); const ib = priority.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return sorted.slice(0, 2).map((f) => askMap[f] || f);
}

// Frase corta tipo "para este viernes", "para mañana", "para hoy"
function whenPhrase(o: Order): string {
  if (!o.fechaEntrega) return "";
  const today = todayStr();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
  if (o.fechaEntrega === today) return "para hoy";
  if (o.fechaEntrega === tomorrow) return "para mañana";
  const d = new Date(o.fechaEntrega + "T00:00:00");
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const diff = Math.round((d.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  if (diff > 0 && diff <= 7) return `para este ${days[d.getDay()]}`;
  return `para el ${d.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`;
}

// Sustantivo corto del pedido: "tu pastel", "tu cita", "tu pedido"
function itemNoun(o: Order): string {
  const desc = (o.descripcion || "").split(" — ")[0].trim();
  if (o.tipo === "cita") return "tu cita";
  if (o.tipo === "servicio") return desc ? `tu ${desc.toLowerCase()}` : "tu servicio";
  if (desc) return `tu ${desc.toLowerCase()}`;
  return "tu pedido";
}

// Emoji sutil según tipo
function typeEmoji(o: Order): string {
  if (o.tipo === "cita") return "📅";
  if (o.tipo === "servicio") return "✨";
  const d = (o.descripcion || "").toLowerCase();
  if (/pastel|cake|postre|cupcake/.test(d)) return "🎂";
  if (/flor|ramo|bouquet/.test(d)) return "💐";
  if (/comida|almuerzo|cena|menú/.test(d)) return "🍽️";
  return "🙌";
}

// Construye el bloque de "solo necesito confirmar" con bullets (máx 2)
function confirmBlock(asks: string[]): string {
  if (asks.length === 0) return "";
  if (asks.length === 1) {
    return `Para asegurarte la fecha, solo necesito confirmar:\n• ${cap(asks[0])}`;
  }
  return `Para asegurarte la fecha, solo necesito confirmar:\n• ${cap(asks[0])}\n• ${cap(asks[1])}`;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ---------- Builders públicos (nuevo tono) ----------

// Mensaje genérico cuando faltan datos — usado en pocos lugares legacy
export function buildMissingMessage(cliente: string, faltantes: string[]): string {
  const n = firstName(cliente);
  const asks = topAsks(faltantes);
  const intro = `Hola${n ? " " + n : ""} 😊\n\n¡Sí podemos ayudarte! 🙌`;
  const block = confirmBlock(asks);
  const outro = "En cuanto me confirmes, te aparto el lugar.";
  return [intro, block, outro].filter(Boolean).join("\n\n");
}

// Mensaje sugerido inicial — confirma viabilidad, pide 1-2 datos, anuncia pago como siguiente paso natural
export function buildSmartReply(o: Order): string {
  const n = firstName(o.cliente);
  const saludo = `Hola${n ? " " + n : ""} 😊`;
  const cuando = whenPhrase(o);
  const noun = itemNoun(o);
  const emoji = typeEmoji(o);
  const asks = topAsks(o.faltantes || []);

  // Caso 1: tenemos todo → confirmación cálida + pago como siguiente paso natural
  if (asks.length === 0) {
    const linea1 = cuando
      ? `¡${noun.charAt(0).toUpperCase() + noun.slice(1)} queda confirmado ${cuando}! ${emoji}`
      : `¡${noun.charAt(0).toUpperCase() + noun.slice(1)} queda confirmado! ${emoji}`;
    const cierre = o.precio
      ? "Ahora te paso el link para apartarlo y queda todo listo 🙌"
      : "Cualquier detalle adicional me avisas. ¡Gracias!";
    return `${saludo}\n\n${linea1}\n\n${cierre}`;
  }

  // Caso 2: faltan datos → confirmar viabilidad primero, pedir solo 1-2
  const viabilidad = cuando
    ? `¡Sí podemos hacer ${noun} ${cuando}! ${emoji}`
    : `¡Sí podemos ayudarte con ${noun}! ${emoji}`;
  const block = confirmBlock(asks);
  const cierre = "En cuanto me confirmes, te mando el link para apartarlo 🙌";
  return `${saludo}\n\n${viabilidad}\n\n${block}\n\n${cierre}`;
}

// Confirmación final tras tener todos los datos
export function buildConfirmMessage(o: Order): string {
  const n = firstName(o.cliente);
  const noun = itemNoun(o);
  const cuando = whenPhrase(o);
  const hora = o.horaEntrega ? ` a las ${o.horaEntrega}` : "";
  const linea1 = cuando
    ? `¡${noun.charAt(0).toUpperCase() + noun.slice(1)} queda confirmado ${cuando}${hora}! ✅`
    : `¡${noun.charAt(0).toUpperCase() + noun.slice(1)} queda confirmado! ✅`;
  const cierre = o.precio
    ? "Te paso el link de pago y con eso aseguramos tu lugar 🙌"
    : "Cualquier cambio me avisas. ¡Gracias por tu preferencia!";
  return `Hola${n ? " " + n : ""} 😊\n\n${linea1}\n\n${cierre}`;
}

// Recordatorio el día de la entrega/cita
export function buildReminderMessage(o: Order): string {
  const n = firstName(o.cliente);
  const cuando = o.horaEntrega ? `hoy a las ${o.horaEntrega}` : "hoy";
  if (o.tipo === "cita") {
    return `Hola${n ? " " + n : ""} 😊\n\nSolo para confirmar que te esperamos ${cuando} 📅\n\nSi necesitas mover el horario, dime y lo acomodamos.`;
  }
  return `Hola${n ? " " + n : ""} 😊\n\nTu pedido va ${cuando} 🙌\n\n¿Te queda bien la hora de entrega?`;
}

// Mensaje cálido para introducir el pago (cuando el pedido ya está confirmado)
export function buildPaymentMessage(o: Order): string {
  const n = firstName(o.cliente);
  const monto = o.precio ? ` (${money(o.precio)})` : "";
  return `Hola${n ? " " + n : ""} 😊\n\n¡Todo listo de mi lado! Para apartar tu lugar${monto}, te paso el link de pago en un momento 🙌`;
}

// Pedido listo
export function buildReadyMessage(o: Order): string {
  const n = firstName(o.cliente);
  const noun = itemNoun(o);
  return `¡Hola${n ? " " + n : ""}! 🎉\n\n${noun.charAt(0).toUpperCase() + noun.slice(1)} ya está listo. ¿Te queda bien pasar a la hora acordada?`;
}

// Recordatorio de pago / cobro automático — tono cálido, pago como siguiente paso natural
export function buildPaymentReminder(o: Order, opts?: { porcentajeAnticipo?: number }): string {
  const n = firstName(o.cliente);
  const pct = opts?.porcentajeAnticipo ?? 50;
  const total = o.precio || 0;
  const isAnticipo = o.paymentMode === "anticipo";
  const cobro = isAnticipo ? Math.round((total * pct) / 100) : total;
  const montoTxt = cobro ? ` (${money(cobro)})` : "";
  const noun = itemNoun(o);
  const cuando = whenPhrase(o);

  if (o.paymentLink) {
    const intro = cuando
      ? `¡Listo para apartar ${noun} ${cuando}! 🙌`
      : `¡Listo para apartar ${noun}! 🙌`;
    const accion = isAnticipo
      ? `Te dejo el link para el anticipo${montoTxt}:`
      : `Te dejo el link de pago${montoTxt}:`;
    return `Hola${n ? " " + n : ""} 😊\n\n${intro}\n\n${accion}\n${o.paymentLink}`;
  }
  return `Hola${n ? " " + n : ""} 😊\n\nQuería confirmar que tengo todo listo de mi lado para ${noun}${cuando ? " " + cuando : ""} 🙌\n\nEn un momento te paso el link para apartarlo.`;
}

// Mensaje automático específico para auto-envío de link de pago
export function buildAutoPaymentMessage(o: Order): string {
  const link = o.paymentLink ?? "[LINK]";
  return `Perfecto 🙌\n\nTu pedido ya está listo para apartarse.\nPuedes realizar tu pago aquí:\n${link}\n\nEn cuanto se confirme, queda apartado automáticamente.`;
}

// Recordatorio cálido (≥30 min sin pago) — solo se genera, no se envía solo
export function buildAutoPaymentReminder(o: Order): string {
  const link = o.paymentLink ?? "[LINK]";
  return `Hola 🙌\n\nTe dejo nuevamente el link para asegurar tu pedido:\n${link}`;
}

// ¿Cumple los criterios para auto-cobro?
// Fecha confirmada + dirección + producto definido + cliente identificado + monto.
export function isReadyForAutoPayment(o: Order): boolean {
  const fechaOk = !!o.fechaEntrega && o.fechaConfirmada !== false;
  const direccionOk = !!o.direccion && o.direccion.trim().length > 0;
  const productoOk = !!o.descripcion && !/por definir/i.test(o.descripcion);
  const clienteOk = (!!o.cliente && o.cliente.trim().length > 0) || !!o.telefono;
  const montoOk = !!o.precio && o.precio > 0;
  const cobrable = o.pago !== "pagado" && o.pago !== "no_requerido";
  return fechaOk && direccionOk && productoOk && clienteOk && montoOk && cobrable;
}

// Mensaje automático tras confirmar pago (webhook)
export function buildPaymentReceivedMessage(_o: Order): string {
  return `¡Listo! 🙌\n\nTu pago ha sido confirmado.\nTu pedido queda apartado para la fecha acordada.`;
}

function formatDateEs(iso: string): string {
  const today = todayStr();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
  if (iso === today) return "hoy";
  if (iso === tomorrow) return "mañana";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

// Recordatorio "1 día antes" — cálido, sin sonar administrativo
export function buildDayBeforeReminder(o: Order): string {
  const n = firstName(o.cliente);
  const noun = itemNoun(o);
  const cuando = o.horaEntrega ? `mañana a las ${o.horaEntrega}` : "mañana";
  if (o.tipo === "cita") {
    return `Hola${n ? " " + n : ""} 😊\n\nTe esperamos ${cuando} 📅\n\n¿Todo sigue en pie de tu lado?`;
  }
  return `Hola${n ? " " + n : ""} 😊\n\n${noun.charAt(0).toUpperCase() + noun.slice(1)} va listo ${cuando} 🙌\n\n¿Te queda bien la hora?`;
}

/* ---------- Next best action ---------- */

export type ActionKind =
  | "completar_datos"
  | "confirmar_pedido"
  | "solicitar_anticipo"
  | "recordar_pago"
  | "recordar_cliente"
  | "marcar_listo"
  | "avisar_listo"
  | "marcar_entregado"
  | "seguimiento";

export interface NextAction {
  kind: ActionKind;
  label: string;       // CTA button label
  reason: string;      // why this action now (one short line)
  message: string;     // ready-to-send message
  tone: "primary" | "warning" | "danger" | "success";
}

export function nextAction(o: Order): NextAction | null {
  if (o.estado === "entregado" || o.estado === "cancelado") return null;

  // 1) Faltan datos críticos → pedirlos
  if ((o.faltantes || []).length > 0) {
    return {
      kind: "completar_datos",
      label: "Confirmar y pedir detalle",
      reason: `Por confirmar: ${o.faltantes.slice(0, 2).join(", ")}`,
      message: buildSmartReply(o),
      tone: "warning",
    };
  }

  // 2) Nuevo y sin confirmar → confirmar pedido
  if (o.estado === "nuevo") {
    return {
      kind: "confirmar_pedido",
      label: "Confirmar pedido",
      reason: "Pedido nuevo sin confirmar con el cliente",
      message: buildConfirmMessage(o),
      tone: "primary",
    };
  }

  // 2.5) Pago vencido → prioridad máxima
  if (o.pago === "vencido") {
    return {
      kind: "recordar_pago",
      label: "Cobrar pago vencido",
      reason: "Pago vencido — fecha de entrega ya pasó",
      message: buildPaymentReminder(o),
      tone: "danger",
    };
  }

  // 3) Confirmado pero sin pago → solicitar pago
  if (o.estado === "confirmado" && (o.pago === "pendiente" || o.pago === "link_enviado" || o.pago === "fallido")) {
    return {
      kind: "solicitar_anticipo",
      label:
        o.pago === "link_enviado"
          ? "Reenviar link de pago"
          : o.pago === "fallido"
            ? "Reintentar cobro"
            : "Generar link de pago",
      reason:
        o.pago === "link_enviado"
          ? "Link enviado, sin pago aún"
          : o.pago === "fallido"
            ? "Pago anterior falló"
            : "Sin pago registrado",
      message: buildPaymentReminder(o),
      tone: o.pago === "fallido" ? "danger" : "warning",
    };
  }

  // 4) Fecha cercana → recordar al cliente
  const u = urgency(o.fechaEntrega, o.horaEntrega);
  const today = todayStr();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();

  if (o.fechaEntrega === today && u.minutes !== null && u.minutes >= 0 && u.minutes <= 180) {
    return {
      kind: "recordar_cliente",
      label: "Recordar al cliente",
      reason: "Entrega/cita en menos de 3 horas",
      message: buildHoursBeforeReminder(o),
      tone: "danger",
    };
  }
  if (o.fechaEntrega === tomorrow) {
    return {
      kind: "recordar_cliente",
      label: "Recordar al cliente",
      reason: "Entrega/cita es mañana",
      message: buildDayBeforeReminder(o),
      tone: "primary",
    };
  }

  // 5) En proceso y vence hoy → avisar cuando esté listo
  if (o.estado === "en_proceso" && o.fechaEntrega === today) {
    return {
      kind: "marcar_listo",
      label: "Avisar que está listo",
      reason: "En proceso con entrega hoy",
      message: buildReadyMessage(o),
      tone: "primary",
    };
  }

  // 6) Listo → avisar al cliente
  if (o.estado === "listo") {
    return {
      kind: "avisar_listo",
      label: "Avisar al cliente",
      reason: "Pedido listo para entregar",
      message: buildReadyMessage(o),
      tone: "success",
    };
  }

  // 7) Pago pendiente sin urgencia → recordar pago
  if (o.pago === "pendiente" || o.pago === "link_enviado" || o.pago === "fallido") {
    return {
      kind: "recordar_pago",
      label: "Recordar pago",
      reason: "Pago aún pendiente",
      message: buildPaymentReminder(o),
      tone: "warning",
    };
  }

  return null;
}

// Recordatorio "horas antes" — cálido y breve
export function buildHoursBeforeReminder(o: Order): string {
  const n = firstName(o.cliente);
  const cuando = o.horaEntrega ? `a las ${o.horaEntrega}` : "hoy";
  if (o.tipo === "cita") {
    return `Hola${n ? " " + n : ""} 😊\n\nTe esperamos ${cuando} 📅\n\n¿Llegas sin problema?`;
  }
  if (o.tipo === "servicio") {
    return `Hola${n ? " " + n : ""} 😊\n\nVamos en camino ${cuando} ✨\n\n¿Me confirmas que estás en la dirección?`;
  }
  return `Hola${n ? " " + n : ""} 😊\n\nTu pedido sale ${cuando} 🙌\n\n¿Sigue todo bien con la entrega?`;
}

/* ---------- Tono por canal (multicanal) ---------- */

import type { Channel } from "./operia-store";

/**
 * Adapta un mensaje base al tono propio del canal de origen del pedido.
 * - WhatsApp: completo y cálido (mensaje base sin cambios).
 * - Instagram: corto y emocional (acorta saludo, agrega emoji extra, corta líneas largas).
 * - Facebook: claro y directo (intermedio, una línea menos).
 * - Manual: igual al base.
 */
export function adaptMessageForChannel(message: string, canal?: Channel): string {
  if (!canal || canal === "whatsapp" || canal === "manual") return message;

  if (canal === "instagram") {
    // versión más corta y emocional: junta dobles saltos en uno y agrega ✨
    let m = message
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join("\n");
    if (!/[✨💖🙌😍🔥]/u.test(m)) m += " ✨";
    return m;
  }

  if (canal === "facebook") {
    // intermedio: conserva estructura pero quita líneas redundantes de cierre
    const parts = message.split("\n\n").map((p) => p.trim()).filter(Boolean);
    return parts.slice(0, 4).join("\n\n");
  }

  return message;
}
