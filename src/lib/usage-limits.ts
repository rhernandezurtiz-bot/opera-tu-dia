/**
 * Hook que calcula el uso del mes vs el plan actual y expone helpers
 * para bloquear acciones cuando se alcanza el límite.
 */

import { useMemo } from "react";
import { useOperia } from "./operia-store";
import { useSubscription } from "./subscription-store";
import { PLANS, type Channel } from "./plans";

function startOfMonth(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface UsageInfo {
  plan: ReturnType<typeof getPlanSafe>;
  pedidosUsados: number;
  pedidosMax: number;
  pedidosRestantes: number;
  pedidosBloqueado: boolean;
  canalesActivos: Channel[];
  canalesMax: number;
  canalCanUse: (c: Channel) => { ok: boolean; reason?: string };
  canCreateOrder: () => { ok: boolean; reason?: string };
}

function getPlanSafe(id: string) {
  return PLANS[(id as keyof typeof PLANS) ?? "basic"] ?? PLANS.basic;
}

export function useUsageLimits(): UsageInfo {
  const orders = useOperia((s) => s.orders);
  const wa = useOperia((s) => s.whatsapp);
  const ig = useOperia((s) => s.instagram);
  const fb = useOperia((s) => s.facebook);
  const planId = useSubscription((s) => s.planId);
  const status = useSubscription((s) => s.status);

  return useMemo<UsageInfo>(() => {
    const plan = getPlanSafe(planId);
    const since = startOfMonth();
    const pedidosUsados = orders.filter((o) => (o.creadoAt ?? 0) >= since).length;
    const pedidosMax = plan.features.pedidosMes;
    const pedidosRestantes = Number.isFinite(pedidosMax)
      ? Math.max(0, pedidosMax - pedidosUsados)
      : Number.POSITIVE_INFINITY;

    const canalesActivos: Channel[] = [];
    if (wa?.enabled) canalesActivos.push("whatsapp");
    if (ig?.enabled) canalesActivos.push("instagram");
    if (fb?.enabled) canalesActivos.push("facebook");

    const blocked = status === "canceled";

    const canCreateOrder = () => {
      if (blocked) return { ok: false, reason: "Tu suscripción está cancelada. Reactívala para seguir creando pedidos." };
      if (Number.isFinite(pedidosMax) && pedidosUsados >= pedidosMax) {
        return {
          ok: false,
          reason: `Llegaste al límite de ${pedidosMax} pedidos/mes del plan ${plan.nombre}. Sube de plan para vender más.`,
        };
      }
      return { ok: true };
    };

    const canalCanUse = (c: Channel) => {
      if (blocked) return { ok: false, reason: "Suscripción cancelada." };
      if (!plan.features.canalesPermitidos.includes(c)) {
        return {
          ok: false,
          reason: `${c} no está disponible en el plan ${plan.nombre}. Cambia a Pro o superior.`,
        };
      }
      // Si no está activo aún y ya alcanzó el máximo:
      if (!canalesActivos.includes(c) && canalesActivos.length >= plan.features.canalesMax) {
        return {
          ok: false,
          reason: `Tu plan permite ${plan.features.canalesMax} canal(es) activos. Desactiva uno o sube de plan.`,
        };
      }
      return { ok: true };
    };

    return {
      plan,
      pedidosUsados,
      pedidosMax,
      pedidosRestantes,
      pedidosBloqueado: !canCreateOrder().ok,
      canalesActivos,
      canalesMax: plan.features.canalesMax,
      canalCanUse,
      canCreateOrder,
    };
  }, [orders, wa, ig, fb, planId, status]);
}
