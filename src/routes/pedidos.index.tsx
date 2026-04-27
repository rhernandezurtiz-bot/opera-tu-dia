import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, RiskBadge, StatusBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOperia } from "@/lib/operia-store";

export const Route = createFileRoute("/pedidos/")({
  head: () => ({
    meta: [
      { title: "Pedidos — Operia" },
      { name: "description", content: "Lista completa de pedidos con filtros por fecha, estado, riesgo y pago." },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const orders = useOperia((s) => s.orders);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("todos");
  const [riesgo, setRiesgo] = useState("todos");
  const [pago, setPago] = useState("todos");

  const filtered = orders.filter((o) => {
    if (fecha && o.fechaEntrega !== fecha) return false;
    if (estado !== "todos" && o.estado !== estado) return false;
    if (riesgo !== "todos" && o.riesgo !== riesgo) return false;
    if (pago !== "todos" && o.pago !== pago) return false;
    return true;
  });

  return (
    <AppShell>
      <PageHeader title="Pedidos" subtitle={`${filtered.length} de ${orders.length} pedidos`} />

      <Card className="p-4 rounded-3xl mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Fecha</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 rounded-xl" />
        </div>
        <FilterSelect label="Estado" value={estado} onChange={setEstado} options={[
          ["todos","Todos"],["nuevo","Nuevo"],["confirmado","Confirmado"],["en_produccion","En producción"],["listo","Listo"],["entregado","Entregado"],["cancelado","Cancelado"]
        ]} />
        <FilterSelect label="Riesgo" value={riesgo} onChange={setRiesgo} options={[["todos","Todos"],["bajo","Bajo"],["medio","Medio"],["alto","Alto"]]} />
        <FilterSelect label="Pago" value={pago} onChange={setPago} options={[["todos","Todos"],["pendiente","Pendiente"],["anticipo","Anticipo"],["pagado","Pagado"]]} />
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground rounded-3xl">No hay pedidos con esos filtros.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }} className="block">
              <Card className="p-4 md:p-5 rounded-2xl hover:border-foreground/20 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium">{o.cliente || "Cliente sin nombre"}</div>
                    <div className="text-sm text-muted-foreground">{o.producto || "Producto pendiente"} {o.tamano && `· ${o.tamano}`}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {o.fechaEntrega || "Sin fecha"} {o.horaEntrega && `· ${o.horaEntrega}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex gap-1.5 items-center">
                      <StatusBadge status={o.estado} />
                      <RiskBadge level={o.riesgo} />
                    </div>
                    <div className="text-sm font-medium">${(o.precio || 0).toLocaleString("es-MX")}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">Pago: {o.pago}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
