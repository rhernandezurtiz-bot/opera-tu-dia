import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskBadge, StatusBadge, UrgencyChip } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOperia, checklistByType, typeLabels, type OrderStatus } from "@/lib/operia-store";
import { buildMissingMessage } from "@/lib/ui-store";
import { ArrowLeft, Copy, Check, Trash2, AlertTriangle, CheckCircle2, PlayCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Orden ${params.id} — Operia` },
      { name: "description", content: "Detalle operativo de la orden con checklist." },
    ],
  }),
  component: Detalle,
});

function Detalle() {
  const { id } = Route.useParams();
  const order = useOperia((s) => s.orders.find((o) => o.id === id));
  const toggleChecklist = useOperia((s) => s.toggleChecklist);
  const updateOrder = useOperia((s) => s.updateOrder);
  const removeOrder = useOperia((s) => s.removeOrder);
  const navigate = useNavigate();

  if (!order) {
    return <AppShell><Card className="p-10 text-center rounded-xl">Orden no encontrada. <Link to="/pedidos" className="underline">Volver</Link></Card></AppShell>;
  }

  const items = checklistByType[order.tipo];
  const done = items.filter((it) => order.checklist[it.key]).length;
  const pct = Math.round((done / items.length) * 100);

  const copiarResumen = () => {
    const partes = [
      `Orden de ${order.cliente || "Cliente"}:`,
      `${typeLabels[order.tipo].toLowerCase()} — ${order.descripcion || "descripción pendiente"}`,
      `fecha ${order.fechaEntrega || "pendiente"}${order.horaEntrega ? ` ${order.horaEntrega}` : ""}`,
      order.direccion ? `ubicación: ${order.direccion}` : "",
      order.detalles ? `detalles: ${order.detalles}` : "",
      `pago: ${order.pago}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(partes.join(", ") + ".");
    toast.success("Resumen copiado");
  };

  return (
    <AppShell>
      <Link to="/pedidos" className="inline-flex items-center text-sm text-muted-foreground mb-3 hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a órdenes
      </Link>

      <PageHeader
        title={order.cliente || "Cliente sin nombre"}
        subtitle={`${typeLabels[order.tipo]} · ${order.descripcion || "Descripción pendiente"}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyChip fecha={order.fechaEntrega} hora={order.horaEntrega} />
            <StatusBadge status={order.estado} />
            <RiskBadge level={order.riesgo} />
          </div>
        }
      />

      {/* Quick actions */}
      <Card className="p-3 rounded-2xl mb-5 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground px-2">Acciones rápidas:</span>
        {order.estado === "nuevo" && (
          <Button size="sm" className="rounded-full" onClick={() => { updateOrder(order.id, { estado: "confirmado" }); toast.success("Confirmado"); }}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar como confirmado
          </Button>
        )}
        {(order.estado === "nuevo" || order.estado === "confirmado") && (
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => { updateOrder(order.id, { estado: "en_proceso" }); toast.success("En proceso"); }}>
            <PlayCircle className="h-3.5 w-3.5 mr-1" /> En proceso
          </Button>
        )}
        {order.estado !== "entregado" && order.estado !== "cancelado" && (
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => { updateOrder(order.id, { estado: "entregado" }); toast.success("Entregado"); }}>
            <PackageCheck className="h-3.5 w-3.5 mr-1" /> Marcar como entregado
          </Button>
        )}
        <Button size="sm" variant="ghost" className="rounded-full" onClick={copiarResumen}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar resumen
        </Button>
      </Card>

      {order.faltantes.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-warning/15 border border-warning/30">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium">Faltan datos para este pedido</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {order.faltantes.map((f) => (
                  <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-card border border-warning/40">{f}</span>
                ))}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-full mt-2"
            onClick={() => { navigator.clipboard.writeText(buildMissingMessage(order.cliente, order.faltantes)); toast.success("Mensaje copiado al portapapeles"); }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje para el cliente
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 rounded-xl lg:col-span-2 space-y-3">
          <h3 className="font-display text-lg mb-2">Información de la orden</h3>
          <Info label="Tipo" value={typeLabels[order.tipo]} />
          <Info label="Teléfono" value={order.telefono} />
          <Info label="Cantidad" value={order.cantidad} />
          <Info label="Fecha" value={order.fechaEntrega} />
          <Info label="Hora" value={order.horaEntrega} />
          <Info label="Ubicación" value={order.direccion} />
          <Info label="Detalles" value={order.detalles} />
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
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="listo">Listo</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" className="rounded-full" onClick={() => { updateOrder(order.id, { estado: "entregado" }); toast.success("Marcada como entregada"); }}>
              <Check className="h-4 w-4 mr-1" /> Marcar como entregada
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={copiarResumen}>
              <Copy className="h-4 w-4 mr-1" /> Copiar resumen
            </Button>
            <Button variant="ghost" className="rounded-full text-danger hover:text-danger" onClick={() => { removeOrder(order.id); toast.success("Orden eliminada"); navigate({ to: "/pedidos" }); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </div>
        </Card>

        <Card className="p-5 rounded-xl h-fit">
          <h3 className="font-display text-lg mb-1">Checklist</h3>
          <div className="text-xs text-muted-foreground mb-2">
            {typeLabels[order.tipo]} · {done} de {items.length}
          </div>
          <Progress value={pct} className="h-2 mb-4" />
          <div className="space-y-2">
            {items.map((it) => (
              <label key={it.key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer">
                <Checkbox checked={!!order.checklist[it.key]} onCheckedChange={() => toggleChecklist(order.id, it.key)} />
                <span className={`text-sm ${order.checklist[it.key] ? "line-through text-muted-foreground" : ""}`}>{it.label}</span>
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
