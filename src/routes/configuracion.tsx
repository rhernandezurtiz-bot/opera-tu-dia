import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useOperia, type RiskRules } from "@/lib/operia-store";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — Operia" },
      { name: "description", content: "Datos del negocio, catálogo, equipo y reglas de riesgo." },
    ],
  }),
  component: Config,
});

function Config() {
  const negocio = useOperia((s) => s.negocio);
  const setNegocio = useOperia((s) => s.setNegocio);
  const productos = useOperia((s) => s.productos);
  const addProducto = useOperia((s) => s.addProducto);
  const removeProducto = useOperia((s) => s.removeProducto);
  const miembros = useOperia((s) => s.miembros);
  const addMiembro = useOperia((s) => s.addMiembro);
  const removeMiembro = useOperia((s) => s.removeMiembro);
  const riskRules = useOperia((s) => s.riskRules);
  const setRiskRules = useOperia((s) => s.setRiskRules);

  const [np, setNp] = useState({ nombre: "", categoria: "", tiempo: "", precio: "" });
  const [nm, setNm] = useState({ nombre: "", rol: "" });

  const ruleLabels: Record<keyof RiskRules, string> = {
    fecha: "Fecha de entrega", hora: "Hora de entrega", direccion: "Dirección",
    anticipo: "Anticipo", telefono: "Teléfono", personalizacion: "Personalización",
  };

  return (
    <AppShell>
      <PageHeader title="Configuración" subtitle="Personaliza Operia para tu negocio." />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5 rounded-3xl">
          <h3 className="font-display text-lg mb-4">Datos del negocio</h3>
          <div className="space-y-3">
            <FieldRow label="Nombre del negocio" value={negocio.nombre} onChange={(v) => setNegocio({ nombre: v })} />
            <FieldRow label="Teléfono" value={negocio.telefono} onChange={(v) => setNegocio({ telefono: v })} />
            <FieldRow label="Dirección" value={negocio.direccion} onChange={(v) => setNegocio({ direccion: v })} />
            <FieldRow label="Horarios de atención" value={negocio.horarios} onChange={(v) => setNegocio({ horarios: v })} />
          </div>
        </Card>

        <Card className="p-5 rounded-3xl">
          <h3 className="font-display text-lg mb-4">Reglas de riesgo</h3>
          <p className="text-sm text-muted-foreground mb-3">Activa los campos obligatorios para detectar pedidos en riesgo.</p>
          <div className="space-y-2">
            {(Object.keys(ruleLabels) as (keyof RiskRules)[]).map((k) => (
              <label key={k} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50">
                <span className="text-sm">{ruleLabels[k]}</span>
                <Switch checked={riskRules[k]} onCheckedChange={(v) => setRiskRules({ [k]: v } as Partial<RiskRules>)} />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-3xl lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Catálogo de productos</h3>
          <div className="space-y-2 mb-4">
            {productos.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50">
                <div className="min-w-0">
                  <div className="font-medium">{p.nombre}</div>
                  <div className="text-xs text-muted-foreground">{p.categoria} · {p.tiempo} · ${p.precio}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeProducto(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-5 gap-2">
            <Input placeholder="Producto" value={np.nombre} onChange={(e) => setNp({ ...np, nombre: e.target.value })} className="rounded-xl" />
            <Input placeholder="Categoría" value={np.categoria} onChange={(e) => setNp({ ...np, categoria: e.target.value })} className="rounded-xl" />
            <Input placeholder="Tiempo (ej. 2 h)" value={np.tiempo} onChange={(e) => setNp({ ...np, tiempo: e.target.value })} className="rounded-xl" />
            <Input placeholder="Precio" type="number" value={np.precio} onChange={(e) => setNp({ ...np, precio: e.target.value })} className="rounded-xl" />
            <Button className="rounded-full" onClick={() => {
              if (!np.nombre) return toast.error("Falta el nombre");
              addProducto({ id: "p" + Math.random().toString(36).slice(2,8), nombre: np.nombre, categoria: np.categoria, tiempo: np.tiempo, precio: Number(np.precio) || 0 });
              setNp({ nombre: "", categoria: "", tiempo: "", precio: "" });
              toast.success("Producto agregado");
            }}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
          </div>
        </Card>

        <Card className="p-5 rounded-3xl lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Equipo</h3>
          <div className="space-y-2 mb-4">
            {miembros.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50">
                <div>
                  <div className="font-medium">{m.nombre}</div>
                  <div className="text-xs text-muted-foreground">{m.rol}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeMiembro(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            <Input placeholder="Nombre" value={nm.nombre} onChange={(e) => setNm({ ...nm, nombre: e.target.value })} className="rounded-xl" />
            <Input placeholder="Rol" value={nm.rol} onChange={(e) => setNm({ ...nm, rol: e.target.value })} className="rounded-xl" />
            <Button className="rounded-full" onClick={() => {
              if (!nm.nombre) return toast.error("Falta el nombre");
              addMiembro({ id: "m" + Math.random().toString(36).slice(2,8), nombre: nm.nombre, rol: nm.rol });
              setNm({ nombre: "", rol: "" });
              toast.success("Miembro agregado");
            }}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 rounded-xl" />
    </div>
  );
}
