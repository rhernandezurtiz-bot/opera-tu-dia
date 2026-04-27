import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RiskLevel = "bajo" | "medio" | "alto";
export type OrderStatus = "nuevo" | "confirmado" | "en_produccion" | "listo" | "entregado" | "cancelado";
export type PaymentStatus = "pendiente" | "anticipo" | "pagado";

export interface ChecklistState {
  anticipo: boolean;
  diseno: boolean;
  ingredientes: boolean;
  horneado: boolean;
  decorado: boolean;
  empacado: boolean;
  foto: boolean;
  entregado: boolean;
}

export const checklistLabels: Record<keyof ChecklistState, string> = {
  anticipo: "Anticipo confirmado",
  diseno: "Diseño confirmado",
  ingredientes: "Ingredientes listos",
  horneado: "Horneado / preparado",
  decorado: "Decorado / terminado",
  empacado: "Empacado",
  foto: "Foto tomada",
  entregado: "Entregado",
};

export interface Order {
  id: string;
  cliente: string;
  telefono: string;
  producto: string;
  sabor: string;
  tamano: string;
  cantidad: string;
  fechaEntrega: string; // YYYY-MM-DD or "" 
  horaEntrega: string;
  direccion: string;
  personalizacion: string;
  pago: PaymentStatus;
  precio: number;
  notas: string;
  estado: OrderStatus;
  riesgo: RiskLevel;
  faltantes: string[];
  checklist: ChecklistState;
  mensajeOriginal: string;
  createdAt: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  tiempo: string;
  precio: number;
}

export interface Miembro {
  id: string;
  nombre: string;
  rol: string;
}

export interface RiskRules {
  fecha: boolean;
  hora: boolean;
  direccion: boolean;
  anticipo: boolean;
  telefono: boolean;
  personalizacion: boolean;
}

export interface Negocio {
  nombre: string;
  telefono: string;
  direccion: string;
  horarios: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const emptyChecklist = (): ChecklistState => ({
  anticipo: false, diseno: false, ingredientes: false, horneado: false,
  decorado: false, empacado: false, foto: false, entregado: false,
});

const seedOrders = (): Order[] => [
  {
    id: "o1", cliente: "Mariana López", telefono: "+52 55 1234 5678",
    producto: "Pastel de chocolate", sabor: "Chocolate", tamano: "20 personas", cantidad: "1",
    fechaEntrega: today(), horaEntrega: "17:00", direccion: "Av. Reforma 123, CDMX",
    personalizacion: "Feliz cumpleaños Mariana", pago: "anticipo", precio: 850,
    notas: "Cliente recurrente", estado: "confirmado", riesgo: "bajo", faltantes: [],
    checklist: { ...emptyChecklist(), anticipo: true, diseno: true, ingredientes: true },
    mensajeOriginal: "Hola, quiero el pastel de chocolate para hoy 5pm",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "o2", cliente: "Sofía Ramírez", telefono: "+52 55 9876 5432",
    producto: "Cupcakes personalizados", sabor: "Vainilla", tamano: "Regular", cantidad: "12",
    fechaEntrega: tomorrow(), horaEntrega: "", direccion: "Polanco",
    personalizacion: "Tema unicornio", pago: "pendiente", precio: 480,
    notas: "", estado: "nuevo", riesgo: "medio", faltantes: ["Hora de entrega", "Anticipo"],
    checklist: emptyChecklist(),
    mensajeOriginal: "Hola, necesito 12 cupcakes para mañana, tema unicornio",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "o3", cliente: "Ana Torres", telefono: "",
    producto: "Pastel de vainilla", sabor: "Vainilla", tamano: "30 personas", cantidad: "1",
    fechaEntrega: today(), horaEntrega: "15:00", direccion: "",
    personalizacion: "", pago: "pendiente", precio: 0,
    notas: "Pedido grande sin anticipo", estado: "nuevo", riesgo: "alto",
    faltantes: ["Dirección", "Anticipo", "Teléfono", "Personalización"],
    checklist: emptyChecklist(),
    mensajeOriginal: "Quiero un pastel de vainilla para 30 personas hoy a las 3",
    createdAt: Date.now() - 1800000,
  },
];

interface State {
  orders: Order[];
  productos: Producto[];
  miembros: Miembro[];
  negocio: Negocio;
  riskRules: RiskRules;
  addOrder: (o: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  toggleChecklist: (id: string, key: keyof ChecklistState) => void;
  addProducto: (p: Producto) => void;
  removeProducto: (id: string) => void;
  addMiembro: (m: Miembro) => void;
  removeMiembro: (id: string) => void;
  setNegocio: (n: Partial<Negocio>) => void;
  setRiskRules: (r: Partial<RiskRules>) => void;
}

export const useOperia = create<State>()(
  persist(
    (set) => ({
      orders: seedOrders(),
      productos: [
        { id: "p1", nombre: "Pastel de chocolate", categoria: "Pasteles", tiempo: "3 h", precio: 650 },
        { id: "p2", nombre: "Pastel de vainilla", categoria: "Pasteles", tiempo: "3 h", precio: 600 },
        { id: "p3", nombre: "Cupcakes", categoria: "Mini", tiempo: "1.5 h", precio: 35 },
        { id: "p4", nombre: "Galletas decoradas", categoria: "Galletería", tiempo: "2 h", precio: 25 },
        { id: "p5", nombre: "Brownies", categoria: "Mini", tiempo: "1 h", precio: 30 },
      ],
      miembros: [
        { id: "m1", nombre: "Laura", rol: "Repostera" },
        { id: "m2", nombre: "Diego", rol: "Decorador" },
      ],
      negocio: {
        nombre: "Dulce Operia",
        telefono: "+52 55 0000 0000",
        direccion: "Ciudad de México",
        horarios: "Lun a Sáb 9:00 - 19:00",
      },
      riskRules: { fecha: true, hora: true, direccion: true, anticipo: true, telefono: false, personalizacion: false },
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      updateOrder: (id, patch) => set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? recompute({ ...o, ...patch }) : o)),
      })),
      removeOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
      toggleChecklist: (id, key) => set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id ? { ...o, checklist: { ...o.checklist, [key]: !o.checklist[key] } } : o
        ),
      })),
      addProducto: (p) => set((s) => ({ productos: [...s.productos, p] })),
      removeProducto: (id) => set((s) => ({ productos: s.productos.filter((p) => p.id !== id) })),
      addMiembro: (m) => set((s) => ({ miembros: [...s.miembros, m] })),
      removeMiembro: (id) => set((s) => ({ miembros: s.miembros.filter((m) => m.id !== id) })),
      setNegocio: (n) => set((s) => ({ negocio: { ...s.negocio, ...n } })),
      setRiskRules: (r) => set((s) => ({ riskRules: { ...s.riskRules, ...r } })),
    }),
    { name: "operia-store-v1" }
  )
);

function recompute(o: Order): Order {
  // recompute faltantes & riesgo based on fields
  const faltantes: string[] = [];
  if (!o.fechaEntrega) faltantes.push("Fecha de entrega");
  if (!o.horaEntrega) faltantes.push("Hora de entrega");
  if (!o.direccion) faltantes.push("Dirección");
  if (o.pago === "pendiente") faltantes.push("Anticipo");
  if (!o.producto) faltantes.push("Producto");
  if (!o.telefono) faltantes.push("Teléfono");
  let riesgo: RiskLevel = "bajo";
  const isToday = o.fechaEntrega === today();
  if (!o.fechaEntrega || !o.producto || (isToday && !o.horaEntrega)) riesgo = "alto";
  else if (faltantes.length >= 2) riesgo = "medio";
  else if (faltantes.length >= 1) riesgo = "medio";
  return { ...o, faltantes, riesgo };
}

// === AI simulation ===
export function parseWhatsapp(text: string): Order {
  const lower = text.toLowerCase();
  const id = "o" + Math.random().toString(36).slice(2, 9);

  // Producto
  let producto = "";
  let sabor = "";
  if (lower.includes("pastel")) producto = "Pastel";
  else if (lower.includes("cupcake")) producto = "Cupcakes";
  else if (lower.includes("galleta")) producto = "Galletas";
  else if (lower.includes("brownie")) producto = "Brownies";
  if (lower.includes("chocolate")) { sabor = "Chocolate"; if (producto === "Pastel") producto = "Pastel de chocolate"; }
  else if (lower.includes("vainilla")) { sabor = "Vainilla"; if (producto === "Pastel") producto = "Pastel de vainilla"; }
  else if (lower.includes("fresa")) sabor = "Fresa";
  else if (lower.includes("red velvet")) { sabor = "Red Velvet"; if (producto === "Pastel") producto = "Pastel red velvet"; }

  // Cantidad / tamaño
  const cantMatch = text.match(/(\d+)\s*(cupcakes?|galletas?|brownies?|piezas?|personas?)/i);
  let cantidad = "1";
  let tamano = "";
  if (cantMatch) {
    if (/personas?/i.test(cantMatch[2])) tamano = `${cantMatch[1]} personas`;
    else cantidad = cantMatch[1];
  }

  // Fecha
  let fechaEntrega = "";
  if (/\bhoy\b/.test(lower)) fechaEntrega = today();
  else if (/\bma[ñn]ana\b/.test(lower)) fechaEntrega = tomorrow();
  else {
    const dias = ["domingo","lunes","martes","miércoles","miercoles","jueves","viernes","sábado","sabado"];
    const map: Record<string, number> = { domingo:0,lunes:1,martes:2,miércoles:3,miercoles:3,jueves:4,viernes:5,sábado:6,sabado:6 };
    for (const d of dias) {
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

  // Hora
  let horaEntrega = "";
  const hMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|h)?/i);
  if (hMatch && (hMatch[3] || /\b(a las|entrega|hora)\b/i.test(text))) {
    let h = parseInt(hMatch[1], 10);
    const m = hMatch[2] ? hMatch[2] : "00";
    if (/pm/i.test(hMatch[3] || "") && h < 12) h += 12;
    if (/am/i.test(hMatch[3] || "") && h === 12) h = 0;
    if (h >= 0 && h <= 23) horaEntrega = `${String(h).padStart(2,"0")}:${m}`;
  }

  // Nombre
  let cliente = "";
  const nameMatch = text.match(/(?:soy|de parte de|me llamo|para)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
  if (nameMatch) cliente = nameMatch[1];

  // Teléfono
  const phone = text.match(/(\+?\d[\d\s\-]{7,}\d)/);
  const telefono = phone ? phone[1].trim() : "";

  // Pago
  let pago: PaymentStatus = "pendiente";
  if (/pagad|pagué|liquidad/i.test(text)) pago = "pagado";
  else if (/anticipo|adelanto|se[ñn]a/i.test(text)) pago = "anticipo";

  // Dirección
  let direccion = "";
  const dirMatch = text.match(/(?:direcci[oó]n|env[ií]o a|entrega en|llevar a)[:\s]+([^\n.,]+)/i);
  if (dirMatch) direccion = dirMatch[1].trim();

  // Personalización
  let personalizacion = "";
  const persMatch = text.match(/(?:que diga|dice|texto|mensaje|tema)[:\s]+([^\n.]+)/i);
  if (persMatch) personalizacion = persMatch[1].trim();

  return recompute({
    id, cliente, telefono, producto, sabor, tamano, cantidad,
    fechaEntrega, horaEntrega, direccion, personalizacion,
    pago, precio: 0, notas: "", estado: "nuevo", riesgo: "bajo",
    faltantes: [], checklist: emptyChecklist(),
    mensajeOriginal: text, createdAt: Date.now(),
  });
}

export const todayStr = today;
export const newOrderId = () => "o" + Math.random().toString(36).slice(2, 9);
