import { create } from "zustand";
import { todayStr } from "./operia-store";

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
    if (!hora) return { label: "Entrega hoy · sin hora", tone: "danger", minutes: 0 };
    const [h, m] = hora.split(":").map(Number);
    const due = new Date(); due.setHours(h, m || 0, 0, 0);
    const diff = Math.round((due.getTime() - Date.now()) / 60000);
    if (diff < 0) return { label: `Atrasado ${formatDiff(-diff)}`, tone: "danger", minutes: diff };
    if (diff <= 120) return { label: `Faltan ${formatDiff(diff)}`, tone: "danger", minutes: diff };
    if (diff <= 360) return { label: `Hoy en ${formatDiff(diff)}`, tone: "warning", minutes: diff };
    return { label: `Hoy a las ${hora}`, tone: "warning", minutes: diff };
  }
  if (fecha === tomorrow) return { label: hora ? `Mañana a las ${hora}` : "Mañana", tone: "muted", minutes: null };

  // Other dates
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

export function buildMissingMessage(cliente: string, faltantes: string[]): string {
  const lista = faltantes.length ? faltantes.map((f) => f.toLowerCase()).join(", ") : "algunos detalles";
  return `¡Hola${cliente ? " " + cliente : ""}! 😊 Para confirmar tu pedido me faltaría: ${lista}. ¿Me lo puedes compartir por favor? ¡Gracias!`;
}
