import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  MessageSquare,
  ListChecks,
  AlertCircle,
  ChefHat,
  Users,
  Wallet,
  Check,
  Sparkles,
} from "lucide-react";
import operiaLogo from "@/assets/operia-logo.png";
import operiaIcon from "@/assets/operia-icon.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operia — Deja de perder pedidos y dinero en WhatsApp" },
      {
        name: "description",
        content:
          "Operia convierte mensajes de WhatsApp en órdenes claras, te dice qué hacer y te ayuda a cobrar a tiempo. Menos caos, más dinero.",
      },
      { property: "og:title", content: "Operia — Deja de perder pedidos y dinero en WhatsApp" },
      {
        property: "og:description",
        content:
          "Convierte mensajes en órdenes, recupera pagos pendientes y entrega a tiempo. Empieza gratis.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Operia">
            <img src={operiaIcon} alt="" className="h-7 w-7 rounded-full" />
            <img src={operiaLogo} alt="Operia" className="h-[16px] w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground">Cómo funciona</a>
            <a href="#beneficios" className="hover:text-foreground">Beneficios</a>
            <a href="#precios" className="hover:text-foreground">Precios</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href="#contacto" className="hover:text-foreground">Contacto</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-9">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="h-9">
              <Link to="/login">Empieza gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Para negocios que venden por WhatsApp</span>
          </div>
          <h1 className="text-[40px] md:text-[58px] leading-[1.05] font-semibold tracking-tight">
            Deja de perder pedidos y{" "}
            <span className="bg-foreground text-background px-2 rounded-md">dinero</span>{" "}
            en WhatsApp.
          </h1>
          <p className="mt-6 text-[16px] md:text-[18px] text-muted-foreground leading-relaxed max-w-2xl">
            Operia convierte mensajes en órdenes claras, te dice qué hacer y te
            ayuda a cobrar a tiempo. Menos caos, menos errores, más dinero en la
            caja.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-[14px]">
              <Link to="/login">
                Empieza gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <a
              href="#como-funciona"
              className="text-[13.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Ver cómo funciona <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="mt-5 text-[12.5px] text-muted-foreground">
            Sin tarjeta. Sin instalación. Tu primer pedido organizado en menos de 1 minuto.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Cómo funciona</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          De un WhatsApp confuso a un pedido cobrado, sin perder tiempo.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Step n="1" icon={MessageSquare} title="Pega el mensaje" body="Copia el WhatsApp del cliente y pégalo. Operia lee y entiende." />
          <Step n="2" icon={ListChecks} title="Operia lo organiza" body="Detecta cliente, fecha, hora, dirección y qué falta para no perder el pedido." />
          <Step n="3" icon={ChefHat} title="Te dice qué hacer" body="Confirma, cobra y entrega siguiendo el plan del día. Cero adivinar." />
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Beneficios</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Cada pedido cuenta. Cada peso, también.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Benefit icon={AlertCircle} title="No pierdas pedidos" body="Operia te avisa qué falta antes de que el cliente desaparezca o cancele." />
          <Benefit icon={Wallet} title="Cobra a tiempo" body="Detecta pagos pendientes y te da el mensaje listo para pedir el anticipo." />
          <Benefit icon={ChefHat} title="Ten control del día" body="Sabes qué producir, a qué hora y para quién. Sin libretas, sin caos." />
          <Benefit icon={Users} title="Sabes qué hacer ahora" body="Cada pedido tiene una acción clara: confirmar, cobrar, recordar o entregar." />
        </div>
      </section>

      {/* Para quién */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Para quién es</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Hecho para negocios que viven en WhatsApp.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Reposterías", "Dark kitchens", "Floristerías", "Salones de belleza", "Servicios a domicilio", "Estudios y citas", "Talleres y reparaciones", "Pequeños catering"].map((x) => (
            <Card key={x} className="p-4 rounded-xl text-[13.5px] font-medium">
              {x}
            </Card>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Precios</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-3 max-w-2xl">
          Un plan para cada etapa del negocio.
        </h2>
        <p className="text-muted-foreground text-[14.5px] mb-10 max-w-xl">
          Empieza gratis, paga cuando crezcas. Cancela cuando quieras.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Plan
            name="Inicial"
            price="$499"
            tagline="Para empezar a ordenar tu día."
            features={["Hasta 50 pedidos / mes", "Inbox de WhatsApp", "Plan del día", "1 usuario"]}
          />
          <Plan
            name="Pro"
            highlighted
            price="$999"
            tagline="Para negocios que venden todos los días."
            features={[
              "Pedidos ilimitados",
              "Clientes y notas",
              "Recordatorios y pagos",
              "Hasta 3 usuarios",
            ]}
          />
          <Plan
            name="Negocio"
            price="$1,999"
            tagline="Para equipos y operación seria."
            features={[
              "Todo lo de Pro",
              "Usuarios ilimitados",
              "Integración WhatsApp Cloud API",
              "Soporte prioritario",
            ]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Preguntas frecuentes</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Lo que normalmente nos preguntan.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Faq q="¿Necesito conectar WhatsApp?" a="No es obligatorio. Puedes pegar mensajes manualmente. Si quieres recibir mensajes en automático, conectas WhatsApp Cloud API en Ajustes." />
          <Faq q="¿Mis datos están seguros?" a="Tus pedidos, clientes y notas se guardan organizados en un solo lugar y son privados de tu cuenta." />
          <Faq q="¿Puedo usarlo desde el celular?" a="Sí. Operia funciona en cualquier navegador, optimizado para móvil." />
          <Faq q="¿Puedo cancelar?" a="Cuando quieras. No hay contratos ni permanencia." />
        </div>
      </section>

      {/* CTA + Contacto */}
      <section id="contacto" className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <Card className="p-8 md:p-12 rounded-2xl text-center">
          <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight max-w-2xl mx-auto">
            Empieza a ordenar tu día en menos de 2 minutos.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-[14.5px]">
            Sin tarjeta. Sin instalación. Pega tu primer mensaje y verás la diferencia.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/login">
                Probar Operia <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <a
              href="mailto:hola@operia.app"
              className="text-[13.5px] text-muted-foreground hover:text-foreground"
            >
              hola@operia.app
            </a>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} Operia. Hecho para negocios reales.
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium mb-4">
      {children}
    </div>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: any; title: string; body: string }) {
  return (
    <Card className="p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-foreground text-background grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Paso {n}</span>
      </div>
      <div className="text-[16px] font-semibold mb-1">{title}</div>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

function Benefit({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <Card className="p-6 rounded-xl">
      <div className="h-8 w-8 rounded-lg bg-secondary border border-border grid place-items-center mb-4">
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
      <div className="text-[15.5px] font-semibold mb-1">{title}</div>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

function Plan({
  name,
  price,
  tagline,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <Card
      className={`p-6 rounded-2xl flex flex-col ${
        highlighted ? "border-foreground bg-foreground text-background" : ""
      }`}
    >
      <div className={`text-[11px] uppercase tracking-[0.14em] mb-2 ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
        {name} {highlighted && "· Más popular"}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[34px] font-semibold tracking-tight tabular-nums">{price}</span>
        <span className={`text-[12.5px] ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>MXN / mes</span>
      </div>
      <p className={`text-[13px] mb-5 ${highlighted ? "text-background/80" : "text-muted-foreground"}`}>{tagline}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13.5px]">
            <Check className={`h-4 w-4 mt-0.5 shrink-0 ${highlighted ? "text-background" : "text-foreground/70"}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        variant={highlighted ? "secondary" : "default"}
        className="h-10 w-full"
      >
        <Link to="/login">Empezar</Link>
      </Button>
    </Card>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="text-[14.5px] font-semibold mb-1.5">{q}</div>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed">{a}</p>
    </Card>
  );
}
