/**
 * Planes de Operia (SaaS).
 *
 * Cambia precios y límites aquí — el resto de la app los usa automáticamente.
 * Mantén los IDs estables (`basic`, `pro`, `business`) para no romper datos persistidos.
 */

export type PlanId = "basic" | "pro" | "business";
export type Channel = "whatsapp" | "instagram" | "facebook";

export interface PlanFeatures {
  /** Pedidos máximos creados por mes (Infinity = ilimitado). */
  pedidosMes: number;
  /** Canales activos máximos. */
  canalesMax: number;
  /** Canales permitidos por nombre. Subconjunto de Channel[]. */
  canalesPermitidos: Channel[];
  /** Modos de respuesta automática permitidos. */
  modoRespuesta: Array<"manual" | "sugerido" | "automatico">;
  /** Acceso al módulo de aprendizaje continuo. */
  aprendizaje: boolean;
  /** Cobros automáticos (link de pago + recordatorios). */
  cobrosAutomaticos: boolean;
  /** Multiusuario / equipo. */
  multiusuario: boolean;
  /** Soporte prioritario. */
  soportePrioritario: boolean;
}

export interface Plan {
  id: PlanId;
  nombre: string;
  /** Precio mensual. Cambia esto cuando definas la moneda y cifra final. */
  precio: number;
  moneda: "MXN" | "USD";
  /** Tagline enfocado en ingresos, no en features. */
  tagline: string;
  /** Promesa de ingresos por mes (estimado, para mostrar al usuario). */
  ingresosEstimadosMes: number;
  features: PlanFeatures;
  /** Resaltar como plan recomendado. */
  destacado?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  basic: {
    id: "basic",
    nombre: "Basic",
    precio: 299,
    moneda: "MXN",
    tagline: "Empieza a recuperar ventas que hoy se pierden.",
    ingresosEstimadosMes: 8000,
    features: {
      pedidosMes: 50,
      canalesMax: 1,
      canalesPermitidos: ["whatsapp"],
      modoRespuesta: ["manual", "sugerido"],
      aprendizaje: false,
      cobrosAutomaticos: false,
      multiusuario: false,
      soportePrioritario: false,
    },
  },
  pro: {
    id: "pro",
    nombre: "Pro",
    precio: 799,
    moneda: "MXN",
    tagline: "Vende mientras duermes en WhatsApp, Instagram y Facebook.",
    ingresosEstimadosMes: 35000,
    destacado: true,
    features: {
      pedidosMes: 500,
      canalesMax: 3,
      canalesPermitidos: ["whatsapp", "instagram", "facebook"],
      modoRespuesta: ["manual", "sugerido", "automatico"],
      aprendizaje: true,
      cobrosAutomaticos: true,
      multiusuario: false,
      soportePrioritario: false,
    },
  },
  business: {
    id: "business",
    nombre: "Business",
    precio: 2499,
    moneda: "MXN",
    tagline: "Escala sin techo. Tu equipo cierra ventas en automático.",
    ingresosEstimadosMes: 120000,
    features: {
      pedidosMes: Number.POSITIVE_INFINITY,
      canalesMax: 3,
      canalesPermitidos: ["whatsapp", "instagram", "facebook"],
      modoRespuesta: ["manual", "sugerido", "automatico"],
      aprendizaje: true,
      cobrosAutomaticos: true,
      multiusuario: true,
      soportePrioritario: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["basic", "pro", "business"];

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
};

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function formatPrice(p: Plan): string {
  if (p.moneda === "USD") return `$${p.precio} USD/mes`;
  return `$${p.precio.toLocaleString("es-MX")} MXN/mes`;
}

export function formatLimit(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString("es-MX") : "Ilimitados";
}
