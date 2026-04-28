import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog, type CatalogItem, type CatalogKind, type DayKey, ALL_DAYS, DAY_LABELS } from "@/lib/catalog-store";
import { Plus, Trash2, Save, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — Operia" },
      { name: "description", content: "Define qué productos o servicios puedes cumplir y deja que Operia valide cada pedido." },
    ],
  }),
  component: CatalogoPage,
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
    anticipacionHoras: 24,
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
    stockMinimo: 0,
    unidad: "piezas",
  };
}

function CatalogoPage() {
  const items = useCatalog((s) => s.items);
  const addItem = useCatalog((s) => s.addItem);
  const removeItem = useCatalog((s) => s.removeItem);
  const updateItem = useCatalog((s) => s.updateItem);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  const save = () => {
    if (!draft.nombre.trim()) { toast.error("Ponle un nombre al producto/servicio"); return; }
    addItem(draft);
    setDraft(emptyDraft());
    setCreating(false);
    toast.success("Agregado al catálogo");
  };

  return (
    <AppShell>
      <PageHeader
        title="Catálogo"
        subtitle="Lo que tu negocio sí puede cumplir. Operia validará cada pedido contra esto."
        actions={
          <Button onClick={() => setCreating(true)} size="lg" className="rounded-lg">
            <Plus className="h-4 w-4" /> Nuevo elemento
          </Button>
        }
      />

      {creating && (
        <Card className="p-5 rounded-xl mb-6 border-primary/30">
          <h3 className="font-display text-lg mb-4">Agregar al catálogo</h3>
          <ItemForm value={draft} onChange={setDraft} />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => { setCreating(false); setDraft(emptyDraft()); }}>Cancelar</Button>
            <Button onClick={save}><Save className="h-3.5 w-3.5 mr-1" /> Guardar</Button>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="rounded-xl p-10 text-center border-dashed bg-secondary/30">
          <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <div className="text-[14px] font-medium">Tu catálogo está vacío</div>
          <div className="text-[12.5px] text-muted-foreground mt-1">
            Agrega lo que ofreces para que Operia pueda validar pedidos automáticamente.
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <CatalogCard key={it.id} item={it} onRemove={() => { removeItem(it.id); toast.success("Eliminado"); }} onUpdate={(p) => updateItem(it.id, p)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function CatalogCard({ item, onRemove, onUpdate }: { item: CatalogItem; onRemove: () => void; onUpdate: (p: Partial<CatalogItem>) => void }) {
  return (
    <Card className="p-4 rounded-xl">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-medium text-[15px] truncate">{item.nombre}</div>
          <div className="text-[12px] text-muted-foreground capitalize">{item.tipo}</div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={item.disponible} onCheckedChange={(v) => onUpdate({ disponible: v })} />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      </div>
      {item.descripcion && <p className="text-[13px] text-foreground/80 mb-2">{item.descripcion}</p>}
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        {item.precioBase > 0 && <Field label="Precio base" value={`$${item.precioBase.toLocaleString("es-MX")}`} />}
        {item.capacidad && <Field label="Capacidad" value={item.capacidad} />}
        {item.anticipacionHoras > 0 && <Field label="Anticipación" value={`${item.anticipacionHoras}h`} />}
        {item.prepMinutos > 0 && <Field label="Preparación" value={`${item.prepMinutos} min`} />}
        {item.stockDisponible > 0 && <Field label="Stock" value={String(item.stockDisponible)} />}
        {item.capacidadDiaria > 0 && <Field label="Cap. diaria" value={String(item.capacidadDiaria)} />}
        {(item.horarioDesde && item.horarioHasta) && <Field label="Horario" value={`${item.horarioDesde}–${item.horarioHasta}`} />}
        {item.diasDisponibles.length > 0 && <Field label="Días" value={item.diasDisponibles.map((d) => DAY_LABELS[d]).join(", ")} />}
      </div>
      {item.opciones.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.opciones.map((o) => (
            <span key={o} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary border border-border">{o}</span>
          ))}
        </div>
      )}
      {item.notas && <div className="mt-2 text-[11.5px] text-muted-foreground italic">{item.notas}</div>}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10.5px] uppercase tracking-wide">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ItemForm({ value, onChange }: { value: Omit<CatalogItem, "id" | "createdAt">; onChange: (v: Omit<CatalogItem, "id" | "createdAt">) => void }) {
  const set = <K extends keyof typeof value>(k: K, v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Labeled label="Nombre">
        <Input value={value.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Pastel 12 personas" />
      </Labeled>
      <Labeled label="Tipo">
        <Select value={value.tipo} onValueChange={(v) => set("tipo", v as CatalogKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="producto">Producto</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
            <SelectItem value="cita">Cita</SelectItem>
          </SelectContent>
        </Select>
      </Labeled>
      <Labeled label="Descripción" full>
        <Textarea value={value.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Pastel para aprox. 12 personas" />
      </Labeled>
      <Labeled label="Precio base">
        <Input type="number" value={value.precioBase || ""} onChange={(e) => set("precioBase", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Capacidad o tamaño">
        <Input value={value.capacidad} onChange={(e) => set("capacidad", e.target.value)} placeholder="12 personas" />
      </Labeled>
      <Labeled label="Variantes (separadas por coma)">
        <Input
          value={value.variantes.join(", ")}
          onChange={(e) => set("variantes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Mediano, Grande"
        />
      </Labeled>
      <Labeled label="Sabores / opciones (separadas por coma)">
        <Input
          value={value.opciones.join(", ")}
          onChange={(e) => set("opciones", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Lotus, Chocolate, Tres leches"
        />
      </Labeled>
      <Labeled label="Tiempo mínimo de anticipación (horas)">
        <Input type="number" value={value.anticipacionHoras || ""} onChange={(e) => set("anticipacionHoras", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Tiempo mínimo de preparación (minutos)">
        <Input type="number" value={value.prepMinutos || ""} onChange={(e) => set("prepMinutos", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Stock disponible (0 = no aplica)">
        <Input type="number" value={value.stockDisponible || ""} onChange={(e) => set("stockDisponible", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Capacidad diaria (0 = ilimitada)">
        <Input type="number" value={value.capacidadDiaria || ""} onChange={(e) => set("capacidadDiaria", Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label="Horario desde (HH:mm)">
        <Input type="time" value={value.horarioDesde} onChange={(e) => set("horarioDesde", e.target.value)} />
      </Labeled>
      <Labeled label="Horario hasta (HH:mm)">
        <Input type="time" value={value.horarioHasta} onChange={(e) => set("horarioHasta", e.target.value)} />
      </Labeled>
      <Labeled label="Días disponibles (vacío = todos)" full>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((d) => {
            const active = value.diasDisponibles.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  const next = active
                    ? value.diasDisponibles.filter((x) => x !== d)
                    : [...value.diasDisponibles, d];
                  set("diasDisponibles", next as DayKey[]);
                }}
                className={`px-3 h-8 rounded-full text-[12px] border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-secondary text-foreground/70 border-border hover:bg-secondary/70"
                }`}
              >
                {DAY_LABELS[d]}
              </button>
            );
          })}
        </div>
      </Labeled>
      <Labeled label="Disponible">
        <div className="flex items-center gap-2 h-10">
          <Switch checked={value.disponible} onCheckedChange={(v) => set("disponible", v)} />
          <span className="text-[13px] text-muted-foreground">{value.disponible ? "Sí" : "No"}</span>
        </div>
      </Labeled>
      <Labeled label="Bloquear venta si no hay disponibilidad">
        <div className="flex items-center gap-2 h-10">
          <Switch
            checked={value.bloquearSinDisponibilidad}
            onCheckedChange={(v) => set("bloquearSinDisponibilidad", v)}
          />
          <span className="text-[13px] text-muted-foreground">{value.bloquearSinDisponibilidad ? "Sí" : "No"}</span>
        </div>
      </Labeled>
      <Labeled label="Notas internas" full>
        <Textarea value={value.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Solo manejamos pasteles de aprox. 12 personas." />
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
