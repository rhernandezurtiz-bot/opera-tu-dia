import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderType } from "./operia-store";

export type CatalogKind = "producto" | "servicio" | "cita";

// Inventory typing — más rico que CatalogKind: incluye insumos y capacidad pura.
export type InventoryKind =
  | "producto_terminado"
  | "insumo"
  | "servicio"
  | "capacidad_diaria";

export type Unidad =
  | "piezas"
  | "kg"
  | "litros"
  | "horas"
  | "espacios"
  | "porciones";

export const UNIDAD_LABELS: Record<Unidad, string> = {
  piezas: "piezas",
  kg: "kg",
  litros: "litros",
  horas: "horas",
  espacios: "espacios",
  porciones: "porciones",
};

export const ALL_UNIDADES: Unidad[] = ["piezas", "kg", "litros", "horas", "espacios", "porciones"];

export const INVENTORY_KIND_LABELS: Record<InventoryKind, string> = {
  producto_terminado: "Producto terminado",
  insumo: "Insumo",
  servicio: "Servicio",
  capacidad_diaria: "Capacidad diaria",
};

export type DayKey = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
export const DAY_LABELS: Record<DayKey, string> = {
  lun: "Lun", mar: "Mar", mie: "Mié", jue: "Jue", vie: "Vie", sab: "Sáb", dom: "Dom",
};
export const ALL_DAYS: DayKey[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

/**
 * Variante estructurada de un producto.
 * Cada variante puede tener su propio precio, capacidad, sabores, stock y prep.
 */
export interface CatalogVariant {
  id: string;
  nombre: string;            // ej. "12 personas", "Grande", "Paquete fin de semana"
  personas: number;          // 0 = no aplica (servicios)
  precio: number;            // precio para esta variante
  sabores: string[];         // sabores/opciones específicos de esta variante
  stockDiario: number;       // 0 = ilimitado; >0 = unidades por día
  tiempoPreparacion: number; // minutos
  disponible: boolean;
}

export interface CatalogItem {
  id: string;
  nombre: string;
  tipo: CatalogKind;
  descripcion: string;
  precioBase: number;
  capacidad: string;            // ej. "12 personas", "60 minutos"
  variantes: string[];          // [legacy] tamaños como texto plano
  variantesDetalle: CatalogVariant[]; // [nuevo] variantes estructuradas
  opciones: string[];           // sabores, colores, etc.
  anticipacionHoras: number;    // tiempo mínimo
  disponible: boolean;
  notas: string;
  // Disponibilidad operativa
  stockDisponible: number;      // 0 = no aplica / sin stock; >0 = unidades libres
  capacidadDiaria: number;      // 0 = ilimitada; >0 = máx por día
  horarioDesde: string;         // "HH:mm" o ""
  horarioHasta: string;         // "HH:mm" o ""
  diasDisponibles: DayKey[];    // [] = todos los días
  prepMinutos: number;          // tiempo mínimo de preparación (minutos)
  bloquearSinDisponibilidad: boolean; // si true, falla cierra cobro automático
  // Inventario
  categoria: string;            // ej. "Pasteles", "Insumos", "Sesiones"
  tipoInventario: InventoryKind;
  stockMinimo: number;          // umbral para alerta de stock bajo
  unidad: Unidad;
  createdAt: number;
}

export function newVariant(patch: Partial<CatalogVariant> = {}): CatalogVariant {
  return {
    id: "v" + Math.random().toString(36).slice(2, 9),
    nombre: "",
    personas: 0,
    precio: 0,
    sabores: [],
    stockDiario: 0,
    tiempoPreparacion: 0,
    disponible: true,
    ...patch,
  };
}

interface State {
  items: CatalogItem[];
  addItem: (i: Omit<CatalogItem, "id" | "createdAt">) => string;
  updateItem: (id: string, patch: Partial<CatalogItem>) => void;
  removeItem: (id: string) => void;
  // Mutaciones de stock
  decrementStock: (id: string, qty?: number) => void;
  incrementStock: (id: string, qty?: number) => void;
  setStock: (id: string, qty: number) => void;
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
    variantesDetalle: [
      newVariant({
        nombre: "12 personas",
        personas: 12,
        precio: 850,
        sabores: ["Lotus", "Chocolate", "Tres leches"],
        stockDiario: 5,
        tiempoPreparacion: 60,
      }),
      newVariant({
        nombre: "20 personas",
        personas: 20,
        precio: 1450,
        sabores: ["Chocolate", "Tres leches"],
        stockDiario: 2,
        tiempoPreparacion: 90,
      }),
    ],
    opciones: ["Lotus", "Chocolate", "Tres leches"],
    anticipacionHoras: 24,
    disponible: true,
    notas: "Solo manejamos pasteles de aprox. 12 personas.",
    stockDisponible: 0,
    capacidadDiaria: 5,
    horarioDesde: "10:00",
    horarioHasta: "19:00",
    diasDisponibles: ["mar", "mie", "jue", "vie", "sab"],
    prepMinutos: 60,
    bloquearSinDisponibilidad: true,
    categoria: "Pasteles",
    tipoInventario: "capacidad_diaria",
    stockMinimo: 1,
    unidad: "piezas",
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
      decrementStock: (id, qty = 1) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id && it.stockDisponible > 0
              ? { ...it, stockDisponible: Math.max(0, it.stockDisponible - qty) }
              : it,
          ),
        })),
      incrementStock: (id, qty = 1) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, stockDisponible: it.stockDisponible + qty } : it,
          ),
        })),
      setStock: (id, qty) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, stockDisponible: Math.max(0, qty) } : it,
          ),
        })),
    }),
    {
      name: "operia-catalog-v4",
      version: 4,
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 2 && Array.isArray(persisted.items)) {
          persisted.items = persisted.items.map((it: any) => ({
            stockDisponible: 0,
            capacidadDiaria: 0,
            horarioDesde: "",
            horarioHasta: "",
            diasDisponibles: [],
            prepMinutos: 0,
            bloquearSinDisponibilidad: true,
            ...it,
          }));
        }
        if (version < 3 && Array.isArray(persisted.items)) {
          persisted.items = persisted.items.map((it: any) => ({
            categoria: "General",
            tipoInventario:
              it.tipo === "servicio" ? "servicio"
                : it.capacidadDiaria > 0 ? "capacidad_diaria"
                : "producto_terminado",
            stockMinimo: 0,
            unidad: it.tipo === "servicio" || it.tipo === "cita" ? "espacios" : "piezas",
            ...it,
          }));
        }
        if (version < 4 && Array.isArray(persisted.items)) {
          persisted.items = persisted.items.map((it: any) => {
            if (Array.isArray(it.variantesDetalle) && it.variantesDetalle.length > 0) return it;
            // Sintetiza variantesDetalle desde el campo legacy
            const personasFromCap = (() => {
              const m = (it.capacidad || "").match(/(\d+)/);
              return m ? parseInt(m[1], 10) : 0;
            })();
            const fromLegacy: CatalogVariant[] = (Array.isArray(it.variantes) ? it.variantes : [])
              .filter((s: any) => typeof s === "string" && s.trim())
              .map((nombre: string) => {
                const mp = nombre.match(/(\d+)/);
                return newVariant({
                  nombre,
                  personas: mp ? parseInt(mp[1], 10) : personasFromCap,
                  precio: it.precioBase || 0,
                  sabores: Array.isArray(it.opciones) ? it.opciones : [],
                  stockDiario: it.capacidadDiaria || 0,
                  tiempoPreparacion: it.prepMinutos || 0,
                });
              });
            const variantesDetalle = fromLegacy.length > 0 ? fromLegacy : [
              newVariant({
                nombre: it.nombre || "Estándar",
                personas: personasFromCap,
                precio: it.precioBase || 0,
                sabores: Array.isArray(it.opciones) ? it.opciones : [],
                stockDiario: it.capacidadDiaria || 0,
                tiempoPreparacion: it.prepMinutos || 0,
              }),
            ];
            return { ...it, variantesDetalle };
          });
        }
        return persisted;
      },
    }
  )
);

/* ============== Detección desde texto + validación ============== */

export interface ParsedRequest {
  productoTexto: string;
  personas?: number;
  cantidad?: number;
  sabor?: string;
  variante?: string;
  fechaISO?: string;
  hora?: string; // "HH:mm"
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

  let cantidad: number | undefined;
  const mCant = text.match(/(\d+)\s*(piezas?|unidades?|productos?|cupcakes?|galletas?)/i);
  if (mCant) cantidad = parseInt(mCant[1], 10);

  let sabor: string | undefined;
  const mSabor = text.match(/sabor(?:es)?\s+(?:de\s+)?([a-záéíóúñ ]{3,30})/i)
              || text.match(/de\s+(vainilla|chocolate|lotus|tres leches|fresa|nuez|zarzamora|red velvet|capuchino|moka|naranja|lim[oó]n|pistache)/i);
  if (mSabor) sabor = mSabor[1].trim().toLowerCase().replace(/\.$/, "");

  return { productoTexto, personas, cantidad, sabor };
}

/* ============== Tipos de validación ============== */

export type AvailabilityStatus =
  | "pendiente"      // sin verificar todavía
  | "disponible"     // todo OK
  | "no_disponible"  // hay bloqueos duros
  | "revision";      // requiere revisión manual (ambiguo / sin datos)

export interface CheckResult {
  key: string;
  label: string;
  status: "ok" | "fail" | "skip" | "warn";
  detail?: string;
}

export interface CatalogValidation {
  // Status legado para compatibilidad con UI previa
  status: "ok" | "fuera_catalogo" | "sin_match";
  // Nuevo estado de disponibilidad operativa
  availability: AvailabilityStatus;
  match?: CatalogItem;
  alerts: string[];
  problems: {
    producto?: boolean;
    variante?: boolean;
    capacidad?: boolean;
    opcion?: boolean;
    anticipacion?: boolean;
    disponible?: boolean;
    stock?: boolean;
    capacidadDiaria?: boolean;
    horario?: boolean;
    dia?: boolean;
    prep?: boolean;
  };
  checks: CheckResult[];
  parsed: ParsedRequest;
  // ¿Se debe bloquear el cobro automático?
  blockPayment: boolean;
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

function dayKeyOf(iso: string): DayKey | null {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  const map: DayKey[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
  return map[d.getDay()];
}

function timeInRange(hhmm: string, desde: string, hasta: string): boolean {
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const t = toMin(hhmm);
  return t >= toMin(desde) && t <= toMin(hasta);
}

/* ============== Validación principal ============== */

export interface ValidateOpts {
  ordersOnDate?: number;   // # de pedidos ya tomados ese día con el mismo item
  cantidad?: number;       // cantidad solicitada (anula la inferida del texto)
  hora?: string;           // "HH:mm" hora de entrega/cita
  variante?: string;       // variante explícita del pedido
}

export function validateAgainstCatalog(
  text: string,
  catalog: CatalogItem[],
  fechaEntregaISO?: string,
  opts: ValidateOpts = {},
): CatalogValidation {
  const parsed = parseRequestFromText(text);
  parsed.fechaISO = fechaEntregaISO;
  if (opts.cantidad != null) parsed.cantidad = opts.cantidad;
  if (opts.hora) parsed.hora = opts.hora;
  if (opts.variante) parsed.variante = opts.variante;

  const alerts: string[] = [];
  const problems: CatalogValidation["problems"] = {};
  const checks: CheckResult[] = [];

  if (catalog.length === 0) {
    return {
      status: "sin_match",
      availability: "revision",
      alerts: [],
      problems,
      checks: [{ key: "catalogo", label: "Catálogo cargado", status: "warn", detail: "Tu catálogo está vacío" }],
      parsed,
      blockPayment: false,
    };
  }

  // 1. Match por nombre
  const match = catalog.find((c) => nameMatches(c, parsed.productoTexto));
  if (!match) {
    checks.push({ key: "producto", label: "Producto en catálogo", status: parsed.productoTexto ? "fail" : "warn",
      detail: parsed.productoTexto ? `"${parsed.productoTexto}" no encontrado` : "No identificado en el mensaje" });
    if (parsed.productoTexto) {
      alerts.push(`Producto solicitado ("${parsed.productoTexto}") no está en tu catálogo.`);
      problems.producto = true;
      return {
        status: "fuera_catalogo",
        availability: "no_disponible",
        alerts, problems, checks, parsed,
        blockPayment: true,
      };
    }
    return {
      status: "sin_match",
      availability: "revision",
      alerts, problems, checks, parsed,
      blockPayment: false,
    };
  }

  checks.push({ key: "producto", label: "Producto en catálogo", status: "ok", detail: match.nombre });

  // 2. Disponible (toggle global)
  if (!match.disponible) {
    alerts.push(`"${match.nombre}" está marcado como no disponible.`);
    problems.disponible = true;
    checks.push({ key: "disponible", label: "Disponible para venta", status: "fail" });
  } else {
    checks.push({ key: "disponible", label: "Disponible para venta", status: "ok" });
  }

  // 3. Variante
  if (parsed.variante && match.variantes.length > 0) {
    const ok = match.variantes.some((v) => v.toLowerCase() === parsed.variante!.toLowerCase());
    if (!ok) {
      alerts.push(`Variante "${parsed.variante}" no disponible. Opciones: ${match.variantes.join(", ")}.`);
      problems.variante = true;
      checks.push({ key: "variante", label: "Variante disponible", status: "fail" });
    } else {
      checks.push({ key: "variante", label: "Variante disponible", status: "ok", detail: parsed.variante });
    }
  }

  // 4. Capacidad por persona/cantidad vs descripción del item
  if (parsed.personas != null) {
    const cap = parseCapacityNumber(match.capacidad);
    if (cap != null && parsed.personas > cap) {
      alerts.push(`Capacidad no disponible: solo manejas ${match.capacidad}.`);
      problems.capacidad = true;
      checks.push({ key: "capacidad", label: "Capacidad del producto", status: "fail",
        detail: `Pidió ${parsed.personas} · máx ${match.capacidad}` });
    } else {
      checks.push({ key: "capacidad", label: "Capacidad del producto", status: "ok",
        detail: `${parsed.personas} personas` });
    }
  }

  // 5. Sabores / opciones
  if (parsed.sabor && match.opciones.length > 0) {
    const ok = match.opciones.some((o) => o.toLowerCase().includes(parsed.sabor!) || parsed.sabor!.includes(o.toLowerCase()));
    if (!ok) {
      alerts.push(`Sabor no disponible: solo ofreces ${match.opciones.join(", ")}.`);
      problems.opcion = true;
      checks.push({ key: "opcion", label: "Sabor / opción disponible", status: "fail",
        detail: `Pidió "${parsed.sabor}"` });
    } else {
      checks.push({ key: "opcion", label: "Sabor / opción disponible", status: "ok", detail: parsed.sabor });
    }
  }

  // 6. Stock
  if (match.stockDisponible > 0) {
    const necesario = parsed.cantidad ?? 1;
    if (necesario > match.stockDisponible) {
      alerts.push(`Stock insuficiente: solo ${match.stockDisponible} disponibles (pidió ${necesario}).`);
      problems.stock = true;
      checks.push({ key: "stock", label: "Stock suficiente", status: "fail",
        detail: `${match.stockDisponible} disponibles` });
    } else {
      checks.push({ key: "stock", label: "Stock suficiente", status: "ok",
        detail: `${match.stockDisponible} en stock` });
    }
  }

  // 7. Capacidad diaria (cuántos pedidos ya tomados ese día)
  if (match.capacidadDiaria > 0 && fechaEntregaISO) {
    const usados = opts.ordersOnDate ?? 0;
    if (usados >= match.capacidadDiaria) {
      alerts.push(`Capacidad diaria llena: ${usados}/${match.capacidadDiaria} pedidos para esa fecha.`);
      problems.capacidadDiaria = true;
      checks.push({ key: "capacidad_diaria", label: "Capacidad diaria", status: "fail",
        detail: `${usados}/${match.capacidadDiaria}` });
    } else {
      checks.push({ key: "capacidad_diaria", label: "Capacidad diaria", status: "ok",
        detail: `${usados}/${match.capacidadDiaria}` });
    }
  }

  // 8. Día de la semana
  if (fechaEntregaISO && match.diasDisponibles.length > 0) {
    const dk = dayKeyOf(fechaEntregaISO);
    if (dk && !match.diasDisponibles.includes(dk)) {
      alerts.push(`No trabajamos los ${DAY_LABELS[dk]}. Días: ${match.diasDisponibles.map((d) => DAY_LABELS[d]).join(", ")}.`);
      problems.dia = true;
      checks.push({ key: "dia", label: "Día disponible", status: "fail", detail: DAY_LABELS[dk] });
    } else if (dk) {
      checks.push({ key: "dia", label: "Día disponible", status: "ok", detail: DAY_LABELS[dk] });
    }
  }

  // 9. Horario
  if (parsed.hora && match.horarioDesde && match.horarioHasta) {
    if (!timeInRange(parsed.hora, match.horarioDesde, match.horarioHasta)) {
      alerts.push(`Fuera de horario: ${match.horarioDesde}–${match.horarioHasta}.`);
      problems.horario = true;
      checks.push({ key: "horario", label: "Horario disponible", status: "fail",
        detail: `Pidió ${parsed.hora}` });
    } else {
      checks.push({ key: "horario", label: "Horario disponible", status: "ok", detail: parsed.hora });
    }
  }

  // 10. Anticipación + tiempo mínimo de preparación
  if (fechaEntregaISO && (match.anticipacionHoras > 0 || match.prepMinutos > 0)) {
    const targetISO = parsed.hora
      ? `${fechaEntregaISO}T${parsed.hora}:00`
      : `${fechaEntregaISO}T12:00:00`;
    const target = new Date(targetISO).getTime();
    const horas = (target - Date.now()) / (1000 * 60 * 60);
    const minHoras = match.anticipacionHoras + match.prepMinutos / 60;
    if (horas < minHoras) {
      alerts.push(`Necesitas al menos ${match.anticipacionHoras}h de anticipación${match.prepMinutos > 0 ? ` + ${match.prepMinutos}min de preparación` : ""}.`);
      problems.anticipacion = true;
      problems.prep = match.prepMinutos > 0 || undefined;
      checks.push({ key: "anticipacion", label: "Tiempo de anticipación", status: "fail",
        detail: `Faltan ${Math.max(0, Math.round((minHoras - horas) * 10) / 10)}h` });
    } else {
      checks.push({ key: "anticipacion", label: "Tiempo de anticipación", status: "ok" });
    }
  }

  // Resolver estado
  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");

  let availability: AvailabilityStatus;
  let blockPayment: boolean;
  if (hasFail) {
    availability = "no_disponible";
    blockPayment = match.bloquearSinDisponibilidad !== false;
  } else if (hasWarn) {
    availability = "revision";
    blockPayment = false;
  } else {
    availability = "disponible";
    blockPayment = false;
  }

  return {
    status: hasFail ? "fuera_catalogo" : "ok",
    availability,
    match,
    alerts,
    problems,
    checks,
    parsed,
    blockPayment,
  };
}

/* ============== Mensajes inteligentes ============== */

export function buildOutOfCatalogMessage(v: CatalogValidation): string {
  const m = v.match;
  const partes: string[] = ["Hola 😊"];

  if (m && (v.problems.capacidadDiaria || v.problems.dia || v.problems.horario)) {
    const detalles: string[] = [`sí manejamos ${m.nombre.toLowerCase()}`];
    if (v.problems.capacidadDiaria) detalles.push("pero para esa fecha ya no tenemos disponibilidad");
    if (v.problems.dia) detalles.push("pero ese día no trabajamos");
    if (v.problems.horario) detalles.push(`pero nuestro horario es ${m.horarioDesde}–${m.horarioHasta}`);
    partes.push(detalles.join(" ") + ".");
    partes.push("Te puedo ofrecer otras opciones disponibles 🙌");
  } else if (m && (v.problems.capacidad || v.problems.opcion || v.problems.variante)) {
    const frags: string[] = [`sí manejamos ${m.nombre.toLowerCase()}`];
    if (v.problems.capacidad) frags.push(`pero por ahora solo tenemos tamaño para ${m.capacidad}`);
    if (v.problems.opcion && m.opciones.length > 0) frags.push(`y nuestras opciones disponibles son ${m.opciones.join(", ")}`);
    if (v.problems.variante && m.variantes.length > 0) frags.push(`y las variantes son ${m.variantes.join(", ")}`);
    partes.push(frags.join(" ") + ".");
  } else if (v.problems.stock && m) {
    partes.push(`tenemos limitado el stock de "${m.nombre}" en este momento.`);
  } else if (v.problems.producto) {
    partes.push("por ahora ese producto no está dentro de lo que ofrecemos, pero podemos revisarlo juntos.");
  } else if ((v.problems.anticipacion || v.problems.prep) && m) {
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

export function validateOrder(
  order: Order,
  catalog: CatalogItem[],
  allOrders?: Order[],
): CatalogValidation {
  const text = [order.mensajeOriginal, order.descripcion, order.detalles].filter(Boolean).join(" — ");
  const cantidad = order.cantidad ? parseInt(order.cantidad, 10) : undefined;

  // Pre-cálculo de pedidos en la misma fecha (para capacidad diaria)
  let ordersOnDate = 0;
  if (allOrders && order.fechaEntrega) {
    ordersOnDate = allOrders.filter(
      (o) => o.id !== order.id && o.fechaEntrega === order.fechaEntrega && o.estado !== "cancelado",
    ).length;
  }

  return validateAgainstCatalog(text, catalog, order.fechaEntrega, {
    cantidad: Number.isFinite(cantidad) ? cantidad : undefined,
    hora: order.horaEntrega || undefined,
    ordersOnDate,
  });
}

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  pendiente: "Pendiente de disponibilidad",
  disponible: "Disponible",
  no_disponible: "No disponible",
  revision: "Requiere revisión manual",
};

/* ============== Capacidad por fecha ============== */

/**
 * Cuenta cuántos pedidos activos consumen capacidad de un item en una fecha.
 * Considera reserva por id (`stockReservadoFor`) y, si no hay, fallback por
 * coincidencia de descripción.
 */
export function dailyUsageFor(
  itemId: string,
  fechaISO: string,
  orders: Order[],
): number {
  if (!fechaISO) return 0;
  const item = undefined as CatalogItem | undefined;
  let count = 0;
  for (const o of orders) {
    if (o.estado === "cancelado") continue;
    if (o.fechaEntrega !== fechaISO) continue;
    if (o.stockReservadoFor === itemId) {
      count += o.stockReservedQty || 1;
    }
  }
  return count;
}

/** Capacidad libre de un item para una fecha (Infinity si ilimitada). */
export function remainingCapacity(
  item: CatalogItem,
  fechaISO: string | undefined,
  orders: Order[],
): number {
  if (!fechaISO) return Number.POSITIVE_INFINITY;
  if (item.capacidadDiaria <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, item.capacidadDiaria - dailyUsageFor(item.id, fechaISO, orders));
}

/** Capacidad libre de una variante para una fecha (Infinity si ilimitada). */
export function variantRemaining(
  item: CatalogItem,
  variant: CatalogVariant,
  fechaISO: string | undefined,
  orders: Order[],
): number {
  if (variant.stockDiario > 0 && fechaISO) {
    // Cuenta usos por variante via notas (id de variante en stockReservedQty no aplica),
    // aproximamos con el item: una variante no excede el item.
    const usedItem = dailyUsageFor(item.id, fechaISO, orders);
    return Math.max(0, variant.stockDiario - usedItem);
  }
  return remainingCapacity(item, fechaISO, orders);
}

/* ============== Boost inyectable (aprendizaje) ============== */

let _productBoost: (id: string) => number = () => 1;
export function setProductBoostResolver(fn: (id: string) => number) {
  _productBoost = fn;
}

/* ============== Selector de mejor opción ============== */

export interface BestOptionRequest {
  personas?: number;
  sabor?: string;
  fechaISO?: string;
  hora?: string;
  tipo?: OrderType;
}

export interface ScoredOption {
  item: CatalogItem;
  variant: CatalogVariant;
  remaining: number;       // capacidad libre
  prepMinutes: number;     // tiempo de preparación efectivo
  margin: number;          // proxy de margen = precio
  score: number;           // mayor = mejor
  reason: string;
}

/**
 * Selecciona la mejor variante disponible para una solicitud.
 * Prioriza:
 *   1. Disponibilidad inmediata (capacidad > 0)
 *   2. Menor tiempo de preparación
 *   3. Mayor margen (precio como proxy)
 */
export function selectBestOption(
  catalog: CatalogItem[],
  req: BestOptionRequest,
  orders: Order[],
): ScoredOption | null {
  const candidates: ScoredOption[] = [];

  for (const item of catalog) {
    if (!item.disponible) continue;
    if (req.tipo && item.tipo !== (req.tipo as CatalogKind)) continue;

    const variants = item.variantesDetalle.length > 0
      ? item.variantesDetalle
      : [newVariant({
          nombre: item.nombre,
          personas: parseCapacityNumber(item.capacidad) ?? 0,
          precio: item.precioBase,
          sabores: item.opciones,
          stockDiario: item.capacidadDiaria,
          tiempoPreparacion: item.prepMinutos,
        })];

    for (const v of variants) {
      if (!v.disponible) continue;

      // Filtros duros
      if (req.personas && v.personas > 0 && v.personas < req.personas) continue;
      if (req.sabor && v.sabores.length > 0) {
        const ok = v.sabores.some(
          (s) => s.toLowerCase().includes(req.sabor!.toLowerCase()) ||
                 req.sabor!.toLowerCase().includes(s.toLowerCase()),
        );
        if (!ok) continue;
      }

      const remaining = variantRemaining(item, v, req.fechaISO, orders);
      if (remaining <= 0) continue;

      const prep = v.tiempoPreparacion || item.prepMinutos || 0;
      const precio = v.precio || item.precioBase || 0;

      // Score: disponibilidad pesa más, luego prep (menor es mejor), luego precio (mayor es mejor)
      const dispScore = remaining === Number.POSITIVE_INFINITY ? 1000 : Math.min(remaining * 100, 1000);
      const prepScore = Math.max(0, 500 - prep);     // 0 prep = 500, 500 min = 0
      const marginScore = Math.min(precio / 10, 500); // tope 500

      // Boost por aprendizaje (inyectado desde learning-engine)
      const boost = _productBoost(item.id);
      const score = (dispScore + prepScore + marginScore) * boost;

      candidates.push({
        item, variant: v, remaining, prepMinutes: prep, margin: precio, score,
        reason: remaining < 5
          ? `quedan ${remaining}, listo en ${prep} min`
          : `disponible, listo en ${prep} min`,
      });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

/**
 * Dada una solicitud de N personas mayor a la capacidad de cualquier variante,
 * propone una combinación de variantes que sumen al menos N personas.
 * Prioriza menor cantidad de unidades y mayor capacidad libre.
 */
export interface ComboSuggestion {
  pieces: { item: CatalogItem; variant: CatalogVariant; cantidad: number }[];
  totalPersonas: number;
  totalPrecio: number;
}

export function suggestVariantCombo(
  catalog: CatalogItem[],
  personas: number,
  fechaISO: string | undefined,
  orders: Order[],
  req: Pick<BestOptionRequest, "sabor" | "tipo"> = {},
): ComboSuggestion | null {
  if (!personas || personas <= 0) return null;

  // Recolecta variantes válidas con capacidad libre
  const pool: { item: CatalogItem; variant: CatalogVariant; remaining: number }[] = [];
  for (const item of catalog) {
    if (!item.disponible) continue;
    if (req.tipo && item.tipo !== (req.tipo as CatalogKind)) continue;
    const vs = item.variantesDetalle.length > 0 ? item.variantesDetalle : [];
    for (const v of vs) {
      if (!v.disponible || v.personas <= 0) continue;
      if (req.sabor && v.sabores.length > 0) {
        const ok = v.sabores.some(
          (s) => s.toLowerCase().includes(req.sabor!.toLowerCase()),
        );
        if (!ok) continue;
      }
      const remaining = variantRemaining(item, v, fechaISO, orders);
      if (remaining <= 0) continue;
      pool.push({ item, variant: v, remaining });
    }
  }
  if (pool.length === 0) return null;

  // Greedy: empezar por la variante más grande que quepa, completar con menores
  pool.sort((a, b) => b.variant.personas - a.variant.personas);
  const big = pool[0];
  const nBig = Math.min(big.remaining, Math.floor(personas / big.variant.personas));
  let cubierto = nBig * big.variant.personas;
  const pieces: ComboSuggestion["pieces"] = nBig > 0
    ? [{ item: big.item, variant: big.variant, cantidad: nBig }]
    : [];

  if (cubierto < personas) {
    const resto = personas - cubierto;
    const small = pool
      .filter((p) => p.variant.personas >= resto)
      .sort((a, b) => a.variant.personas - b.variant.personas)[0]
      ?? pool[pool.length - 1];
    if (small && small.remaining > 0) {
      pieces.push({ item: small.item, variant: small.variant, cantidad: 1 });
      cubierto += small.variant.personas;
    }
  }

  if (pieces.length === 0) return null;

  const totalPrecio = pieces.reduce((acc, p) => acc + p.variant.precio * p.cantidad, 0);
  return { pieces, totalPersonas: cubierto, totalPrecio };
}
