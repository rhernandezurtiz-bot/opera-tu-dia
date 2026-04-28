import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RiskLevel = "bajo" | "medio" | "alto";
export type OrderStatus = "nuevo" | "confirmado" | "en_proceso" | "listo" | "entregado" | "cancelado";
export type PaymentStatus = "pendiente" | "anticipo_solicitado" | "anticipo" | "pagado" | "vencido";
export type OrderType = "producto" | "servicio" | "cita" | "personalizado";

export const typeLabels: Record<OrderType, string> = {
  producto: "Producto",
  servicio: "Servicio",
  cita: "Cita / reserva",
  personalizado: "Personalizado",
};

export const checklistByType: Record<OrderType, { key: string; label: string }[]> = {
  producto: [
    { key: "pago", label: "Pago confirmado" },
    { key: "produccion", label: "Producción" },
    { key: "empaque", label: "Empaque" },
    { key: "entrega", label: "Entrega" },
  ],
  servicio: [
    { key: "confirmacion", label: "Confirmación" },
    { key: "preparacion", label: "Preparación" },
    { key: "ejecucion", label: "Ejecución" },
    { key: "finalizado", label: "Finalizado" },
  ],
  cita: [
    { key: "confirmacion", label: "Cita confirmada" },
    { key: "recordatorio", label: "Recordatorio enviado" },
    { key: "atendida", label: "Atendida" },
    { key: "seguimiento", label: "Seguimiento" },
  ],
  personalizado: [
    { key: "brief", label: "Brief recibido" },
    { key: "propuesta", label: "Propuesta aprobada" },
    { key: "anticipo", label: "Anticipo recibido" },
    { key: "ejecucion", label: "Ejecución" },
    { key: "entrega", label: "Entrega" },
  ],
};

export interface Order {
  id: string;
  cliente: string;
  telefono: string;
  tipo: OrderType;
  descripcion: string;
  cantidad: string;
  fechaEntrega: string;
  horaEntrega: string;
  direccion: string;
  detalles: string;
  pago: PaymentStatus;
  precio: number;
  notas: string;
  estado: OrderStatus;
  riesgo: RiskLevel;
  faltantes: string[];
  checklist: Record<string, boolean>;
  mensajeOriginal: string;
  createdAt: number;
  // Confianza de los datos detectados
  fechaConfirmada?: boolean;
  horaAprox?: string; // "mañana" | "tarde" | "noche" | "mediodía" | "4–5 pm"
  horaConfirmada?: boolean; // false si la hora es ambigua o aproximada
  fechaTextoOriginal?: string; // texto exacto: "viernes", "mañana"
  ocasion?: string; // "cumpleaños", "boda", "aniversario", etc.
  ambiguo?: boolean; // el mensaje contiene marcadores de incertidumbre
  paymentLink?: string; // link de pago generado (simulado)
}

export interface Miembro { id: string; nombre: string; rol: string; }

export interface RiskRules {
  fecha: boolean;
  hora: boolean;
  direccion: boolean;
  pago: boolean;
  telefono: boolean;
  descripcion: boolean;
}

export interface Negocio {
  nombre: string;
  tipoNegocio: string;
  telefono: string;
  direccion: string;
  horarios: string;
  tiposActivos: OrderType[];
}

export type WhatsappStatus = "nuevo" | "analizado" | "convertido" | "respondido";

export interface WhatsappMessage {
  id: string;
  cliente: string;
  telefono: string;
  texto: string;
  recibidoAt: number;
  estado: WhatsappStatus;
  ordenId?: string;
}

export interface WhatsappConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  conectado: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

const seedOrders = (): Order[] => [
  {
    id: "o1", cliente: "Mariana López", telefono: "+52 55 1234 5678",
    tipo: "producto", descripcion: "Pastel de chocolate", cantidad: "1",
    fechaEntrega: today(), horaEntrega: "17:00", direccion: "Av. Reforma 123, CDMX",
    detalles: "Para 20 personas, texto: Feliz cumpleaños Mariana",
    pago: "anticipo", precio: 850, notas: "Cliente recurrente",
    estado: "confirmado", riesgo: "bajo", faltantes: [],
    checklist: { pago: true, produccion: true, empaque: false, entrega: false },
    mensajeOriginal: "Hola, quiero el pastel de chocolate para hoy 5pm",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "o2", cliente: "Sofía Ramírez", telefono: "+52 55 9876 5432",
    tipo: "servicio", descripcion: "Sesión de masaje relajante", cantidad: "1",
    fechaEntrega: tomorrow(), horaEntrega: "", direccion: "A domicilio - Polanco",
    detalles: "60 minutos, aceite de lavanda", pago: "pendiente", precio: 800,
    notas: "", estado: "nuevo", riesgo: "medio", faltantes: ["Hora", "Pago"],
    checklist: {},
    mensajeOriginal: "Hola, necesito un masaje a domicilio para mañana",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "o3", cliente: "Ana Torres", telefono: "",
    tipo: "cita", descripcion: "Corte y color", cantidad: "1",
    fechaEntrega: today(), horaEntrega: "15:00", direccion: "",
    detalles: "", pago: "pendiente", precio: 0,
    notas: "Sin teléfono ni confirmación",
    estado: "nuevo", riesgo: "alto",
    faltantes: ["Teléfono", "Pago", "Descripción detallada"],
    checklist: {},
    mensajeOriginal: "Quiero agendar para hoy a las 3",
    createdAt: Date.now() - 1800000,
  },
  {
    id: "o4", cliente: "Carolina Méndez", telefono: "+52 55 5555 1212",
    tipo: "personalizado", descripcion: "Arreglo floral para boda", cantidad: "1",
    fechaEntrega: tomorrow(), horaEntrega: "11:00", direccion: "Jardín San Ángel",
    detalles: "Tonos blancos y dorados, 6 centros de mesa",
    pago: "anticipo", precio: 4500, notas: "Cotización aprobada",
    estado: "en_proceso", riesgo: "bajo", faltantes: [],
    checklist: { brief: true, propuesta: true, anticipo: true, ejecucion: false, entrega: false },
    mensajeOriginal: "Necesito arreglos para mi boda mañana",
    createdAt: Date.now() - 7200000,
  },
];

const seedMessages = (): WhatsappMessage[] => [
  {
    id: "w1", cliente: "Lucía Fernández", telefono: "+52 55 4400 1122",
    texto: "Hola! Quisiera encargar 24 cupcakes de vainilla para el sábado. ¿Cuánto sería?",
    recibidoAt: Date.now() - 1000 * 60 * 8, estado: "nuevo",
  },
  {
    id: "w2", cliente: "+52 55 7788 0011", telefono: "+52 55 7788 0011",
    texto: "Buen día, necesito agendar una sesión de masaje hoy en la tarde, lo más pronto posible 🙏",
    recibidoAt: Date.now() - 1000 * 60 * 22, estado: "nuevo",
  },
  {
    id: "w3", cliente: "Roberto Salinas", telefono: "+52 55 9090 5050",
    texto: "Hola, ¿pueden hacerme un arreglo floral para mañana? Es para regalo, presupuesto unos 1500.",
    recibidoAt: Date.now() - 1000 * 60 * 60 * 2, estado: "analizado",
  },
  {
    id: "w4", cliente: "Mariana López", telefono: "+52 55 1234 5678",
    texto: "Hola, quiero el pastel de chocolate para hoy 5pm",
    recibidoAt: Date.now() - 1000 * 60 * 60 * 20, estado: "convertido", ordenId: "o1",
  },
];

interface State {
  orders: Order[];
  miembros: Miembro[];
  negocio: Negocio;
  riskRules: RiskRules;
  messages: WhatsappMessage[];
  whatsapp: WhatsappConfig;
  // Notas internas del cliente, indexadas por clientKey() (teléfono o nombre normalizado)
  clientNotes: Record<string, string>;
  addOrder: (o: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  toggleChecklist: (id: string, key: string) => void;
  addMiembro: (m: Miembro) => void;
  removeMiembro: (id: string) => void;
  setNegocio: (n: Partial<Negocio>) => void;
  setRiskRules: (r: Partial<RiskRules>) => void;
  toggleTipo: (t: OrderType) => void;
  addMessage: (m: WhatsappMessage) => void;
  setMessageStatus: (id: string, estado: WhatsappStatus) => void;
  linkMessageOrder: (id: string, ordenId: string) => void;
  setWhatsapp: (c: Partial<WhatsappConfig>) => void;
  setClientNote: (key: string, note: string) => void;
  generatePaymentLink: (id: string) => string;
}

export const useOperia = create<State>()(
  persist(
    (set) => ({
      orders: seedOrders(),
      miembros: [
        { id: "m1", nombre: "Laura", rol: "Operaciones" },
        { id: "m2", nombre: "Diego", rol: "Atención al cliente" },
      ],
      negocio: {
        nombre: "Mi Negocio",
        tipoNegocio: "Mixto",
        telefono: "+52 55 0000 0000",
        direccion: "Ciudad de México",
        horarios: "Lun a Sáb 9:00 - 19:00",
        tiposActivos: ["producto", "servicio", "cita", "personalizado"],
      },
      riskRules: { fecha: true, hora: true, direccion: true, pago: true, telefono: false, descripcion: true },
      messages: seedMessages(),
      whatsapp: { phoneNumberId: "", accessToken: "", verifyToken: "", webhookUrl: "https://tu-dominio.com/api/whatsapp/webhook", conectado: false },
      clientNotes: {
        // Demo: clientes recurrentes con notas internas
        "+525512345678": "Cliente VIP — siempre paga puntual. Le encanta el chocolate.",
      },
      setClientNote: (key, note) => set((s) => ({ clientNotes: { ...s.clientNotes, [key]: note } })),
      addMessage: (m) => set((s) => ({ messages: [m, ...s.messages] })),
      setMessageStatus: (id, estado) => set((s) => ({
        messages: s.messages.map((m) => (m.id === id ? { ...m, estado } : m)),
      })),
      linkMessageOrder: (id, ordenId) => set((s) => ({
        messages: s.messages.map((m) => (m.id === id ? { ...m, ordenId, estado: "convertido" } : m)),
      })),
      setWhatsapp: (c) => set((s) => ({ whatsapp: { ...s.whatsapp, ...c } })),
      addOrder: (o) => set((s) => ({ orders: [recompute(o), ...s.orders] })),
      updateOrder: (id, patch) => set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? recompute({ ...o, ...patch }) : o)),
      })),
      removeOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
      toggleChecklist: (id, key) => set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id ? { ...o, checklist: { ...o.checklist, [key]: !o.checklist[key] } } : o
        ),
      })),
      addMiembro: (m) => set((s) => ({ miembros: [...s.miembros, m] })),
      removeMiembro: (id) => set((s) => ({ miembros: s.miembros.filter((m) => m.id !== id) })),
      setNegocio: (n) => set((s) => ({ negocio: { ...s.negocio, ...n } })),
      setRiskRules: (r) => set((s) => ({ riskRules: { ...s.riskRules, ...r } })),
      toggleTipo: (t) => set((s) => {
        const has = s.negocio.tiposActivos.includes(t);
        return { negocio: { ...s.negocio, tiposActivos: has ? s.negocio.tiposActivos.filter((x) => x !== t) : [...s.negocio.tiposActivos, t] } };
      }),
      generatePaymentLink: (id) => {
        const token = Math.random().toString(36).slice(2, 10);
        const link = `https://pay.operia.app/${id}/${token}`;
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? recompute({ ...o, paymentLink: link, pago: o.pago === "pagado" ? o.pago : "anticipo_solicitado" })
              : o
          ),
        }));
        return link;
      },
    }),
    { name: "operia-store-v4" }
  )
);

function recompute(o: Order): Order {
  const faltantes: string[] = [];
  // Producto / descripción exacta
  if (!o.descripcion || /producto por definir/i.test(o.descripcion)) faltantes.push("Producto exacto");
  // Cantidad (sólo relevante para producto / personalizado)
  if ((o.tipo === "producto" || o.tipo === "personalizado") && (!o.cantidad || o.cantidad === "1" && /por definir/i.test(o.descripcion))) {
    if (!o.cantidad) faltantes.push("Cantidad");
  }
  // Fecha
  if (!o.fechaEntrega) faltantes.push("Fecha");
  else if (o.fechaConfirmada === false) faltantes.push("Fecha exacta");
  // Hora
  if (!o.horaEntrega) {
    if (o.horaAprox) faltantes.push("Hora exacta");
    else faltantes.push("Hora");
  } else if (o.horaConfirmada === false) {
    faltantes.push("Hora exacta");
  }
  // Dirección
  if (o.tipo !== "cita") {
    if (!o.direccion) faltantes.push("Dirección completa");
    else if (o.direccion.split(/\s+/).length < 2 && !/\d/.test(o.direccion)) faltantes.push("Dirección completa");
  }
  // Pago
  if (o.pago !== "pagado" && o.pago !== "anticipo") faltantes.push("Pago");
  // Contacto
  if (!o.telefono) faltantes.push("Contacto");

  // Auto-vencimiento: si hay fecha pasada y no está pagado/entregado/cancelado
  let pago = o.pago;
  const todayISO = new Date().toISOString().slice(0, 10);
  if (
    pago !== "pagado" &&
    o.fechaEntrega &&
    o.fechaEntrega < todayISO &&
    o.estado !== "entregado" &&
    o.estado !== "cancelado"
  ) {
    pago = "vencido";
  }

  // Riesgo: >2 críticos => ALTO; 1–2 => MEDIO; 0 => BAJO
  const criticos = faltantes.filter((f) =>
    /Producto|Fecha|Hora|Dirección|Contacto/i.test(f)
  ).length;
  let riesgo: RiskLevel = "bajo";
  if (criticos > 2 || o.ambiguo || pago === "vencido") riesgo = "alto";
  else if (faltantes.length >= 1) riesgo = "medio";

  return { ...o, pago, faltantes, riesgo };
}

// Keyword sets for type classification
const SERVICE_KW = /\b(arreglar|arreglo|reparar|reparaci[oó]n|instalar|instalaci[oó]n|servicio|fuga|limpieza|limpiar|sesi[oó]n|masaje|plomer[ií]a|plomero|electricista|electricidad|pintar|pintura|fumigaci[oó]n|jardiner[ií]a|mudanza|cerrajero|mantenimiento|revisar|revisi[oó]n|destap|desazolve)\b/i;
const APPOINTMENT_KW = /\b(cita|agendar|agenda|reservar|reserva|turno|appointment|consulta|consultorio|corte de pelo|corte y color|manicure|pedicure|peinado|barber[ií]a|dentista|m[eé]dico|doctor|terapia)\b/i;
const PRODUCT_KW = /\b(pastel|cupcakes?|galletas?|postre|comida|men[uú]|pizza|hamburguesa|ramo|flores|arreglo floral|producto|piezas?|unidades?|encargar|comprar|llevar)\b/i;
const CUSTOM_KW = /\b(personaliza|a medida|custom|cotizar|cotizaci[oó]n|presupuesto|brief|dise[ñn]o especial)\b/i;

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Limpia descripciones: quita relleno, fechas, horas y zonas para no duplicar
function cleanDesc(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\b(el|la|los|las|un|una|unos|unas)\s+/gi, "");
  s = s.replace(/\b(hoy|ma[ñn]ana|pasado ma[ñn]ana)\b/gi, "");
  s = s.replace(/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, "");
  s = s.replace(/\bpor la (ma[ñn]ana|tarde|noche)\b/gi, "");
  s = s.replace(/\bal mediod[ií]a\b/gi, "");
  s = s.replace(/\ba las\s+\d{1,2}(:\d{2})?\s*(am|pm)?/gi, "");
  s = s.replace(/\b(en|para|hacia|de)\s+(providencia|polanco|condesa|roma|coyoac[aá]n|sat[eé]lite|las lomas|centro|norte|sur)\b/gi, "");
  s = s.replace(/\s{2,}/g, " ").replace(/[\s,;.\-]+$/g, "").trim();
  return s;
}

function buildSummary(tipo: OrderType, rawDesc: string, fechaTxt: string, horaTxt: string, direccion: string, lower: string): string {
  let core = cleanDesc(rawDesc);

  if (tipo === "servicio") {
    if (/fuga/.test(lower)) core = "Reparación de fuga de agua";
    else if (/masaje/.test(lower)) core = "Sesión de masaje";
    else if (/limpieza|limpiar/.test(lower)) core = "Servicio de limpieza";
    else if (/plomer|plomero/.test(lower)) core = "Servicio de plomería";
    else if (/electric/.test(lower)) core = "Servicio eléctrico";
    else if (/instalar|instalaci[oó]n/.test(lower)) core = core ? `Instalación: ${core}` : "Instalación";
    else if (/(reparar|reparaci[oó]n|arreglar|arreglo)/.test(lower) && core) core = `Reparación: ${core}`;
    else if (!core) core = "Servicio solicitado";
  } else if (tipo === "cita") {
    if (!core) core = "Cita / reserva";
    else core = `Cita: ${core}`;
  } else if (tipo === "producto") {
    if (!core) core = "Pedido de producto";
  } else if (!core) {
    core = "Pedido";
  }

  core = titleCase(core);

  // Combinar fecha + hora en un solo bloque limpio
  const cuando = [fechaTxt, horaTxt].filter(Boolean).join(" ");
  const parts = [core];
  if (cuando) parts.push(cuando);
  if (direccion) parts.push(direccion);
  // Eliminar duplicados consecutivos por seguridad
  const seen = new Set<string>();
  const dedup = parts.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return dedup.join(" — ");
}

const ZONAS_RE = /\b(Providencia|Polanco|Condesa|Roma|Coyoac[aá]n|Sat[eé]lite|Las Lomas|Centro|Norte|Sur|San [AÁ]ngel|Del Valle|N[aá]poles|Doctores|Juárez|Juarez|Tlalpan|Iztapalapa|[ÑN]u[ñn]oa|Las Condes|Vitacura)\b/i;

function extractLocation(text: string): string {
  // 1) Patrones explícitos
  const m = text.match(/(?:direcci[oó]n|env[ií]o a|entrega en|llevar a|domicilio en|en la zona de|en la colonia|en el barrio de|en)\s+((?:la\s+|el\s+)?(?:colonia\s+|col\.\s+)?[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]{1,40})/);
  if (m) {
    let loc = m[1].trim().replace(/\s+(el|la|los|las)\s+.*$/i, "").trim();
    // si la captura contiene una zona conocida, recortar a ella
    const z = loc.match(ZONAS_RE);
    if (z) return titleCase(z[1]);
    // recortar a 3 palabras como mucho
    loc = loc.split(/\s+/).slice(0, 4).join(" ");
    return loc;
  }
  // 2) Zonas conocidas sueltas
  const z = text.match(ZONAS_RE);
  if (z) return titleCase(z[1]);
  return "";
}

export function parseWhatsapp(text: string): Order {
  const lower = text.toLowerCase();
  const id = "o" + Math.random().toString(36).slice(2, 9);

  // Tipo — prioridad: cita > servicio > personalizado > producto
  let tipo: OrderType = "producto";
  let tipoDetectado = false;
  if (APPOINTMENT_KW.test(text)) { tipo = "cita"; tipoDetectado = true; }
  else if (SERVICE_KW.test(text)) { tipo = "servicio"; tipoDetectado = true; }
  else if (CUSTOM_KW.test(text)) { tipo = "personalizado"; tipoDetectado = true; }
  else if (PRODUCT_KW.test(text)) { tipo = "producto"; tipoDetectado = true; }

  // Descripción heurística
  let descripcion = "";
  const descMatch = text.match(/(?:quiero|necesito|busco|me gustar[ií]a|quisiera|comprar|encargar|reservar|agendar|que me|pueden|podr[ií]an)\s+(?:un[oa]?\s+|el\s+|la\s+)?([^\n.!?]{3,100})/i);
  if (descMatch) descripcion = descMatch[1].trim().replace(/[,;].*$/, "");

  // Cantidad
  const cantMatch = text.match(/(\d+)\s+(?:piezas?|unidades?|productos?|cupcakes?|galletas?|sesiones?|personas?)/i);
  const cantidad = cantMatch ? cantMatch[1] : "1";

  // Fecha — exacta o referencial (no confirmada)
  let fechaEntrega = "";
  let fechaConfirmada = false;
  let fechaTextoOriginal = "";
  if (/\bhoy\b/.test(lower)) { fechaEntrega = today(); fechaConfirmada = true; fechaTextoOriginal = "hoy"; }
  else if (/\bma[ñn]ana\b/.test(lower)) { fechaEntrega = tomorrow(); fechaConfirmada = true; fechaTextoOriginal = "mañana"; }
  else {
    const map: Record<string, number> = { domingo:0,lunes:1,martes:2,miércoles:3,miercoles:3,jueves:4,viernes:5,sábado:6,sabado:6 };
    for (const d of Object.keys(map)) {
      if (lower.includes(d)) {
        const target = map[d];
        const now = new Date();
        const diff = (target - now.getDay() + 7) % 7 || 7;
        const dt = new Date(now); dt.setDate(now.getDate() + diff);
        fechaEntrega = dt.toISOString().slice(0,10);
        fechaConfirmada = false; // día de la semana = aproximado, sin año explícito
        fechaTextoOriginal = d;
        break;
      }
    }
  }
  // Fecha explícita dd/mm => confirmada
  const explicit = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (explicit) {
    const d = explicit[1].padStart(2, "0");
    const m = explicit[2].padStart(2, "0");
    const y = explicit[3] ? (explicit[3].length === 2 ? "20" + explicit[3] : explicit[3]) : String(new Date().getFullYear());
    fechaEntrega = `${y}-${m}-${d}`;
    fechaConfirmada = true;
    fechaTextoOriginal = `${d}/${m}`;
  }

  // Detectar marcadores de incertidumbre globales
  const UNCERTAIN_RE = /\b(tal vez|quiz[aá]s?|aprox(imadamente)?|m[aá]s o menos|mas o menos|no s[eé] bien|no estoy segur[oa]|creo que|por ah[ií]|como a las|como en la|alrededor de|cerca de|entre las)\b/i;
  const ambiguo = UNCERTAIN_RE.test(text);

  // Hora — exacta, rango ambiguo, o aproximada
  let horaEntrega = "";
  let horaAprox = "";
  let horaConfirmada = true;

  // Rango "como a las 4 o 5", "entre las 3 y 5", "4-5 pm"
  const rango = text.match(/(?:como a las|entre las|de)\s*(\d{1,2})\s*(?:o|a|y|-|–)\s*(\d{1,2})\s*(am|pm)?/i)
             || text.match(/\b(\d{1,2})\s*(?:-|–|a|o)\s*(\d{1,2})\s*(am|pm)\b/i);
  if (rango) {
    const a = rango[1]; const b = rango[2]; const suf = (rango[3] || "").toLowerCase();
    horaAprox = `${a}–${b}${suf ? " " + suf : ""}`;
    horaConfirmada = false;
  } else {
    const hMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|h)\b/i);
    const hContext = text.match(/\ba las\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    const m1 = hMatch || hContext;
    if (m1) {
      let h = parseInt(m1[1], 10);
      const m = m1[2] || "00";
      const suf = m1[3] || "";
      if (/pm/i.test(suf) && h < 12) h += 12;
      if (/am/i.test(suf) && h === 12) h = 0;
      if (h >= 0 && h <= 23) {
        // Si la hora exacta vino acompañada de un marcador de incertidumbre cercano,
        // tratarla como NO confirmada
        if (ambiguo && /\b(como|tal vez|aprox|m[aá]s o menos|creo)\b/i.test(text)) {
          horaAprox = `${String(h).padStart(2,"0")}:${m}`;
          horaConfirmada = false;
        } else {
          horaEntrega = `${String(h).padStart(2,"0")}:${m}`;
        }
      }
    }
  }
  if (!horaEntrega && !horaAprox) {
    if (/\bpor la ma[ñn]ana\b|\ben la ma[ñn]ana\b/i.test(text)) { horaAprox = "mañana"; horaConfirmada = false; }
    else if (/\bpor la tarde\b|\ben la tarde\b/i.test(text)) { horaAprox = "tarde"; horaConfirmada = false; }
    else if (/\bpor la noche\b|\ben la noche\b|\bde noche\b/i.test(text)) { horaAprox = "noche"; horaConfirmada = false; }
    else if (/\bal mediod[ií]a\b/i.test(text)) { horaAprox = "mediodía"; horaConfirmada = false; }
  }

  // Cliente
  let cliente = "";
  const nameMatch = text.match(/(?:soy|me llamo|de parte de|para)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
  if (nameMatch) cliente = nameMatch[1];

  // Teléfono
  const phone = text.match(/(\+?\d[\d\s\-]{7,}\d)/);
  const telefono = phone ? phone[1].trim() : "";

  // Pago
  let pago: PaymentStatus = "pendiente";
  if (/pagad|pagué|liquidad/i.test(text)) pago = "pagado";
  else if (/anticipo|adelanto|se[ñn]a|dep[oó]sito/i.test(text)) pago = "anticipo";

  // Dirección / ubicación limpia
  const direccion = extractLocation(text);

  // Detalles
  let detalles = "";
  const detMatch = text.match(/(?:que diga|texto|tema|mensaje|nota|detalle|incluir)[:\s]+([^\n.]+)/i);
  if (detMatch) detalles = detMatch[1].trim();

  // Detectar ocasión (cumpleaños, boda, etc.)
  const OCASIONES_RE = /\b(cumplea[ñn]os|boda|aniversario|bautizo|graduaci[oó]n|baby shower|despedida|reuni[oó]n|fiesta|evento|navidad|d[ií]a de las madres)\b/i;
  const ocasionMatch = text.match(OCASIONES_RE);
  const ocasion = ocasionMatch ? ocasionMatch[1].toLowerCase() : "";

  // Si producto no es claro pero hay ocasión → resumen "Pedido para X (producto por definir)"
  let descripcionFinal = descripcion;
  const productoVago = !descripcion || /algo|alguna cosa|lo que tengan|no s[eé] bien|cualquier/i.test(descripcion);
  if (tipo === "producto" && productoVago && ocasion) {
    descripcionFinal = `Pedido para ${ocasion} (producto por definir)`;
  } else if (tipo === "producto" && productoVago && !ocasion) {
    descripcionFinal = "Producto por definir";
  }

  // Construir resumen limpio
  const fechaTxt = fechaEntrega
    ? (fechaConfirmada
        ? (fechaEntrega === today() ? "hoy" : fechaEntrega === tomorrow() ? "mañana" : fechaEntrega)
        : fechaTextoOriginal)
    : "";
  const horaTxt = horaEntrega
    ? `a las ${horaEntrega}`
    : horaAprox
      ? (/^\d/.test(horaAprox) ? horaAprox : `por la ${horaAprox}`)
      : "";

  // Para resumen, si la descripción ya es "Pedido para X (producto por definir)", úsala directa
  const resumen = (descripcionFinal && /\(producto por definir\)/i.test(descripcionFinal))
    ? [descripcionFinal, fechaTxt, direccion].filter(Boolean).join(" — ")
    : buildSummary(tipo, descripcionFinal, fechaTxt, horaTxt, direccion, lower);

  // Notas: marcar confianza explícita
  const notasArr: string[] = [];
  if (fechaEntrega && !fechaConfirmada) notasArr.push(`Fecha: ${fechaTextoOriginal} (no confirmada)`);
  if (horaAprox && /^\d/.test(horaAprox)) notasArr.push(`Hora: ${horaAprox} (no confirmada)`);
  else if (horaAprox) notasArr.push(`Hora: ${horaAprox} (aproximada)`);
  if (!horaEntrega && !horaAprox) notasArr.push("Hora: no definida");
  if (ambiguo) notasArr.push("Mensaje con datos ambiguos");
  if (!tipoDetectado && !descripcion) notasArr.push("Datos no confirmados");

  return recompute({
    id, cliente, telefono, tipo,
    descripcion: resumen,
    cantidad,
    fechaEntrega, horaEntrega, direccion, detalles,
    pago, precio: 0, notas: notasArr.join(" · "), estado: "nuevo", riesgo: "bajo",
    faltantes: [], checklist: {},
    mensajeOriginal: text, createdAt: Date.now(),
    fechaConfirmada, horaAprox, horaConfirmada, fechaTextoOriginal, ocasion, ambiguo,
  });
}

export const todayStr = today;

/* ---------- Client identity & stats ---------- */

// Clave única por cliente: prioriza teléfono normalizado, si no, nombre normalizado.
export function clientKey(cliente: string, telefono: string): string {
  const phone = (telefono || "").replace(/[^\d+]/g, "");
  if (phone.length >= 7) return phone;
  const name = (cliente || "").trim().toLowerCase().replace(/\s+/g, " ");
  return name ? `name:${name}` : "";
}

export interface ClientStats {
  key: string;
  nombre: string;
  telefono: string;
  totalPedidos: number;
  totalGastado: number;
  ultimaFecha: string; // ISO yyyy-mm-dd
  comunes: string[]; // descripciones más frecuentes
  esRecurrente: boolean;
}

export function getClientStats(orders: Order[], key: string): ClientStats | null {
  if (!key) return null;
  const items = orders.filter((o) => clientKey(o.cliente, o.telefono) === key);
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => (b.fechaEntrega || "").localeCompare(a.fechaEntrega || ""));
  const totalGastado = items.reduce((acc, o) => acc + (o.estado !== "cancelado" ? (o.precio || 0) : 0), 0);
  // Top 2 descripciones más repetidas (normalizadas a la primera frase)
  const counts = new Map<string, number>();
  for (const o of items) {
    const d = (o.descripcion || "").split(" — ")[0].trim();
    if (!d) continue;
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  const comunes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([d]) => d);
  const last = sorted[0];
  return {
    key,
    nombre: items.find((o) => o.cliente)?.cliente || "Cliente",
    telefono: items.find((o) => o.telefono)?.telefono || "",
    totalPedidos: items.length,
    totalGastado,
    ultimaFecha: last.fechaEntrega || "",
    comunes,
    esRecurrente: items.length >= 2,
  };
}

// Lista de clientes únicos derivada de las órdenes
export function getAllClients(orders: Order[]): ClientStats[] {
  const map = new Map<string, true>();
  const result: ClientStats[] = [];
  for (const o of orders) {
    const k = clientKey(o.cliente, o.telefono);
    if (!k || map.has(k)) continue;
    map.set(k, true);
    const stats = getClientStats(orders, k);
    if (stats) result.push(stats);
  }
  return result.sort((a, b) => b.totalPedidos - a.totalPedidos);
}
