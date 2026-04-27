import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskBadge, StatusBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOperia, checklistLabels, type ChecklistState, type OrderStatus } from "@/lib/operia-store";
import { ArrowLeft, Copy, Check, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Pedido ${params.id} — Operia` },
      { name: "description", content: "Detalle operativo del pedido con checklist de producción." },
    ],
  }),
  component: Detalle,
  notFoundComponent: () => (
    <AppShell><div className="p-8 text-center">Pedido no encontrado.</div></AppShell>
  ),
});

function Detalle() {
  const { id } = Route.useParams();
  const order = useOperia((s) => s.orders.find((o) => o.id === id));
  const toggleChecklist = useOperia((s) => s.toggleChecklist);
  const updateOrder = useOperia((s) => s.updateOrder);
  const removeOrder = useOperia((s) => s.removeOrder);
  const navigate = useNavigate();

  if (!order) {
    return <AppShell><Card className="p-10 text-center rounded-3xl">Pedido no encontrado. <Link to="/pedidos" className="underline">Volver</Link></Card></AppShell>;
  }

  const items = Object.keys(checklistLabels) as (keyof ChecklistState)[];
  const done = items.filter((k) => order.checklist[k]).length;
  const pct = Math.round((done / items.length) * 100);

  const copiarResumen = () => {
    const partes = [
      `Pedido para ${order.cliente || "Cliente"}:`,
      `${order.producto || "producto pendiente"}${order.tamano ? ` (${order.tamano})` : ""}`,
      `entrega ${order.fechaEntrega || "sin fecha"}${order.horaEntrega ? ` ${order.horaEntrega}` : ""}`,
      `dirección: ${order.direccion || "pendiente"}`,
      order.personalizacion ? `texto: ${order.personalizacion}` : "",
      `pago: ${order.pago}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(partes.join(", ") + ".");
    toast.success("Resumen copiado");
  };

  return (
    <AppShell>
      <Link to="/pedidos" className="inline-flex items-center text-sm text-muted-foreground mb-3 hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a pedidos
      </Link>

      <PageHeader
        title={order.cliente || "Cliente sin nombre"}
        subtitle={order.producto || "Producto pendiente"}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.estado} />
            <RiskBadge level={order.riesgo} />
          </div>
        }
      />

      {order.faltantes.length > 0 && (
        <div className="mb-5 p-3 rounded-2xl bg-warning/15 border border-warning/30 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium">Pedido incompleto</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {order.faltantes.map((f) => (
                <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-card border border-warning/40">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 rounded-3xl lg:col-span-2 space-y-3">
          <h3 className="font-display text-lg mb-2">Información del pedido</h3>
          <Info label="Teléfono" value={order.telefono} />
          <Info label="Sabor" value={order.sabor} />
          <Info label="Tamaño / cantidad" value={[order.tamano, order.cantidad].filter(Boolean).join(" · ")} />
          <Info label="Fecha de entrega" value={order.fechaEntrega} />
          <Info label="Hora de entrega" value={order.horaEntrega} />
          <Info label="Dirección" value={order.direccion} />
          <Info label="Personalización" value={order.personalizacion} />
          <Info label="Pago" value={order.pago} />
          <Info label="Precio" value={order.precio ? `$${order.precio.toLocaleString("es-MX")}` : ""} />
          <Info label="Notas" value={order.notas} />
          {order.mensajeOriginal && (
            <div className="pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">Mensaje original</div>
              <div className="text-sm bg-secondary/50 p-3 rounded-xl whitespace-pre-wrap">{order.mensajeOriginal}</div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            <Select value={order.estado} onValueChange={(v) => { updateOrder(order.id, { estado: v as OrderStatus }); toast.success("Estado actualizado"); }}>
              <SelectTrigger className="w-48 rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_produccion">En producción</SelectItem>
                <SelectItem value="listo">Listo</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" className="rounded-full" onClick={() => { updateOrder(order.id, { estado: "entregado" }); toast.success("Marcado como entregado"); }}>
              <Check className="h-4 w-4 mr-1" /> Marcar como entregado
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={copiarResumen}>
              <Copy className="h-4 w-4 mr-1" /> Copiar resumen
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => toast.info("Edita los campos directamente desde aquí (próximamente).")}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button variant="ghost" className="rounded-full text-danger hover:text-danger" onClick={() => { removeOrder(order.id); toast.success("Pedido eliminado"); navigate({ to: "/pedidos" }); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </div>
        </Card>

        <Card className="p-5 rounded-3xl h-fit">
          <h3 className="font-display text-lg mb-2">Checklist</h3>
          <div className="text-xs text-muted-foreground mb-2">{done} de {items.length} completados</div>
          <Progress value={pct} className="h-2 mb-4" />
          <div className="space-y-2">
            {items.map((k) => (
              <label key={k} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer">
                <Checkbox checked={order.checklist[k]} onCheckedChange={() => toggleChecklist(order.id, k)} />
                <span className={`text-sm ${order.checklist[k] ? "line-through text-muted-foreground" : ""}`}>{checklistLabels[k]}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{value || <em className="text-muted-foreground">— pendiente —</em>}</span>
    </div>
  );
}
