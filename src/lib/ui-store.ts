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
    if (o.pago === "pendiente" && o.estado !== "entregado") {
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

// Mensaje sugerido dinámico según tipo de orden y datos faltantes
export function buildSmartReply(o: Order): string {
  const n = firstName(o.cliente);
  const saludo = `Hola${n ? " " + n : ""} 😊`;
  const faltan = (o.faltantes || []).map((f) => f.toLowerCase());

  if (o.tipo === "cita") {
    if (faltan.length === 0) {
      const cuando = o.horaEntrega ? `el ${o.fechaEntrega} a las ${o.horaEntrega}` : "en la fecha indicada";
      return `${saludo} confirmo tu cita ${cuando}. ¿Te queda bien? ¡Te esperamos!`;
    }
    const lista = faltan.includes("hora") ? "el horario exacto y tu confirmación" : faltan.join(", ");
    return `${saludo} para agendar tu cita necesito ${lista}. ¿Me lo confirmas?`;
  }

  if (o.tipo === "servicio") {
    if (faltan.length === 0) {
      return `${saludo} recibido tu solicitud de ${o.descripcion || "servicio"}. Te confirmo disponibilidad enseguida.`;
    }
    const base = ["los detalles del trabajo", "tu dirección exacta", "un teléfono de contacto"];
    const pedir = faltan.length ? faltan.join(", ") : base.join(", ");
    return `${saludo} para coordinar tu servicio necesito: ${pedir}. ¿Me lo puedes compartir?`;
  }

  // Producto / personalizado
  if (faltan.length === 0) {
    return `${saludo} confirmo tu pedido de ${o.descripcion || "producto"}. Coordinamos entrega según lo acordado. ¡Gracias!`;
  }
  return `${saludo} para confirmar tu pedido me falta: ${faltan.join(", ")}. ¿Me lo puedes compartir? ¡Gracias!`;
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
