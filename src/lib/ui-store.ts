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
}

export function summarizeMoney(orders: Order[]): MoneySummary {
  const today = todayStr();
  let ingresosHoy = 0;
  let ingresosEnRiesgo = 0;
  let pedidosSinAnticipo = 0;
  let montoSinAnticipo = 0;
  for (const o of orders) {
    if (o.estado === "cancelado") continue;
    const monto = o.precio || 0;
    if (o.fechaEntrega === today && o.estado !== "entregado") ingresosHoy += monto;
    if ((o.riesgo === "alto" || o.riesgo === "medio") && o.estado !== "entregado") {
      ingresosEnRiesgo += monto;
    }
    if ((o.pago === "pendiente" || o.pago === "anticipo_solicitado" || o.pago === "vencido") && o.estado !== "entregado") {
      pedidosSinAnticipo += 1;
      montoSinAnticipo += monto;
    }
  }
  return { ingresosHoy, ingresosEnRiesgo, pedidosSinAnticipo, montoSinAnticipo };
}

/* ---------- Message templates ---------- */

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

export function buildMissingMessage(cliente: string, faltantes: string[]): string {
  const lista = faltantes.length ? faltantes.map((f) => f.toLowerCase()).join(", ") : "algunos detalles";
  const n = firstName(cliente);
  return `¡Hola${n ? " " + n : ""}! 😊 Para confirmar tu pedido me faltaría: ${lista}. ¿Me lo puedes compartir, por favor? ¡Gracias!`;
}

// Mensaje sugerido dinámico según tipo de orden, datos faltantes y ambigüedad
export function buildSmartReply(o: Order): string {
  const n = firstName(o.cliente);
  const saludo = `Hola${n ? " " + n : ""} 😊`;

  // Mapear faltantes a frases naturales
  const faltan = (o.faltantes || []).map((f) => f.toLowerCase());
  const phraseMap: Record<string, string> = {
    "producto exacto": "qué producto necesitas",
    "cantidad": "la cantidad exacta",
    "fecha": "la fecha",
    "fecha exacta": "la fecha exacta",
    "hora": "el horario",
    "hora exacta": "la hora final",
    "dirección": "la dirección completa",
    "dirección completa": "la dirección completa",
    "pago": "el método de pago",
    "contacto": "un teléfono de contacto",
  };
  const frases = faltan.map((f) => phraseMap[f] || f).filter(Boolean);
  const lista = frases.length > 1
    ? frases.slice(0, -1).join(", ") + " y " + frases[frases.length - 1]
    : frases[0] || "algunos detalles";

  if (o.tipo === "cita") {
    if (faltan.length === 0) {
      const cuando = o.horaEntrega ? `el ${o.fechaEntrega} a las ${o.horaEntrega}` : "en la fecha indicada";
      return `${saludo} confirmo tu cita ${cuando}. ¿Te queda bien? ¡Te esperamos!`;
    }
    return `${saludo} para agendar tu cita necesito confirmar ${lista}. ¿Me lo puedes compartir?`;
  }

  if (o.tipo === "servicio") {
    if (faltan.length === 0) {
      return `${saludo} recibido tu solicitud de ${o.descripcion || "servicio"}. Te confirmo disponibilidad enseguida.`;
    }
    return `${saludo} para coordinar tu servicio necesito ${lista}. ¿Me lo puedes compartir?`;
  }

  // Producto / personalizado
  if (faltan.length === 0) {
    return `${saludo} confirmo tu pedido de ${o.descripcion || "producto"}. Coordinamos entrega según lo acordado. ¡Gracias!`;
  }
  return `${saludo} para poder ayudarte necesito confirmar ${lista}. ¿Me lo puedes compartir? ¡Gracias!`;
}

export function buildConfirmMessage(o: Order): string {
  const n = firstName(o.cliente);
  const desc = o.descripcion || "tu pedido";
  const fecha = o.fechaEntrega
    ? `${o.fechaEntrega}${o.horaEntrega ? ` a las ${o.horaEntrega}` : ""}`
    : "la fecha acordada";
  return `¡Hola${n ? " " + n : ""}! ✅ Confirmado: ${desc} para ${fecha}. ¡Gracias por tu preferencia!`;
}

export function buildReminderMessage(o: Order): string {
  const n = firstName(o.cliente);
  const cuando = o.horaEntrega ? `hoy a las ${o.horaEntrega}` : "hoy";
  return `¡Hola${n ? " " + n : ""}! 📅 Te recordamos tu cita ${cuando}. Si necesitas reagendar, avísanos. ¡Te esperamos!`;
}

export function buildPaymentMessage(o: Order): string {
  const n = firstName(o.cliente);
  const monto = o.precio ? ` por ${money(o.precio)}` : "";
  return `¡Hola${n ? " " + n : ""}! 💳 Para asegurar tu pedido${monto} necesitamos tu pago o anticipo. Te paso los datos ahora. ¡Gracias!`;
}

export function buildReadyMessage(o: Order): string {
  const n = firstName(o.cliente);
  const desc = o.descripcion || "tu pedido";
  return `¡Hola${n ? " " + n : ""}! 🎉 ${desc} ya está listo. Coordinamos la entrega según lo acordado. ¡Gracias!`;
}

// Recordatorio de anticipo / pago pendiente
export function buildPaymentReminder(o: Order): string {
  const n = firstName(o.cliente);
  const monto = o.precio ? ` (${money(o.precio)})` : "";
  if (o.paymentLink) {
    return `Hola${n ? " " + n : ""} 😊 para confirmar tu pedido${monto}, puedes realizar el anticipo aquí: ${o.paymentLink}`;
  }
  return `Hola${n ? " " + n : ""} 😊 te recuerdo el anticipo${monto} para poder confirmar tu pedido. ¿Me ayudas con eso?`;
}

// Recordatorio "1 día antes"
export function buildDayBeforeReminder(o: Order): string {
  const n = firstName(o.cliente);
  const desc = o.descripcion?.split(" — ")[0] || "tu pedido";
  const cuando = o.horaEntrega ? `mañana a las ${o.horaEntrega}` : "mañana";
  if (o.tipo === "cita") {
    return `Hola${n ? " " + n : ""} 😊 te recuerdo tu cita ${cuando}. ¿Confirmas que sigue en pie?`;
  }
  return `Hola${n ? " " + n : ""} 😊 te confirmo ${desc} para ${cuando}. ¿Todo sigue en orden?`;
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
      label: "Pedir datos faltantes",
      reason: `Faltan: ${o.faltantes.join(", ")}`,
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

  // 3) Confirmado pero sin anticipo → solicitar anticipo
  if (o.estado === "confirmado" && (o.pago === "pendiente" || o.pago === "anticipo_solicitado")) {
    return {
      kind: "solicitar_anticipo",
      label: o.pago === "anticipo_solicitado" ? "Reenviar link de pago" : "Solicitar anticipo",
      reason: o.pago === "anticipo_solicitado" ? "Link enviado, sin pago aún" : "Sin anticipo recibido",
      message: buildPaymentReminder(o),
      tone: "warning",
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
  if (o.pago === "pendiente" || o.pago === "anticipo_solicitado") {
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

// Recordatorio "2 horas antes"
export function buildHoursBeforeReminder(o: Order): string {
  const n = firstName(o.cliente);
  const cuando = o.horaEntrega ? `a las ${o.horaEntrega}` : "hoy";
  if (o.tipo === "cita") {
    return `Hola${n ? " " + n : ""} 😊 te esperamos ${cuando}. ¿Me confirmas la dirección y que llegas a tiempo?`;
  }
  if (o.tipo === "servicio") {
    return `Hola${n ? " " + n : ""} 😊 te confirmo nuestra visita ${cuando}. ¿Me confirmas la dirección exacta?`;
  }
  return `Hola${n ? " " + n : ""} 😊 vamos en camino con tu pedido ${cuando}. ¿Confirmas la dirección de entrega?`;
}
