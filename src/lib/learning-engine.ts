/**
 * Motor de aprendizaje continuo.
 *
 * Observa el log de autorespuestas + estado de los pedidos vinculados y deriva:
 *  - Tasa de conversión global y por producto / variante
 *  - Productos más vendidos
 *  - Respuestas más efectivas (por decisión y plantilla)
 *  - Pesos de "boost" para priorizar productos con mejor conversión
 *
 * Recálculo: cada vez que cambian logs/orders + un tick diario.
 * Persistencia: pesos por producto en localStorage para que el motor los use
 * incluso entre sesiones.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useMemo } from "react";
import { useOperia, type AutoReplyLogEntry, type Order } from "./operia-store";
import { setProductBoostResolver } from "./catalog-store";

const REMINDER_GRACE_MS = 30 * 60 * 1000; // 30 min

// Registra el resolver de boost para que selectBestOption use pesos aprendidos
setProductBoostResolver((id) => {
  const w = useProductInsights.getState().weights[id];
  return typeof w === "number" && Number.isFinite(w) ? w : 1;
});

/* ============== Cosecha de outcomes ============== */

/**
 * Determina el resultado de un log a partir del pedido vinculado y del tiempo
 * transcurrido. Reglas:
 *   - decisión "ya_pago" o pedido pagado → "pagado"
 *   - pedido cancelado o decisión "sin_disponibilidad" → "rechazado"
 *   - listo_cobrar / venta_posible sin pago tras 30 min → "no_pagado"
 *   - resto → "pendiente"
 */
export function deriveOutcome(
  log: AutoReplyLogEntry,
  order: Order | undefined,
  now: number = Date.now(),
): AutoReplyLogEntry["outcome"] {
  if (log.decision === "ya_pago") return "pagado";
  if (order?.pago === "pagado") return "pagado";
  if (order?.estado === "cancelado") return "rechazado";
  if (log.decision === "sin_disponibilidad") return "rechazado";

  const elapsed = now - log.at;
  const isClose = log.decision === "listo_cobrar" || log.decision === "venta_posible";
  if (isClose && elapsed > REMINDER_GRACE_MS) return "no_pagado";

  return "pendiente";
}

/* ============== Métricas ============== */

export interface LearningMetrics {
  totalConversaciones: number;
  totalCierres: number;        // venta_posible + listo_cobrar + ya_pago
  totalPagados: number;
  totalRechazados: number;
  totalPendientes: number;
  conversionGlobal: number;    // pagados / cierres
  ingresosEstimados: number;
  productos: ProductMetric[];
  respuestas: ResponseMetric[];
}

export interface ProductMetric {
  productoId: string;
  nombre: string;
  conversaciones: number;
  pagados: number;
  rechazados: number;
  ingresos: number;
  conversion: number;          // pagados / conversaciones
  weight: number;              // 0..2 (1 = neutral)
}

export interface ResponseMetric {
  decision: string;
  enviadas: number;
  pagadas: number;
  efectividad: number;         // 0..1
}

export function computeLearningMetrics(
  logs: AutoReplyLogEntry[],
  orders: Order[],
  now: number = Date.now(),
): LearningMetrics {
  const enrich = logs.map((l) => {
    const order = l.ordenId ? orders.find((o) => o.id === l.ordenId) : undefined;
    const outcome = l.outcome && l.outcome !== "pendiente" ? l.outcome : deriveOutcome(l, order, now);
    return { log: l, order, outcome };
  });

  const totalConversaciones = enrich.length;
  const totalPagados = enrich.filter((e) => e.outcome === "pagado").length;
  const totalRechazados = enrich.filter((e) => e.outcome === "rechazado").length;
  const totalPendientes = enrich.filter((e) => e.outcome === "pendiente").length;
  const totalCierres = enrich.filter((e) =>
    ["venta_posible", "listo_cobrar", "ya_pago"].includes(e.log.decision),
  ).length;
  const conversionGlobal = totalCierres > 0 ? totalPagados / totalCierres : 0;
  const ingresosEstimados = enrich
    .filter((e) => e.outcome === "pagado")
    .reduce((acc, e) => acc + (e.order?.precio ?? e.log.precioEstimado ?? 0), 0);

  // Productos
  const byProd = new Map<string, ProductMetric>();
  for (const e of enrich) {
    const id = e.log.productoId || e.order?.descripcion || "";
    const nombre = e.log.productoDetectado || e.order?.descripcion || "Sin clasificar";
    if (!id && !nombre) continue;
    const key = id || nombre;
    if (!byProd.has(key)) {
      byProd.set(key, {
        productoId: key, nombre,
        conversaciones: 0, pagados: 0, rechazados: 0,
        ingresos: 0, conversion: 0, weight: 1,
      });
    }
    const p = byProd.get(key)!;
    p.conversaciones += 1;
    if (e.outcome === "pagado") {
      p.pagados += 1;
      p.ingresos += e.order?.precio ?? e.log.precioEstimado ?? 0;
    }
    if (e.outcome === "rechazado") p.rechazados += 1;
  }
  for (const p of byProd.values()) {
    p.conversion = p.conversaciones > 0 ? p.pagados / p.conversaciones : 0;
    // Boost: productos con conversión > 50% suben hasta 2x; <10% bajan hasta 0.5x
    if (p.conversaciones < 3) {
      p.weight = 1; // muestra insuficiente
    } else if (p.conversion >= 0.5) {
      p.weight = Math.min(2, 1 + p.conversion);
    } else if (p.conversion <= 0.1) {
      p.weight = 0.5;
    } else {
      p.weight = 0.5 + p.conversion;
    }
  }

  // Respuestas (efectividad por decisión)
  const byDec = new Map<string, ResponseMetric>();
  for (const e of enrich) {
    const k = e.log.decision;
    if (!byDec.has(k)) byDec.set(k, { decision: k, enviadas: 0, pagadas: 0, efectividad: 0 });
    const r = byDec.get(k)!;
    if (e.log.enviado) r.enviadas += 1;
    if (e.outcome === "pagado") r.pagadas += 1;
  }
  for (const r of byDec.values()) {
    r.efectividad = r.enviadas > 0 ? r.pagadas / r.enviadas : 0;
  }

  return {
    totalConversaciones,
    totalCierres,
    totalPagados,
    totalRechazados,
    totalPendientes,
    conversionGlobal,
    ingresosEstimados,
    productos: [...byProd.values()].sort((a, b) => b.pagados - a.pagados),
    respuestas: [...byDec.values()].sort((a, b) => b.efectividad - a.efectividad),
  };
}

/* ============== Pesos persistidos por producto ============== */

interface InsightsState {
  weights: Record<string, number>; // productoId -> weight (0.5 .. 2)
  lastRecalcAt: number;
  setWeights: (w: Record<string, number>, at: number) => void;
}

export const useProductInsights = create<InsightsState>()(
  persist(
    (set) => ({
      weights: {},
      lastRecalcAt: 0,
      setWeights: (w, at) => set({ weights: w, lastRecalcAt: at }),
    }),
    { name: "operia-learning-v1" },
  ),
);

/** Boost para usar en selectBestOption: 1 = neutral. */
export function getProductBoost(productoId: string): number {
  const w = useProductInsights.getState().weights[productoId];
  return typeof w === "number" && Number.isFinite(w) ? w : 1;
}

/* ============== Motor reactivo (recálculo continuo + diario) ============== */

const ONE_DAY = 24 * 60 * 60 * 1000;

export function useLearningEngine() {
  const logs = useOperia((s) => s.autoReplyLog);
  const orders = useOperia((s) => s.orders);
  const updateLog = useOperia((s) => s.updateAutoReplyLog);
  const setWeights = useProductInsights((s) => s.setWeights);

  // 1. Cosecha outcomes y persiste en logs
  useEffect(() => {
    const now = Date.now();
    for (const l of logs) {
      if (l.outcome && l.outcome !== "pendiente") continue;
      const order = l.ordenId ? orders.find((o) => o.id === l.ordenId) : undefined;
      const outcome = deriveOutcome(l, order, now);
      if (outcome && outcome !== l.outcome) {
        updateLog(l.id, { outcome, outcomeAt: outcome === "pendiente" ? undefined : now });
      }
    }
  }, [logs, orders, updateLog]);

  // 2. Recalcula pesos al cambiar datos + tick diario
  useEffect(() => {
    const recalc = () => {
      const m = computeLearningMetrics(
        useOperia.getState().autoReplyLog,
        useOperia.getState().orders,
      );
      const w: Record<string, number> = {};
      for (const p of m.productos) w[p.productoId] = p.weight;
      setWeights(w, Date.now());
    };
    recalc();
    const id = setInterval(recalc, ONE_DAY);
    return () => clearInterval(id);
  }, [logs, orders, setWeights]);
}

/* ============== Hook de lectura para UI ============== */

export function useLearningMetrics(): LearningMetrics {
  const logs = useOperia((s) => s.autoReplyLog);
  const orders = useOperia((s) => s.orders);
  return useMemo(() => computeLearningMetrics(logs, orders), [logs, orders]);
}

/* ============== Sugerencias de mejora ============== */

export interface ImprovementHint {
  tipo: "producto_estrella" | "producto_debil" | "respuesta_floja" | "sin_datos";
  titulo: string;
  detalle: string;
}

export function buildImprovementHints(m: LearningMetrics): ImprovementHint[] {
  const hints: ImprovementHint[] = [];
  if (m.totalConversaciones < 5) {
    hints.push({
      tipo: "sin_datos",
      titulo: "Aún recolectando datos",
      detalle: "Operia aprende con cada conversación. En unos días verás patrones claros.",
    });
    return hints;
  }
  const top = m.productos[0];
  if (top && top.conversion >= 0.4) {
    hints.push({
      tipo: "producto_estrella",
      titulo: `${top.nombre} es tu producto estrella`,
      detalle: `Convierte ${(top.conversion * 100).toFixed(0)}%. Operia lo prioriza automáticamente.`,
    });
  }
  const flojo = m.productos.find((p) => p.conversaciones >= 3 && p.conversion <= 0.1);
  if (flojo) {
    hints.push({
      tipo: "producto_debil",
      titulo: `${flojo.nombre} no convierte`,
      detalle: "Considera revisar precio, foto o disponibilidad. Operia bajó su prioridad.",
    });
  }
  const peor = m.respuestas.find((r) => r.enviadas >= 3 && r.efectividad <= 0.1);
  if (peor) {
    hints.push({
      tipo: "respuesta_floja",
      titulo: `Respuestas tipo "${peor.decision}" cierran poco`,
      detalle: `Solo ${(peor.efectividad * 100).toFixed(0)}% terminan en pago. Revisa el tono o la oferta.`,
    });
  }
  return hints;
}
