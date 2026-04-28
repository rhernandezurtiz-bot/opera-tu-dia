/**
 * Estado de suscripción del negocio.
 *
 * MVP simulado (sin Stripe real todavía). Cuando conectemos Stripe,
 * `startCheckout` llamará al endpoint /api/stripe-checkout y `status`
 * se sincronizará desde el webhook.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLANS, type PlanId } from "./plans";

export type SubStatus = "trialing" | "active" | "past_due" | "canceled";

export interface SubscriptionState {
  planId: PlanId;
  status: SubStatus;
  /** Fin del trial (epoch ms). */
  trialEndsAt: number | null;
  /** Próxima renovación / cobro (epoch ms). */
  renewsAt: number | null;
  /** Últimos 4 dígitos de la tarjeta (mock). */
  cardLast4: string | null;
  /** Histórico de cambios. */
  history: Array<{ at: number; type: "trial_started" | "subscribed" | "upgraded" | "downgraded" | "canceled"; planId: PlanId }>;

  startTrial: (planId: PlanId, last4: string) => void;
  changePlan: (planId: PlanId) => void;
  cancel: () => void;
  reset: () => void;
}

const TRIAL_DAYS = 14;

const initial = {
  planId: "pro" as PlanId,
  status: "trialing" as SubStatus,
  trialEndsAt: null as number | null,
  renewsAt: null as number | null,
  cardLast4: null as string | null,
  history: [] as SubscriptionState["history"],
};

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initial,

      startTrial: (planId, last4) => {
        const now = Date.now();
        const trialEnds = now + TRIAL_DAYS * 24 * 60 * 60 * 1000;
        set({
          planId,
          status: "trialing",
          trialEndsAt: trialEnds,
          renewsAt: trialEnds,
          cardLast4: last4,
          history: [...get().history, { at: now, type: "trial_started", planId }],
        });
      },

      changePlan: (planId) => {
        const cur = get();
        const prev = cur.planId;
        const now = Date.now();
        const direction =
          PLANS[planId].precio > PLANS[prev].precio ? "upgraded" : "downgraded";
        set({
          planId,
          status: cur.status === "canceled" ? "trialing" : cur.status,
          history: [...cur.history, { at: now, type: direction, planId }],
        });
      },

      cancel: () => {
        set({
          status: "canceled",
          history: [
            ...get().history,
            { at: Date.now(), type: "canceled", planId: get().planId },
          ],
        });
      },

      reset: () => set({ ...initial }),
    }),
    { name: "operia.subscription.v1" },
  ),
);

/** Días restantes de trial (entero, mínimo 0). */
export function trialDaysLeft(s: SubscriptionState): number {
  if (s.status !== "trialing" || !s.trialEndsAt) return 0;
  const ms = s.trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
