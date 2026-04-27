import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, PageHeader, StatusBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOperia, getClientStats, clientKey, typeLabels } from "@/lib/operia-store";
import { money } from "@/lib/ui-store";
import { ArrowLeft, Phone, Star, Save, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes/$key")({
  head: ({ params }) => ({
    meta: [{ title: `Cliente — Operia` }, { name: "description", content: `Historial del cliente ${params.key}` }],
  }),
  component: ClienteDetalle,
  notFoundComponent: () => (
    <AppShell>
      <PageHeader title="Cliente no encontrado" />
      <Link to="/clientes" className="text-primary underline">Volver a clientes</Link>
    </AppShell>
  ),
});

function ClienteDetalle() {
  const { key } = Route.useParams();
  const orders = useOperia((s) => s.orders);
  const notes = useOperia((s) => s.clientNotes);
  const setClientNote = useOperia((s) => s.setClientNote);

  const stats = getClientStats(orders, key);
  const [draft, setDraft] = useState<string>("");
  useEffect(() => { setDraft(notes[key] || ""); }, [key, notes]);

  if (!stats) {
    return (
      <AppShell>
        <PageHeader title="Cliente no encontrado" />
        <Link to="/clientes" className="text-primary underline">Volver a clientes</Link>
      </AppShell>
    );
  }

  const history = orders
    .filter((o) => clientKey(o.cliente, o.telefono) === key)
    .sort((a, b) => (b.fechaEntrega || "").localeCompare(a.fechaEntrega || ""));

  return (
    <AppShell>
      <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <PageHeader
        title={stats.nombre}
        subtitle={
          stats.esRecurrente
            ? `Cliente recurrente · ${stats.totalPedidos} pedidos · ${money(stats.totalGastado)} en total`
            : `${stats.totalPedidos} pedido · ${money(stats.totalGastado)}`
        }
        actions={
          stats.telefono ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {stats.telefono}
            </span>
          ) : null
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Resumen */}
        <Card className="p-5 rounded-xl lg:col-span-1 h-fit">
          <h3 className="font-display text-lg mb-3">Resumen</h3>
          <Stat label="Pedidos" value={String(stats.totalPedidos)} />
          <Stat label="Total gastado" value={money(stats.totalGastado)} />
          <Stat label="Último pedido" value={stats.ultimaFecha || "—"} />
          {stats.esRecurrente && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] px-2 py-1 rounded-full bg-success/10 text-success/90 border border-success/20">
              <Star className="h-3 w-3" /> Recurrente
            </div>
          )}
          {stats.comunes.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">Suele pedir</div>
              <ul className="text-sm space-y-1">
                {stats.comunes.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </div>
          )}
        </Card>

        {/* Notas internas */}
        <Card className="p-5 rounded-xl lg:col-span-2">
          <h3 className="font-display text-lg mb-1">Notas internas</h3>
          <p className="text-[12.5px] text-muted-foreground mb-3">Solo visibles para tu equipo. No se envían al cliente.</p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ej: Cliente VIP · Siempre paga puntual · Confirmar antes de producir…"
            className="rounded-xl min-h-28 resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => { setClientNote(key, draft.trim()); toast.success("Notas guardadas"); }}
              disabled={draft === (notes[key] || "")}
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Guardar
            </Button>
          </div>
        </Card>
      </div>

      {/* Historial */}
      <section className="mt-8">
        <h2 className="font-display text-xl mb-3">Historial de pedidos</h2>
        <div className="space-y-2.5">
          {history.map((o) => (
            <Link key={o.id} to="/pedidos/$id" params={{ id: o.id }} className="block">
              <Card className="p-4 rounded-xl hover:border-foreground/20 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[14px]">{typeLabels[o.tipo]}</span>
                      <StatusBadge status={o.estado} />
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-0.5 truncate">
                      {o.descripcion || "Sin descripción"}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground mt-1">
                      {o.fechaEntrega || "Sin fecha"}{o.horaEntrega ? ` · ${o.horaEntrega}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[14px] font-semibold tabular-nums">{money(o.precio || 0)}</span>
                    <span className="text-[11px] text-muted-foreground capitalize">Pago: {o.pago}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/60 mt-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
