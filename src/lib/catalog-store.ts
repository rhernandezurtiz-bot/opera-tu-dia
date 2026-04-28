import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderType } from "./operia-store";

export type CatalogKind = "producto" | "servicio" | "cita";

export interface CatalogItem {
  id: string;
  nombre: string;
  tipo: CatalogKind;
  descripcion: string;
  precioBase: number;
  capacidad: string;            // ej. "12 personas", "60 minutos"
  variantes: string[];          // tamaños, paquetes
  opciones: string[];           // sabores, colores, etc.
  anticipacionHoras: number;    // tiempo mínimo
  disponible: boolean;
  notas: string;
  createdAt: number;
}

interface State {
  items: CatalogItem[];
  addItem: (i: Omit<CatalogItem, "id" | "createdAt">) => string;
  updateItem: (id: string, patch: Partial<CatalogItem>) => void;
  removeItem: (id: string) => void;
}

const seed = (): CatalogItem[] => [
  {
    id: "c1",
    nombre: "Pastel 12 personas",
    tipo: "producto",
    descripcion: "Pastel para aprox. 12 personas",
    precioBase: 850,
    capacidad: "12 personas",
    variantes: ["12 personas"],
    opciones: ["Lotus", "Chocolate", "Tres leches"],
    anticipacionHoras: 24,
    disponible: true,
    notas: "Solo manejamos pasteles de aprox. 12 personas.",
    createdAt: Date.now(),
  },
];

export const useCatalog = create<State>()(
  persist(
    (set) => ({
      items: seed(),
      addItem: (i) => {
        const id = "c" + Math.random().toString(36).slice(2, 9);
        set((s) => ({ items: [{ ...i, id, createdAt: Date.now() }, ...s.items] }));
        return id;
      },
      updateItem: (id, patch) =>
        set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
    }),
    { name: "operia-catalog-v1", version: 1 }
  )
);

/* ============== Detección desde texto + validación ============== */

export interface ParsedRequest {
  productoTexto: string;          // primer sustantivo clave del mensaje
  personas?: number;
  sabor?: string;
  fechaISO?: string;
}

const PRODUCT_KEYWORDS = [
  "pastel", "cupcake", "galleta", "postre", "tarta",
  "ramo", "arreglo", "pizza", "hamburguesa", "comida",
  "masaje", "corte", "manicure", "pedicure", "peinado",
];

export function parseRequestFromText(text: string): ParsedRequest {
  const lower = text.toLowerCase();
  let productoTexto = "";
  for (const kw of PRODUCT_KEYWORDS) {
    if (lower.includes(kw)) { productoTexto = kw; break; }
  }

  let personas: number | undefined;
  const mPers = text.match(/(\d+)\s*personas?/i);
  if (mPers) personas = parseInt(mPers[1], 10);

  let sabor: string | undefined;
  const mSabor = text.match(/sabor(?:es)?\s+(?:de\s+)?([a-záéíóúñ ]{3,30})/i)
              || text.match(/de\s+(vainilla|chocolate|lotus|tres leches|fresa|nuez|zarzamora|red velvet|capuchino|moka|naranja|lim[oó]n|pistache)/i);
  if (mSabor) sabor = mSabor[1].trim().toLowerCase().replace(/\.$/, "");

  return { productoTexto, personas, sabor };
}

export interface CatalogValidation {
  status: "ok" | "fuera_catalogo" | "sin_match";
  match?: CatalogItem;          // item del catálogo más parecido
  alerts: string[];             // mensajes humanos por cada problema
  problems: {
    producto?: boolean;
    capacidad?: boolean;
    opcion?: boolean;
    anticipacion?: boolean;
    disponible?: boolean;
  };
  parsed: ParsedRequest;
}

function nameMatches(item: CatalogItem, productoTexto: string): boolean {
  if (!productoTexto) return false;
  const hay = item.nombre.toLowerCase() + " " + item.descripcion.toLowerCase();
  return hay.includes(productoTexto);
}

function parseCapacityNumber(s: string): number | null {
  const m = (s || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function validateAgainstCatalog(
  text: string,
  catalog: CatalogItem[],
  fechaEntregaISO?: string,
): CatalogValidation {
  const parsed = parseRequestFromText(text);
  parsed.fechaISO = fechaEntregaISO;
  const alerts: string[] = [];
  const problems: CatalogValidation["problems"] = {};

  if (catalog.length === 0) {
    return { status: "sin_match", alerts: [], problems, parsed };
  }

  // 1. Buscar match por nombre/keyword
  const match = catalog.find((c) => nameMatches(c, parsed.productoTexto));
  if (!match) {
    if (parsed.productoTexto) {
      alerts.push(`Producto solicitado ("${parsed.productoTexto}") no está en tu catálogo.`);
      problems.producto = true;
      return { status: "fuera_catalogo", alerts, problems, parsed };
    }
    return { status: "sin_match", alerts, problems, parsed };
  }

  // 2. Disponibilidad
  if (!match.disponible) {
    alerts.push(`"${match.nombre}" está marcado como no disponible.`);
    problems.disponible = true;
  }

  // 3. Capacidad / personas
  if (parsed.personas != null) {
    const cap = parseCapacityNumber(match.capacidad);
    if (cap != null && parsed.personas > cap) {
      alerts.push(`Capacidad no disponible: solo manejas ${match.capacidad}.`);
      problems.capacidad = true;
    }
  }

  // 4. Opciones (sabores, colores, variantes)
  if (parsed.sabor && match.opciones.length > 0) {
    const ok = match.opciones.some((o) => o.toLowerCase().includes(parsed.sabor!) || parsed.sabor!.includes(o.toLowerCase()));
    if (!ok) {
      alerts.push(`Opción no disponible: solo ofreces ${match.opciones.join(", ")}.`);
      problems.opcion = true;
    }
  }

  // 5. Anticipación
  if (fechaEntregaISO && match.anticipacionHoras > 0) {
    const target = new Date(fechaEntregaISO + "T12:00:00").getTime();
    const horas = (target - Date.now()) / (1000 * 60 * 60);
    if (horas < match.anticipacionHoras) {
      alerts.push(`Necesitas al menos ${match.anticipacionHoras}h de anticipación para "${match.nombre}".`);
      problems.anticipacion = true;
    }
  }

  return {
    status: alerts.length > 0 ? "fuera_catalogo" : "ok",
    match,
    alerts,
    problems,
    parsed,
  };
}

/* ============== Mensajes inteligentes ============== */

export function buildOutOfCatalogMessage(v: CatalogValidation): string {
  const m = v.match;
  const partes: string[] = ["Hola 😊"];

  if (m && (v.problems.capacidad || v.problems.opcion)) {
    const frags: string[] = [];
    frags.push(`sí manejamos ${m.nombre.toLowerCase()}`);
    if (v.problems.capacidad) frags.push(`pero por ahora solo tenemos tamaño para ${m.capacidad}`);
    if (v.problems.opcion && m.opciones.length > 0) {
      frags.push(`y nuestras opciones disponibles son ${m.opciones.join(", ")}`);
    }
    partes.push(frags.join(" ") + ".");
  } else if (v.problems.producto) {
    partes.push("por ahora ese producto no está dentro de lo que ofrecemos, pero podemos revisarlo juntos.");
  } else if (v.problems.anticipacion && m) {
    partes.push(`necesitamos al menos ${m.anticipacionHoras}h de anticipación para preparar tu ${m.nombre.toLowerCase()}.`);
  } else if (v.problems.disponible && m) {
    partes.push(`por ahora "${m.nombre}" no está disponible.`);
  }

  partes.push("¿Te gustaría que te comparta opciones disponibles?");
  return partes.join("\n\n");
}

export function buildAlternativeOffer(catalog: CatalogItem[], tipo?: OrderType): string {
  const filtered = catalog.filter((c) => c.disponible && (!tipo || c.tipo === (tipo as CatalogKind)));
  if (filtered.length === 0) return "Hola 😊\n\nEn este momento no tengo opciones disponibles para ofrecerte. Te aviso en cuanto se actualice el catálogo.";
  const top = filtered.slice(0, 3);
  const lineas = top.map((c) => {
    const opc = c.opciones.length > 0 ? ` (${c.opciones.slice(0, 4).join(", ")})` : "";
    const precio = c.precioBase ? ` — desde $${c.precioBase.toLocaleString("es-MX")}` : "";
    return `• ${c.nombre}${opc}${precio}`;
  }).join("\n");
  return `Hola 😊\n\nEstas son las opciones que sí manejamos:\n\n${lineas}\n\n¿Cuál te interesa? Con gusto te aparto.`;
}

/* ============== Validación de un Order ============== */

export function validateOrder(order: Order, catalog: CatalogItem[]): CatalogValidation {
  // Combina mensaje original + descripción para mejor detección
  const text = [order.mensajeOriginal, order.descripcion, order.detalles].filter(Boolean).join(" — ");
  return validateAgainstCatalog(text, catalog, order.fechaEntrega);
}
