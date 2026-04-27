import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOperia, type WhatsappStatus } from "@/lib/operia-store";
import { MessageCircle, Search, Phone } from "lucide-react";

export const Route = createFileRoute("/inbox/")({
  head: () => ({
    meta: [
      { title: "WhatsApp Inbox — Operia" },
      { name: "description", content: "Mensajes entrantes de WhatsApp listos para convertir en órdenes." },
    ],
  }),
  component: InboxPage,
});

const statusLabel: Record<WhatsappStatus, string> = {
  nuevo: "Nuevo",
  analizado: "Analizado",
  convertido: "Convertido",
  respondido: "Respondido",
};

const statusStyle: Record<WhatsappStatus, string> = {
  nuevo: "bg-primary/15 text-primary border-primary/30",
  analizado: "bg-warning/20 text-foreground border-warning/40",
  convertido: "bg-success/15 text-success border-success/30",
  respondido: "bg-secondary text-muted-foreground border-border",
};

function InboxPage() {
  const messages = useOperia((s) => s.messages);
  const whatsapp = useOperia((s) => s.whatsapp);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<WhatsappStatus | "todos">("todos");

  const filtered = messages
    .filter((m) => (filter === "todos" ? true : m.estado === filter))
    .filter((m) =>
      !q ? true : (m.cliente + " " + m.telefono + " " + m.texto).toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => b.recibidoAt - a.recibidoAt);

  return (
    <AppShell>
      <PageHeader
        title="WhatsApp Inbox"
        subtitle="Mensajes entrantes que esperan ser convertidos en órdenes."
      />

      {!whatsapp.conectado && (
        <div className="mb-5 p-3 rounded-2xl border border-warning/40 bg-warning/10 text-sm">
          <span className="font-medium">Modo simulación.</span> Estás viendo mensajes de prueba.
          Para activar la integración real, conecta WhatsApp Business Cloud API en{" "}
          <Link to="/configuracion" className="underline">Ajustes</Link>.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, teléfono o texto…"
            className="pl-9 rounded-full"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(["todos", "nuevo", "analizado", "convertido", "respondido"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-full text-xs whitespace-nowrap border transition ${
                filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {s === "todos" ? "Todos" : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 rounded-3xl text-center text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No hay mensajes que coincidan.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <Link
              key={m.id}
              to="/inbox/$id"
              params={{ id: m.id }}
              className="block"
            >
              <Card className="p-4 rounded-2xl hover:bg-secondary/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/15 text-success grid place-items-center shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{m.cliente}</span>
                      {m.telefono && m.cliente !== m.telefono && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {m.telefono}
                        </span>
                      )}
                      <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full border ${statusStyle[m.estado]}`}>
                        {statusLabel[m.estado]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.texto}</p>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      <RelativeTime ts={m.recibidoAt} />
                    </div>
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

function RelativeTime({ ts }: { ts: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span>—</span>;
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return <span>Justo ahora</span>;
  if (diff < 60) return <span>Hace {diff} min</span>;
  const h = Math.floor(diff / 60);
  if (h < 24) return <span>Hace {h} h</span>;
  const d = Math.floor(h / 24);
  return <span>Hace {d} d</span>;
}
