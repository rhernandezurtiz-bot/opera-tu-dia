import { createFileRoute } from "@tanstack/react-router";
import operiaLogo from "@/assets/operia-logo.png";
import operiaIcon from "@/assets/operia-icon.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Operia — Ventas por WhatsApp sin caos",
      },
      {
        name: "description",
        content:
          "Operia centraliza conversaciones de WhatsApp, Instagram y Facebook para que los equipos vendan, respondan y operen con control.",
      },
      {
        property: "og:title",
        content: "Operia — Ventas por WhatsApp sin caos",
      },
      {
        property: "og:description",
        content:
          "Una plataforma operativa para centralizar mensajes, priorizar pedidos y coordinar ventas conversacionales.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="/" className="flex items-center gap-2.5" aria-label="Operia">
            <img src={operiaIcon} alt="" className="h-8 w-8 rounded-full" />
            <img src={operiaLogo} alt="Operia" className="h-4 w-auto object-contain" />
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#plataforma" className="transition-colors hover:text-foreground">
              Plataforma
            </a>
            <a href="#integracion" className="transition-colors hover:text-foreground">
              Integración
            </a>
            <a href="#contacto" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </nav>
          <a
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Entrar
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-24">
        <div>
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Infraestructura para ventas conversacionales
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-normal md:text-6xl">
            Centraliza y opera tus ventas de WhatsApp sin perder conversaciones.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Operia convierte mensajes de WhatsApp, Instagram y Facebook en una operación clara: inbox único, pedidos estructurados, responsables y seguimiento.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:hola@operia.app?subject=Solicitar%20demo%20Operia"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Solicitar demo
            </a>
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Explorar plataforma
            </a>
          </div>
        </div>

        <div className="grid content-start gap-3" aria-label="Capacidades principales">
          <Feature title="Inbox unificado" body="Todos los mensajes en una sola bandeja para responder con contexto." />
          <Feature title="Pedidos estructurados" body="Convierte conversaciones en estados, responsables y siguientes pasos." />
          <Feature title="Control operativo" body="Prioridades, auditoría y seguimiento para equipos comerciales." />
        </div>
      </section>

      <section id="plataforma" className="border-t border-border bg-secondary/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3 md:px-8">
          <Stat value="1" label="bandeja central para WhatsApp, Instagram y Facebook" />
          <Stat value="24h" label="para iniciar una implementación guiada" />
          <Stat value="100%" label="enfocado en operación, trazabilidad y ventas" />
        </div>
      </section>

      <section id="integracion" className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Integración Meta
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal md:text-4xl">
            Sitio público estable para verificación y operación.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Esta página no depende de sesiones, cookies, consultas privadas ni llamadas de servidor de larga duración. El endpoint público de WhatsApp puede ser verificado por Meta de forma independiente.
          </p>
        </div>
      </section>

      <footer id="contacto" className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2.5">
            <img src={operiaIcon} alt="" className="h-5 w-5 rounded-full" />
            <span className="font-medium text-foreground">Operia</span>
            <span>Ventas conversacionales con control.</span>
          </div>
          <a href="mailto:hola@operia.app" className="transition-colors hover:text-foreground">
            hola@operia.app
          </a>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-md border border-border bg-card p-5 text-card-foreground shadow-[var(--shadow-card)]">
      <h2 className="text-base font-semibold tracking-normal">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-border pl-5">
      <div className="text-3xl font-semibold tracking-normal">{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{label}</p>
    </div>
  );
}
