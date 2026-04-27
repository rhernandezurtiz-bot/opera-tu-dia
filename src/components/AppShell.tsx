import { Link, useLocation } from "@tanstack/react-router";
import { Home, ListOrdered, ChefHat, AlertTriangle, Settings, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useUI, urgency } from "@/lib/ui-store";
import { NewOrderModal } from "./NewOrderModal";

const nav = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/pedidos", label: "Pedidos", icon: ListOrdered },
  { to: "/produccion", label: "Plan del día", icon: ChefHat },
  { to: "/riesgos", label: "Riesgos", icon: AlertTriangle },
  { to: "/configuracion", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const openNew = useUI((s) => s.openNewOrder);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 px-4 py-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-display text-lg">O</div>
          <div>
            <div className="font-display text-xl leading-none">Operia</div>
            <div className="text-xs text-muted-foreground mt-1">Tu día, en orden.</div>
          </div>
        </Link>

        <Button onClick={openNew} size="lg" className="rounded-full mb-6 shadow-sm">
          <Plus className="h-4 w-4 mr-1" /> Nuevo pedido
        </Button>

        <nav className="flex flex-col gap-1">
          {nav.map((n) => {
            const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-28 md:pb-8">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display">O</div>
          <div className="font-display text-lg flex-1">Operia</div>
          <Button onClick={openNew} size="sm" className="rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </header>
        <div className="px-4 md:px-10 py-6 md:py-10 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border px-2 py-2 grid grid-cols-5 gap-1">
        {nav.map((n) => {
          const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] gap-0.5 ${
                active ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-full">{n.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile floating action button */}
      <button
        onClick={openNew}
        className="md:hidden fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center active:scale-95 transition"
        aria-label="Nuevo pedido"
      >
        <Plus className="h-6 w-6" />
      </button>

      <NewOrderModal />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function RiskBadge({ level }: { level: "bajo" | "medio" | "alto" }) {
  const styles = {
    bajo: "bg-success/15 text-success border-success/30",
    medio: "bg-warning/20 text-foreground border-warning/40",
    alto: "bg-danger/15 text-danger border-danger/30",
  } as const;
  const label = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" }[level];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${styles[level]}`}>{label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    nuevo: "bg-secondary text-secondary-foreground",
    confirmado: "bg-accent text-accent-foreground",
    en_proceso: "bg-warning/25 text-foreground",
    listo: "bg-success/20 text-success",
    entregado: "bg-primary/15 text-primary",
    cancelado: "bg-muted text-muted-foreground line-through",
  };
  const label: Record<string, string> = {
    nuevo: "Nuevo", confirmado: "Confirmado", en_proceso: "En proceso",
    listo: "Listo", entregado: "Entregado", cancelado: "Cancelado",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${map[status] || "bg-muted"}`}>{label[status] || status}</span>;
}

export function UrgencyChip({ fecha, hora }: { fecha: string; hora: string }) {
  const u = urgency(fecha, hora);
  const tones: Record<string, string> = {
    danger: "bg-danger/15 text-danger border-danger/30",
    warning: "bg-warning/25 text-foreground border-warning/40",
    muted: "bg-secondary text-muted-foreground border-border",
    success: "bg-success/15 text-success border-success/30",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${tones[u.tone]}`}>{u.label}</span>;
}
