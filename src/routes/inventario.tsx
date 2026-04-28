import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader, SectionHeading, Eyebrow } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCatalog,
  type CatalogItem,
  type InventoryKind,
  type Unidad,
  ALL_UNIDADES,
  UNIDAD_LABELS,
  INVENTORY_KIND_LABELS,
} from "@/lib/catalog-store";
import { useOperia } from "@/lib/operia-store";
import { getInventoryMetrics, useInventoryEngine } from "@/lib/inventory-engine";
import {
  Boxes,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  Trash2,
  PackageX,
  PackageCheck,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario — Operia" },
      { name: "description", content: "Controla stock, capacidad y disponibilidad real antes de vender o cobrar." },
    ],
  }),
  component: InventarioPage,
});

function emptyDraft(): Omit<CatalogItem, "id" | "createdAt"> {
  return {
    nombre: "",
    tipo: "producto",
    descripcion: "",
    precioBase: 0,
    capacidad: "",
    variantes: [],
    opciones: [],
    anticipacionHoras: 0,
    disponible: true,
    notas: "",
    stockDisponible: 0,
    capacidadDiaria: 0,
    horarioDesde: "",
    horarioHasta: "",
    diasDisponibles: [],
    prepMinutos: 0,
    bloquearSinDisponibilidad: true,
    categoria: "General",
    tipoInventario: "producto_terminado",
    stockMinimo: 1,
    unidad: "piezas",
  };
}

function InventarioPage() {
  useInventoryEngine();
  const items = useCatalog((s) => s.items);
  const addItem = useCatalog((s) => s.addItem);
  const updateItem = useCatalog((s) => s.updateItem);
  const removeItem = useCatalog((s) => s.removeItem);
  const decrement = useCatalog((s) => s.decrementStock);
  const increment = useCatalog((s) => s.incrementStock);
  const orders = useOperia((s) => s.orders);

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [query, setQuery] = useState("");
  const [filterKind, setFilterKind] = useState<InventoryKind | "todos">("todos");

  const metrics = useMemo(() => getInventoryMetrics(items, orders), [items, orders]);

  const filtered = items.filter((it) => {
    if (filterKind !== "todos" && it.tipoInventario !== filterKind) return false;
    if (query && !`${it.nombre} ${it.categoria} ${it.descripcion}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const it of filtered) {
      const k = it.categoria || "General";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const save = () => {
    if (!draft.nombre.trim()) { toast.error("Ponle un nombre"); return; }
    addItem(draft);
    setDraft(emptyDraft());
    setCreating(false);
    toast.success("Agregado al inventario");
  };

  return (
    <AppShell>
      <PageHeader
        title="Inventario"
        subtitle="Stock, capacidad y disponibilidad real. Operia valida cada pedido contra esto antes de cobrar."
        actions={
          <Button onClick={() => setCreating(true)} size="lg" className="rounded-lg">
            <Plus className="h-4 w-4" /> Nuevo elemento
          </Button>
        }
      />

      {/* Métricas */}
      <section className="mb-8">
        <Eyebrow>📦 Estado de inventario</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            tone="warning"
            icon={AlertTriangle}
            value={metrics.bajoStock.length}
            label="Stock bajo"
            hint="Por debajo del mínimo"
          />
          <MetricCard
            tone="danger"
            icon={PackageX}
            value={metrics.stockCritico.length}
            label="Stock crítico"
            hint="Agotado y bloquea ventas"
          />
          <MetricCard
            tone="default"
            icon={PackageCheck}
            value={metrics.capacidadHoy.reduce((a, c) => a + c.libre, 0)}
            label="Capacidad libre hoy"
            hint={`${metrics.capacidadHoy.length} ${metrics.capacidadHoy.length === 1 ? "ítem" : "ítems"} con cap. diaria`}
          />
          <MetricCard
            tone="warning"
            icon={Boxes}
            value={metrics.pedidosBloqueados.length}
            label="Pedidos bloqueados"
            hint="Por inventario / disponibilidad"
          />
        </div>
      </section>

      {/* Alerts */}
      {metrics.bajoStock.length > 0 && (
        <Card className="mb-6 p-4 rounded-xl border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 mb-2 text-[13.5px] font-medium">
            <AlertTriangle className="h-4 w-4 text-warning" /> Stock bajo
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metrics.bajoStock.map((it) => (
              <span key={it.id} className="text-[11.5px] px-2 py-0.5 rounded-full bg-warning/15 border border-warning/30">
                {it.nombre} · {it.stockDisponible}/{it.stockMinimo} {UNIDAD_LABELS[it.unidad]}
              </span>
            ))}
          </div>
        </Card>
      )}

      {creating && (
        <Card className="p-5 rounded-xl mb-6 border-primary/30">
          <h3 className="font-display text-lg mb-4">Agregar al inventario</h3>
          <ItemForm value={draft} onChange={setDraft} />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => { setCreating(false); setDraft(emptyDraft()); }}>Cancelar</Button>
            <Button onClick={save}><Save className="h-3.5 w-3.5 mr-1" /> Guardar</Button>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o categoría" className="pl-8" />
        </div>
        <Select value={filterKind} onValueChange={(v) => setFilterKind(v as InventoryKind | "todos")}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="producto_terminado">Producto terminado</SelectItem>
            <SelectItem value="insumo">Insumo</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
            <SelectItem value="capacidad_diaria">Capacidad diaria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-xl p-10 text-center border-dashed bg-secondary/30">
          <Boxes className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <div className="text-[14px] font-medium">Sin elementos</div>
          <div className="text-[12.5px] text-muted-foreground mt-1">
            Agrega productos, insumos o capacidad para que Operia controle disponibilidad antes de cobrar.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, list]) => (
            <div key={cat}>
              <SectionHeading title={cat} subtitle={`${list.length} ${list.length === 1 ? "elemento" : "elementos"}`} />
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((it) => (
                  <InventoryCard
                    key={it.id}
                    item={it}
                    capacidad={metrics.capacidadHoy.find((c) => c.item.id === it.id)}
                    onRemove={() => { removeItem(it.id); toast.success("Eliminado"); }}
                    onUpdate={(p) => updateItem(it.id, p)}
                    onInc={() => increment(it.id, 1)}
                    onDec={() => decrement(it.id, 1)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pedidos bloqueados */}
      {metrics.pedidosBloqueados.length > 0 && (
        <section className="mt-10">
          <SectionHeading
            title={`${metrics.pedidosBloqueados.length} pedido${metrics.pedidosBloqueados.length === 1 ? "" : "s"} bloqueado${metrics.pedidosBloqueados.length === 1 ? "" : "s"} por inventario`}
            subtitle="Estos pedidos no pueden cobrarse hasta resolver disponibilidad"
          />
          <div className="space-y-2">
            {metrics.pedidosBloqueados.slice(0, 8).map((o) => (
              <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }}>
                <Card className="p-3.5 rounded-xl flex items-center gap-3 hover:border-foreground/15">
                  <div className="h-7 w-7 rounded-lg bg-danger/8 text-danger/90 grid place-items-center shrink-0">
                    <PackageX className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate">{o.cliente || "Sin nombre"}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{o.descripcion}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
  tone,
}: {
  icon: any;
  value: number | string;
  label: string;
  hint: string;
  tone: "default" | "danger" | "warning";
}) {
  const styles =
    tone === "danger"
      ? "bg-danger/8 text-danger/90"
      : tone === "warning"
        ? "bg-warning/15 text-foreground/70"
        : "bg-secondary text-foreground/70 border border-border";
  return (
    <Card className="p-4 rounded-xl">
      <div className={`h-8 w-8 rounded-lg grid place-items-center mb-3 ${styles}`}>
        <Icon className="h-[15px] w-[15px]" />
      </div>
      <div className="text-[24px] leading-none font-semibold tabular-nums">{value}</div>
      <div className="text-[12.5px] text-foreground/70 mt-2 font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
    </Card>
  );
}

function StockBadge({ item }: { item: CatalogItem }) {
  if (item.tipoInventario === "capacidad_diaria") {
    return (
      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-secondary border border-border">
        Cap. {item.capacidadDiaria}/día
      </span>
    );
  }
  if (item.tipoInventario === "servicio") {
    return (
      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-secondary border border-border">
        Servicio
      </span>
    );
  }
  if (item.stockDisponible === 0 && item.stockMinimo > 0) {
    return (
      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-danger/10 text-danger/90 border border-danger/25">
        🔴 Agotado
      </span>
    );
  }
  if (item.stockMinimo > 0 && item.stockDisponible <= item.stockMinimo) {
    return (
      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-warning/15 text-foreground/70 border border-warning/30">
        🟡 Stock bajo
      </span>
    );
  }
  return (
    <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-success/10 text-success/90 border border-success/20">
      🟢 Disponible
    </span>
  );
}

function InventoryCard({
  item,
  capacidad,
  onRemove,
  onUpdate,
  onInc,
  onDec,
}: {
  item: CatalogItem;
  capacidad?: { usado: number; total: number; libre: number };
  onRemove: () => void;
  onUpdate: (p: Partial<CatalogItem>) => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Omit<CatalogItem, "id" | "createdAt">>(item);

  const saveEdits = () => {
    onUpdate(draft);
    setEditing(false);
    toast.success("Actualizado");
  };

  return (
    <Card className="p-4 rounded-xl">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-medium text-[15px] truncate">{item.nombre}</div>
          <div className="text-[11.5px] text-muted-foreground capitalize">
            {INVENTORY_KIND_LABELS[item.tipoInventario]} · {item.categoria}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StockBadge item={item} />
          <Switch checked={item.disponible} onCheckedChange={(v) => onUpdate({ disponible: v })} />
        </div>
      </div>

      {item.tipoInventario !== "servicio" && item.tipoInventario !== "capacidad_diaria" && (
        <div className="flex items-center gap-2 mt-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDec}><Minus className="h-3.5 w-3.5" /></Button>
          <div className="text-[18px] font-semibold tabular-nums min-w-[60px] text-center">
            {item.stockDisponible}
            <span className="text-[11px] text-muted-foreground font-normal ml-1">{UNIDAD_LABELS[item.unidad]}</span>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onInc}><Plus className="h-3.5 w-3.5" /></Button>
          {item.stockMinimo > 0 && (
            <span className="text-[11px] text-muted-foreground ml-2">mín {item.stockMinimo}</span>
          )}
        </div>
      )}

      {capacidad && (
        <div className="mt-2 text-[12px] text-muted-foreground">
          Hoy: <span className="font-medium text-foreground">{capacidad.usado}/{capacidad.total}</span> usados · {capacidad.libre} libre{capacidad.libre === 1 ? "" : "s"}
        </div>
      )}

      {item.opciones.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.opciones.map((o) => (
            <span key={o} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary border border-border">{o}</span>
          ))}
        </div>
      )}

      {item.notas && <div className="mt-2 text-[11.5px] text-muted-foreground italic">{item.notas}</div>}

      <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
        <Button size="sm" variant="ghost" onClick={() => { setDraft(item); setEditing(!editing); }}>
          {editing ? "Cerrar" : "Editar"}
        </Button>
        <Button size="icon" variant="ghost" className="ml-auto h-8 w-8" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-border">
          <ItemForm value={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveEdits}><Save className="h-3.5 w-3.5 mr-1" /> Guardar</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ItemForm({ value, onChange }: { value: Omit<CatalogItem, "id" | "createdAt">; onChange: (v: Omit<CatalogItem, "id" | "createdAt">) => void }) {
  const set = <K extends keyof typeof value>(k: K, v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Labeled label="Nombre">
        <Input value={value.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Pastel 12 personas" />
      </Labeled>
      <Labeled label="Categoría">
        <Input value={value.categoria} onChange={(e) => set("categoria", e.target.value)} placeholder="Pasteles" />
      </Labeled>
      <Labeled label="Tipo">
        <Select value={value.tipoInventario} onValueChange={(v) => set("tipoInventario", v as InventoryKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="producto_terminado">Producto terminado</SelectItem>
            <SelectItem value="insumo">Insumo</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
            <SelectItem value="capacidad_diaria">Capacidad diaria</SelectItem>
          </SelectContent>
        </Select>
      </Labeled>
      <Labeled label="Unidad">
        <Select value={value.unidad} onValueChange={(v) => set("unidad", v as Unidad)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_UNIDADES.map((u) => (
              <SelectItem key={u} value={u}>{UNIDAD_LABELS[u]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labeled>
      <Labeled label="Stock disponible">
        <Input type="number" value={value.stockDisponible || ""} onChange={(e) => set("stockDisponible", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Stock mínimo (alerta)">
        <Input type="number" value={value.stockMinimo || ""} onChange={(e) => set("stockMinimo", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Capacidad diaria (0 = ilimitada)">
        <Input type="number" value={value.capacidadDiaria || ""} onChange={(e) => set("capacidadDiaria", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Precio">
        <Input type="number" value={value.precioBase || ""} onChange={(e) => set("precioBase", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Variantes (separadas por coma)" full>
        <Input
          value={value.variantes.join(", ")}
          onChange={(e) => set("variantes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Mediano, Grande"
        />
      </Labeled>
      <Labeled label="Sabores / opciones (separadas por coma)" full>
        <Input
          value={value.opciones.join(", ")}
          onChange={(e) => set("opciones", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Lotus, Chocolate, Tres leches"
        />
      </Labeled>
      <Labeled label="Disponible">
        <div className="flex items-center gap-2 h-10">
          <Switch checked={value.disponible} onCheckedChange={(v) => set("disponible", v)} />
          <span className="text-[13px] text-muted-foreground">{value.disponible ? "Sí" : "No"}</span>
        </div>
      </Labeled>
      <Labeled label="Bloquear venta sin disponibilidad">
        <div className="flex items-center gap-2 h-10">
          <Switch checked={value.bloquearSinDisponibilidad} onCheckedChange={(v) => set("bloquearSinDisponibilidad", v)} />
          <span className="text-[13px] text-muted-foreground">{value.bloquearSinDisponibilidad ? "Sí" : "No"}</span>
        </div>
      </Labeled>
      <Labeled label="Notas internas" full>
        <Textarea value={value.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Notas para el equipo, no se muestran al cliente." />
      </Labeled>
    </div>
  );
}

function Labeled({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-[11.5px] text-muted-foreground font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
