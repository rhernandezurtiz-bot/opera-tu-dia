import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RiskLevel = "bajo" | "medio" | "alto";
export type OrderStatus = "nuevo" | "confirmado" | "en_proceso" | "listo" | "entregado" | "cancelado";
export type PaymentStatus = "pendiente" | "anticipo" | "pagado";
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
    }),
    { name: "operia-store-v3" }
  )
);

function recompute(o: Order): Order {
  const faltantes: string[] = [];
  if (!o.fechaEntrega) faltantes.push("Fecha");
  if (!o.horaEntrega) faltantes.push("Hora");
  if (!o.direccion && o.tipo !== "cita") faltantes.push("Dirección");
  if (o.pago === "pendiente") faltantes.push("Pago");
  if (!o.descripcion) faltantes.push("Descripción");
  if (!o.telefono) faltantes.push("Teléfono");
  let riesgo: RiskLevel = "bajo";
  const isToday = o.fechaEntrega === today();
  if (!o.fechaEntrega || !o.descripcion || (isToday && !o.horaEntrega)) riesgo = "alto";
  else if (faltantes.length >= 1) riesgo = "medio";
  return { ...o, faltantes, riesgo };
}

// Keyword sets for type classification
const SERVICE_KW = /\b(arreglar|arreglo|reparar|reparaci[oó]n|instalar|instalaci[oó]n|servicio|fuga|limpieza|limpiar|sesi[oó]n|masaje|plomer[ií]a|plomero|electricista|electricidad|pintar|pintura|fumigaci[oó]n|jardiner[ií]a|mudanza|cerrajero|mantenimiento|revisar|revisi[oó]n|destap|desazolve)\b/i;
const APPOINTMENT_KW = /\b(cita|agendar|agenda|reservar|reserva|turno|appointment|consulta|consultorio|corte de pelo|corte y color|manicure|pedicure|peinado|barber[ií]a|dentista|m[eé]dico|doctor|terapia)\b/i;
const PRODUCT_KW = /\b(pastel|cupcakes?|galletas?|postre|comida|men[uú]|pizza|hamburguesa|ramo|flores|arreglo floral|producto|piezas?|unidades?|encargar|comprar|llevar)\b/i;
const CUSTOM_KW = /\b(personaliza|a medida|custom|cotizar|cotizaci[oó]n|presupuesto|brief|dise[ñn]o especial)\b/i;

function buildSummary(tipo: OrderType, rawDesc: string, fechaTxt: string, horaTxt: string, direccion: string, lower: string): string {
  let core = rawDesc.trim();
  // Clean filler words
  core = core.replace(/^(que\s+me\s+|me\s+|de\s+|un[oa]?\s+|el\s+la\s+|los\s+|las\s+)/i, "").trim();
  if (tipo === "servicio") {
    if (/fuga/.test(lower)) core = "Reparación de fuga";
    else if (/masaje/.test(lower)) core = "Sesión de masaje";
    else if (/limpieza|limpiar/.test(lower)) core = "Servicio de limpieza";
    else if (/instalar|instalaci[oó]n/.test(lower)) core = core || "Instalación";
    else if (/(reparar|reparaci[oó]n|arreglar|arreglo)/.test(lower) && core) core = `Reparación: ${core}`;
    else if (!core) core = "Servicio solicitado";
  } else if (tipo === "cita" && !core) {
    core = "Cita / reserva";
  } else if (!core) {
    core = "Pedido";
  }
  // Capitalize
  core = core.charAt(0).toUpperCase() + core.slice(1);
  const parts = [core];
  if (fechaTxt) parts.push(fechaTxt + (horaTxt ? ` ${horaTxt}` : ""));
  if (direccion) parts.push(direccion);
  return parts.join(" — ");
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

  // Fecha
  let fechaEntrega = "";
  if (/\bhoy\b/.test(lower)) fechaEntrega = today();
  else if (/\bma[ñn]ana\b/.test(lower)) fechaEntrega = tomorrow();
  else {
    const map: Record<string, number> = { domingo:0,lunes:1,martes:2,miércoles:3,miercoles:3,jueves:4,viernes:5,sábado:6,sabado:6 };
    for (const d of Object.keys(map)) {
      if (lower.includes(d)) {
        const target = map[d];
        const now = new Date();
        const diff = (target - now.getDay() + 7) % 7 || 7;
        const dt = new Date(now); dt.setDate(now.getDate() + diff);
        fechaEntrega = dt.toISOString().slice(0,10);
        break;
      }
    }
  }

  // Hora — exacta o aproximada
  let horaEntrega = "";
  let horaAprox = "";
  const hMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|h)\b/i);
  const hContext = text.match(/\ba las\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  const m1 = hMatch || hContext;
  if (m1) {
    let h = parseInt(m1[1], 10);
    const m = m1[2] || "00";
    const suf = m1[3] || "";
    if (/pm/i.test(suf) && h < 12) h += 12;
    if (/am/i.test(suf) && h === 12) h = 0;
    if (h >= 0 && h <= 23) horaEntrega = `${String(h).padStart(2,"0")}:${m}`;
  }
  if (!horaEntrega) {
    if (/\bpor la ma[ñn]ana\b|\ben la ma[ñn]ana\b/i.test(text)) horaAprox = "mañana";
    else if (/\bpor la tarde\b|\ben la tarde\b/i.test(text)) horaAprox = "tarde";
    else if (/\bpor la noche\b|\ben la noche\b|\bde noche\b/i.test(text)) horaAprox = "noche";
    else if (/\bal mediod[ií]a\b/i.test(text)) horaAprox = "mediodía";
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

  // Dirección
  let direccion = "";
  const dirMatch = text.match(/(?:direcci[oó]n|env[ií]o a|entrega en|llevar a|domicilio en|en)\s+((?:la\s+|el\s+)?(?:colonia\s+|col\.\s+)?[A-ZÁÉÍÓÚÑa-záéíóúñ][^\n.,]{2,60})/i);
  if (dirMatch) direccion = dirMatch[1].trim();
  // Reconocer barrios/zonas comunes mencionadas sueltas
  if (!direccion) {
    const zonas = text.match(/\b(Providencia|Polanco|Condesa|Roma|Coyoac[aá]n|Satélite|Las Lomas|Centro|Norte|Sur)\b/);
    if (zonas) direccion = zonas[1];
  }

  // Detalles
  let detalles = "";
  const detMatch = text.match(/(?:que diga|texto|tema|mensaje|nota|detalle|incluir)[:\s]+([^\n.]+)/i);
  if (detMatch) detalles = detMatch[1].trim();

  // Construir resumen limpio
  const fechaTxt = fechaEntrega
    ? (fechaEntrega === today() ? "hoy" : fechaEntrega === tomorrow() ? "mañana" : fechaEntrega)
    : "";
  const horaTxt = horaEntrega
    ? `a las ${horaEntrega}`
    : horaAprox
      ? `por la ${horaAprox}`
      : "";
  const rawForSummary = descripcion || (tipoDetectado ? "" : "");
  const resumen = buildSummary(tipo, rawForSummary, fechaTxt, horaTxt, direccion, lower);

  // Notas: marcar hora aproximada y baja confianza
  const notasArr: string[] = [];
  if (horaAprox) notasArr.push(`Hora aproximada: ${horaAprox}`);
  if (!tipoDetectado && !descripcion) notasArr.push("Datos no confirmados");

  return recompute({
    id, cliente, telefono, tipo,
    descripcion: resumen,
    cantidad,
    fechaEntrega, horaEntrega, direccion, detalles,
    pago, precio: 0, notas: notasArr.join(" · "), estado: "nuevo", riesgo: "bajo",
    faltantes: [], checklist: {},
    mensajeOriginal: text, createdAt: Date.now(),
  });
}

export const todayStr = today;
