import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOperia, getAllClients } from "@/lib/operia-store";
import { money } from "@/lib/ui-store";
import { Search, Star, ArrowRight, Phone } from "lucide-react";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — Operia" },
      { name: "description", content: "Tu lista de clientes con historial, gastos y notas internas." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const orders = useOperia((s) => s.orders);
  const notes = useOperia((s) => s.clientNotes);
  const [q, setQ] = useState("");

  const list = getAllClients(orders).filter((c) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return c.nombre.toLowerCase().includes(t) || c.telefono.toLowerCase().includes(t);
  });

  return (
    <AppShell>
      <PageHeader title="Clientes" subtitle={`${list.length} clientes con historial`} />

      <Card className="p-3 rounded-xl mb-5 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar por nombre o teléfono…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border-0 focus-visible:ring-0 h-9 px-1"
        />
      </Card>

      {list.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground rounded-xl border-dashed bg-secondary/30">
          <div className="text-[14px] font-medium text-foreground/80">Aún no hay clientes</div>
          <div className="text-[12.5px] mt-1">Cuando recibas pedidos, aparecerán aquí.</div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {list.map((c) => {
            const note = notes[c.key];
            return (
              <Link key={c.key} to="/clientes/$key" params={{ key: c.key }} className="block">
                <Card className="p-4 md:p-5 rounded-xl hover:border-foreground/20 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[15px]">{c.nombre}</span>
                        {c.esRecurrente && (
                          <span className="text-[10px] inline-flex items-center gap-1 px-1.5 h-[18px] rounded-md bg-success/10 text-success/90 border border-success/20 uppercase tracking-wide font-medium">
                            <Star className="h-2.5 w-2.5" /> Recurrente
                          </span>
                        )}
                      </div>
                      {c.telefono && (
                        <div className="text-[12.5px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.telefono}
                        </div>
                      )}
                      {c.comunes.length > 0 && (
                        <div className="text-[12.5px] text-muted-foreground mt-1 truncate">
                          Suele pedir: {c.comunes.join(" · ")}
                        </div>
                      )}
                      {note && (
                        <div className="text-[12px] text-foreground/70 mt-2 line-clamp-1 italic">
                          📝 {note}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <div className="text-[14.5px] font-semibold tabular-nums">
                        {money(c.totalGastado)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.totalPedidos} {c.totalPedidos === 1 ? "pedido" : "pedidos"}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/60 mt-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
