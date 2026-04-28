import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChannelBadge } from "@/components/ChannelBadge";
import { useOperia, type WhatsappStatus, type Channel, CHANNEL_LABELS } from "@/lib/operia-store";
import { MessageCircle, Search, Phone } from "lucide-react";

export const Route = createFileRoute("/inbox/")({
  head: () => ({
    meta: [
      { title: "Inbox multicanal — Operia" },
      { name: "description", content: "Mensajes entrantes de WhatsApp, Instagram y Facebook listos para convertir en órdenes." },
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
  nuevo: "bg-foreground/5 text-foreground/80 border-border",
  analizado: "bg-warning/12 text-foreground/80 border-warning/25",
  convertido: "bg-success/8 text-success/90 border-success/20",
  respondido: "bg-secondary text-muted-foreground border-border",
};

function InboxPage() {
  const messages = useOperia((s) => s.messages);
  const whatsapp = useOperia((s) => s.whatsapp);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<WhatsappStatus | "todos">("todos");
  const [canalFilter, setCanalFilter] = useState<Channel | "todos">("todos");

  const filtered = messages
    .filter((m) => (filter === "todos" ? true : m.estado === filter))
    .filter((m) => (canalFilter === "todos" ? true : (m.canal ?? "whatsapp") === canalFilter))
    .filter((m) =>
      !q ? true : (m.cliente + " " + m.telefono + " " + m.texto).toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => b.recibidoAt - a.recibidoAt);

  const countsByCanal = messages.reduce<Record<string, number>>((acc, m) => {
    const c = m.canal ?? "whatsapp";
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <PageHeader
        title="Inbox multicanal"
        subtitle="Mensajes de WhatsApp, Instagram y Facebook listos para convertir en órdenes."
      />

      {!whatsapp.conectado && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/8 text-[13px] flex items-start gap-3">
          <div className="h-6 w-6 rounded-md bg-warning/20 grid place-items-center shrink-0">
            <MessageCircle className="h-3.5 w-3.5 text-foreground/70" />
          </div>
          <div>
            <span className="font-medium text-foreground">Modo simulación.</span>{" "}
            <span className="text-muted-foreground">
              Estás viendo mensajes de prueba. Para activar canales reales, conecta WhatsApp, Instagram o Facebook en{" "}
              <Link to="/configuracion" className="underline text-foreground">Ajustes</Link>.
            </span>
          </div>
        </div>
      )}

      {/* Filtro por canal */}
      <div className="flex gap-1 overflow-x-auto -mx-1 px-1 mb-3">
        {(["todos", "whatsapp", "instagram", "facebook", "manual"] as const).map((c) => {
          const count = c === "todos" ? messages.length : (countsByCanal[c] ?? 0);
          return (
            <button
              key={c}
              onClick={() => setCanalFilter(c)}
              className={`px-3 h-9 rounded-lg text-[12px] font-medium whitespace-nowrap border transition-colors ${
                canalFilter === c
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "todos" ? "Todos" : CHANNEL_LABELS[c as Channel]} <span className="opacity-60">· {count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, teléfono o texto…"
            className="pl-9 rounded-lg h-10"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
          {(["todos", "nuevo", "analizado", "convertido", "respondido"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 h-10 rounded-lg text-[12.5px] font-medium whitespace-nowrap border transition-colors ${
                filter === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "todos" ? "Todos" : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 rounded-xl text-center text-muted-foreground border-dashed bg-secondary/30">
          <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <div className="text-[14px] font-medium text-foreground/80">
            {messages.length === 0 ? "Sin mensajes todavía" : "Sin mensajes"}
          </div>
          <div className="text-[12.5px] mt-1">
            {messages.length === 0
              ? "Pega tu primer mensaje de WhatsApp para empezar."
              : "No hay mensajes que coincidan."}
          </div>
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
              <Card className="p-4 md:p-5 rounded-xl hover:border-foreground/15 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-secondary border border-border grid place-items-center shrink-0">
                    <MessageCircle className="h-4 w-4 text-foreground/70" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[14.5px] truncate">{m.cliente}</span>
                      <ChannelBadge canal={m.canal} compact />
                      {m.telefono && m.cliente !== m.telefono && (
                        <span className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {m.telefono}
                        </span>
                      )}
                      <span className={`ml-auto text-[11px] font-medium px-2 h-[22px] inline-flex items-center rounded-full border ${statusStyle[m.estado]}`}>
                        {statusLabel[m.estado]}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{m.texto}</p>
                    <div className="text-[11px] text-muted-foreground mt-2">
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
