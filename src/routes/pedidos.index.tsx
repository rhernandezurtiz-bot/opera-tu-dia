import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, RiskBadge, StatusBadge, UrgencyChip } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOperia, typeLabels, type PaymentStatus } from "@/lib/operia-store";

export const Route = createFileRoute("/pedidos/")({
  head: () => ({
    meta: [
      { title: "Órdenes — Operia" },
      { name: "description", content: "Lista completa de órdenes con filtros por fecha, tipo, estado y riesgo." },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const orders = useOperia((s) => s.orders);
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [riesgo, setRiesgo] = useState("todos");

  const filtered = orders.filter((o) => {
    if (fecha && o.fechaEntrega !== fecha) return false;
    if (tipo !== "todos" && o.tipo !== tipo) return false;
    if (estado !== "todos" && o.estado !== estado) return false;
    if (riesgo !== "todos" && o.riesgo !== riesgo) return false;
    return true;
  });

  return (
    <AppShell>
      <PageHeader
        title="Pedidos"
        subtitle={`${filtered.length} de ${orders.length} en total`}
      />

      <Card className="p-4 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[11.5px] text-muted-foreground font-medium">Fecha</label>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1.5 rounded-lg h-9"
          />
        </div>
        <FilterSelect label="Tipo" value={tipo} onChange={setTipo} options={[
          ["todos","Todos"],["producto","Producto"],["servicio","Servicio"],["cita","Cita"],["personalizado","Personalizado"]
        ]} />
        <FilterSelect label="Estado" value={estado} onChange={setEstado} options={[
          ["todos","Todos"],["nuevo","Nuevo"],["confirmado","Confirmado"],["en_proceso","En proceso"],["listo","Listo"],["entregado","Entregado"],["cancelado","Cancelado"]
        ]} />
        <FilterSelect label="Riesgo" value={riesgo} onChange={setRiesgo} options={[["todos","Todos"],["bajo","Bajo"],["medio","Medio"],["alto","Alto"]]} />
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground rounded-xl border-dashed bg-secondary/30">
          <div className="text-[14px] font-medium text-foreground/80">Sin resultados</div>
          <div className="text-[12.5px] mt-1">Ajusta los filtros para ver más pedidos.</div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((o) => (
            <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }} className="block">
              <Card className="p-4 md:p-5 rounded-xl hover:border-foreground/20 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[15px]">{o.cliente || "Cliente sin nombre"}</span>
                      <span className="text-[10px] px-1.5 h-[18px] inline-flex items-center rounded-md bg-secondary text-muted-foreground uppercase tracking-wide font-medium">
                        {typeLabels[o.tipo]}
                      </span>
                    </div>
                    <div className="text-[13.5px] text-muted-foreground mt-0.5 truncate">
                      {o.descripcion || "Descripción pendiente"}
                    </div>
                    <div className="mt-3">
                      <UrgencyChip fecha={o.fechaEntrega} hora={o.horaEntrega} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex gap-1.5 items-center">
                      <StatusBadge status={o.estado} />
                      <RiskBadge level={o.riesgo} />
                    </div>
                    <div className="text-[14.5px] font-semibold tabular-nums mt-1">
                      ${(o.precio || 0).toLocaleString("es-MX")}
                    </div>
                    <PayPill status={o.pago} />
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
      <label className="text-[11.5px] text-muted-foreground font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5 rounded-lg h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function PayPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    pendiente: { label: "Pendiente", cls: "bg-danger/8 text-danger/90 border-danger/25" },
    anticipo_solicitado: { label: "Anticipo solicitado", cls: "bg-warning/15 text-foreground/80 border-warning/35" },
    anticipo: { label: "Anticipo recibido", cls: "bg-warning/12 text-foreground/80 border-warning/30" },
    pagado: { label: "Pagado", cls: "bg-success/10 text-success/90 border-success/20" },
    vencido: { label: "Vencido", cls: "bg-danger/15 text-danger border-danger/40" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center px-2 h-[20px] rounded-full text-[10.5px] font-medium border ${m.cls}`}>
      {m.label}
    </span>
  );
}
