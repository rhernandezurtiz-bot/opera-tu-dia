import { Link, useLocation, Navigate } from "@tanstack/react-router";
import { Home, ListOrdered, ChefHat, AlertTriangle, Settings, Plus, MessageCircle, Users, LogOut, Package, Boxes, CalendarDays, Brain, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useUI, urgency } from "@/lib/ui-store";
import { useOperia } from "@/lib/operia-store";
import { useAuth } from "@/lib/auth-store";
import { NewOrderModal } from "./NewOrderModal";
import operiaLogo from "@/assets/operia-logo.png";
import operiaIcon from "@/assets/operia-icon.png";

const nav = [
  { to: "/app", label: "Inicio", icon: Home },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/inbox/meta", label: "Inbox Meta", icon: MessageCircle },
  { to: "/pedidos", label: "Pedidos", icon: ListOrdered },
  { to: "/produccion", label: "Plan del día", icon: ChefHat },
  { to: "/catalogo", label: "Catálogo", icon: Package },
  { to: "/inventario", label: "Inventario", icon: Boxes },
  { to: "/capacidad", label: "Capacidad", icon: CalendarDays },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/aprendizaje", label: "Aprendizaje", icon: Brain },
  { to: "/riesgos", label: "Riesgos", icon: AlertTriangle },
  { to: "/suscripcion", label: "Plan", icon: Sparkles },
  { to: "/configuracion", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const openNew = useUI((s) => s.openNewOrder);
  const unread = useOperia((s) => s.messages.filter((m) => m.estado === "nuevo").length);
  const user = useAuth((s) => s.user);
  const onboarded = useAuth((s) => s.onboarded);
  const logout = useAuth((s) => s.logout);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (hydrated && !user) return <Navigate to="/" />;
  if (hydrated && user && !onboarded) return <Navigate to="/onboarding" />;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-9" aria-label="Operia">
          <img
            src={operiaIcon}
            alt=""
            width={1024}
            height={1024}
            className="h-7 w-7 rounded-full"
          />
          <img
            src={operiaLogo}
            alt="Operia"
            width={1584}
            height={672}
            className="h-[18px] w-auto object-contain object-left"
          />
        </Link>

        <Button
          onClick={openNew}
          className="rounded-lg mb-7 h-10 font-medium shadow-[var(--shadow-soft)]"
        >
          <Plus className="h-4 w-4" /> Nuevo pedido
        </Button>

        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => {
            const active = n.to === "/app" ? loc.pathname === "/app" : loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            const showBadge = n.to === "/inbox" && unread > 0;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex items-center gap-3 px-3 h-9 rounded-lg text-[13.5px] transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-[16px] w-[16px] ${active ? "text-foreground" : ""}`} />
                <span className="flex-1">{n.label}</span>
                {showBadge && (
                  <span className="text-[10px] font-medium min-w-5 h-5 px-1.5 rounded-full bg-foreground text-background grid place-items-center">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 px-2 space-y-2">
          {user && (
            <div className="text-[11.5px] text-muted-foreground truncate" title={user.email}>
              {user.name || user.email}
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
          <div className="text-[10.5px] text-muted-foreground/70">v1.0 · MVP</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-28 md:pb-10">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border px-4 h-14 flex items-center gap-2.5">
          <Link to="/" className="flex-1 flex items-center gap-2" aria-label="Operia">
            <img
              src={operiaIcon}
              alt=""
              width={1024}
              height={1024}
              className="h-6 w-6 rounded-full"
            />
            <img
              src={operiaLogo}
              alt="Operia"
              width={1584}
              height={672}
              className="h-[15px] w-auto object-contain object-left"
            />
          </Link>
          <Button onClick={openNew} size="sm" className="rounded-lg h-8 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" /> Nuevo
          </Button>
        </header>
        <div className="px-5 md:px-12 py-7 md:py-12 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-1 pt-1.5 pb-2 grid grid-cols-7 gap-0.5">
        {nav.slice(0, 7).map((n) => {
          const active = n.to === "/app" ? loc.pathname === "/app" : loc.pathname.startsWith(n.to);
          const Icon = n.icon;
          const showBadge = n.to === "/inbox" && unread > 0;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-md text-[10px] gap-0.5 transition-colors ${
                active ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {showBadge && (
                <span className="absolute top-0.5 right-1.5 text-[9px] min-w-4 h-4 px-1 rounded-full bg-foreground text-background grid place-items-center">
                  {unread}
                </span>
              )}
              <span className="truncate max-w-full">{n.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile floating action button */}
      <button
        onClick={openNew}
        className="md:hidden fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-foreground text-background shadow-[var(--shadow-elevated)] grid place-items-center active:scale-95 transition"
        aria-label="Nuevo pedido"
      >
        <Plus className="h-5 w-5" />
      </button>

      <NewOrderModal />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
      <div className="min-w-0">
        <h1 className="text-[28px] md:text-[34px] leading-tight font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1.5 text-[14.5px] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ---------- Badges (calm, soft pills) ---------- */

const pillBase =
  "inline-flex items-center gap-1.5 px-2 h-[22px] rounded-full text-[11px] font-medium border tabular-nums whitespace-nowrap";

export function RiskBadge({ level }: { level: "bajo" | "medio" | "alto" }) {
  const styles = {
    bajo: "bg-success/8 text-success/90 border-success/20",
    medio: "bg-warning/12 text-foreground/80 border-warning/30",
    alto: "bg-danger/8 text-danger/90 border-danger/25",
  } as const;
  const dotStyles = {
    bajo: "bg-success",
    medio: "bg-warning",
    alto: "bg-danger",
  } as const;
  const label = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" }[level];
  return (
    <span className={`${pillBase} ${styles[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[level]}`} />
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    nuevo: "bg-secondary text-foreground/70 border-border",
    confirmado: "bg-accent text-accent-foreground border-border",
    en_proceso: "bg-warning/12 text-foreground/80 border-warning/25",
    listo: "bg-success/10 text-success/90 border-success/20",
    entregado: "bg-foreground/5 text-muted-foreground border-border",
    cancelado: "bg-muted text-muted-foreground border-border line-through",
  };
  const label: Record<string, string> = {
    nuevo: "Nuevo",
    confirmado: "Confirmado",
    en_proceso: "En proceso",
    listo: "Listo",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  return (
    <span className={`${pillBase} ${map[status] || "bg-muted border-border"}`}>
      {label[status] || status}
    </span>
  );
}

/* ---------- Urgency chip (SSR-safe) ---------- */

export function UrgencyChip({ fecha, hora }: { fecha: string; hora: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tones: Record<string, string> = {
    danger: "bg-danger/8 text-danger/90 border-danger/25",
    warning: "bg-warning/12 text-foreground/80 border-warning/30",
    muted: "bg-secondary text-muted-foreground border-border",
    success: "bg-success/8 text-success/90 border-success/20",
  };
  if (!mounted) {
    return (
      <span
        suppressHydrationWarning
        className={`${pillBase} bg-secondary text-muted-foreground border-border`}
      >
        {fecha || "Sin fecha"}
        {hora ? ` · ${hora}` : ""}
      </span>
    );
  }
  const u = urgency(fecha, hora);
  return (
    <span suppressHydrationWarning className={`${pillBase} ${tones[u.tone]}`}>
      {u.label}
    </span>
  );
}

/* ---------- Section heading (subtle) ---------- */

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground font-medium mb-3">
      {children}
    </div>
  );
}
