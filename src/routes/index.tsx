import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  MessageSquare,
  Workflow,
  ShieldCheck,
  Layers,
  Users,
  LineChart,
  Check,
  Sparkles,
  ArrowDown,
  Send,
  Wrench,
  Cake,
  AlertCircle,
  Zap,
} from "lucide-react";
import operiaLogo from "@/assets/operia-logo.png";
import operiaIcon from "@/assets/operia-icon.png";
import { LandingExample } from "@/components/LandingExample";
import { DecideItem } from "@/components/DecideItem";
import { Testimonial } from "@/components/Testimonial";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operia — Centraliza, controla y ejecuta tus ventas de WhatsApp" },
      {
        name: "description",
        content:
          "La plataforma operativa para equipos que venden por WhatsApp. Convierte conversaciones en operaciones claras, evita pérdidas y escala sin caos.",
      },
      {
        property: "og:title",
        content: "Operia — La plataforma operativa para ventas por WhatsApp",
      },
      {
        property: "og:description",
        content:
          "Centraliza pedidos, prioriza por riesgo, ejecuta acciones y mide resultados. Diseñada para equipos.",
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
            <a href="#plataforma" className="hover:text-foreground">Plataforma</a>
            <a href="#capacidades" className="hover:text-foreground">Capacidades</a>
            <a href="#clientes" className="hover:text-foreground">Clientes</a>
            <a href="#precios" className="hover:text-foreground">Precios</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-9">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="h-9">
              <a href="#contacto">Solicitar demo</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Plataforma operativa para ventas por WhatsApp</span>
          </div>
          <h1 className="text-[42px] md:text-[60px] leading-[1.04] font-semibold tracking-tight">
            Centraliza, controla y ejecuta tus{" "}
            <span className="bg-foreground text-background px-2 rounded-md">
              ventas de WhatsApp
            </span>
            .
          </h1>
          <p className="mt-6 text-[16px] md:text-[18px] text-muted-foreground leading-relaxed max-w-2xl">
            Operia convierte conversaciones en operaciones claras para equipos.
            Evita pérdidas, mejora tiempos de respuesta y escala sin caos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-[14px]">
              <a href="#contacto">
                Solicitar demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 px-5 text-[14px]">
              <Link to="/login">Probar plataforma</Link>
            </Button>
          </div>
          <p className="mt-6 text-[12.5px] text-muted-foreground">
            Implementación guiada · SOC-friendly · Roles y auditoría
          </p>
        </div>

        {/* Logos / proof bar */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric value="−87%" label="Pedidos perdidos" />
          <Metric value="3.2×" label="Tiempo de respuesta" />
          <Metric value="+24%" label="Cobranza puntual" />
          <Metric value="<2 min" label="Implementación inicial" />
        </div>
      </section>

      {/* El problema */}
      <section
        id="problema"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>El problema</SectionLabel>
        <div className="mt-4 grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <h2 className="text-[30px] md:text-[40px] leading-[1.08] font-semibold tracking-tight">
              WhatsApp no fue hecho para operar negocios.
            </h2>
            <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-md">
              Es un canal de mensajería, no una plataforma operativa. A medida que el
              volumen crece, la operación se fragmenta y el riesgo se acumula en silencio.
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            <ProblemItem
              title="Conversaciones perdidas"
              detail="Mensajes que nunca se responden. Clientes que se van sin que el equipo lo note."
            />
            <ProblemItem
              title="Pedidos sin seguimiento"
              detail="Sin estado, sin responsable, sin trazabilidad. La operación depende de la memoria."
            />
            <ProblemItem
              title="Equipos descoordinados"
              detail="Cada agente con su propio teléfono y criterio. Cero visibilidad cruzada."
            />
            <ProblemItem
              title="Falta de visibilidad"
              detail="Sin métricas, sin alertas, sin control. No se puede gestionar lo que no se mide."
            />
          </div>
        </div>
      </section>

      {/* Plataforma */}
      <section
        id="plataforma"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border"
      >
        <SectionLabel>La plataforma</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Una sola superficie operativa para todo el ciclo de venta.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Step
            n="01"
            icon={MessageSquare}
            title="Captura"
            body="Ingesta de mensajes de WhatsApp, manuales o vía API oficial. Estandariza datos en tiempo real."
          />
          <Step
            n="02"
            icon={Workflow}
            title="Decisión"
            body="Motor de prioridad y faltantes. Asigna la siguiente acción a cada pedido y a cada agente."
          />
          <Step
            n="03"
            icon={LineChart}
            title="Ejecución"
            body="Ejecuta cobros, confirmaciones y entregas con plantillas auditables y métricas en vivo."
          />
        </div>
      </section>

      {/* Casos reales */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Casos reales</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          De conversación a operación, en segundos.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <LandingExample
            icon={Cake}
            input="Hola quiero un pastel mañana para 20 personas"
            tipo="Producto · Pastel"
            fields={[
              { label: "Cliente", value: "Por confirmar", missing: true },
              { label: "Fecha", value: "Mañana" },
              { label: "Personas", value: "20" },
              { label: "Sabor / dirección", value: "Faltan", missing: true },
            ]}
            action="Solicitar anticipo"
            message="Para confirmar tu pedido necesitamos sabor, dirección y anticipo. ¿Podrías compartirlos?"
          />
          <LandingExample
            icon={Wrench}
            input="¿Me arreglan una fuga el viernes en Providencia?"
            tipo="Servicio · Plomería"
            fields={[
              { label: "Servicio", value: "Reparar fuga" },
              { label: "Fecha", value: "Viernes" },
              { label: "Zona", value: "Providencia" },
              { label: "Hora exacta", value: "Falta", missing: true },
            ]}
            action="Confirmar horario"
            message="Confirmamos visita el viernes en Providencia. ¿Qué franja horaria te funciona mejor?"
          />
          <LandingExample
            icon={Users}
            input="¿Tienes lugar mañana 4pm para corte y tinte?"
            tipo="Cita · Salón"
            fields={[
              { label: "Servicio", value: "Corte y tinte" },
              { label: "Fecha", value: "Mañana" },
              { label: "Hora", value: "4:00 pm" },
              { label: "Cliente", value: "Por confirmar", missing: true },
            ]}
            action="Confirmar cita"
            message="Confirmamos tu cita mañana a las 16:00 para corte y tinte. Por favor confirma tu nombre."
          />
        </div>
      </section>

      {/* Capacidades */}
      <section
        id="capacidades"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border"
      >
        <SectionLabel>Capacidades</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Diseñada para equipos que no pueden permitirse errores.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Benefit
            icon={Layers}
            title="Centralización total"
            body="Todas las conversaciones, pedidos y clientes en una sola fuente de verdad. Sin libretas, sin duplicados."
          />
          <Benefit
            icon={Workflow}
            title="Ejecución asistida"
            body="Cada pedido tiene una próxima acción priorizada por riesgo, valor y tiempo restante."
          />
          <Benefit
            icon={LineChart}
            title="Visibilidad operativa"
            body="Indicadores en vivo de cobranza, entregas y SLA. Decisiones basadas en datos, no en intuición."
          />
          <Benefit
            icon={ShieldCheck}
            title="Control y cumplimiento"
            body="Roles, permisos y trazabilidad de cada acción. Listo para auditoría desde el día uno."
          />
        </div>
      </section>

      {/* Decide contigo */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Inteligencia operativa</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-3 max-w-2xl">
          Operia no solo organiza. Decide contigo.
        </h2>
        <p className="text-muted-foreground text-[14.5px] mb-10 max-w-xl">
          Cada pedido llega priorizado y con la acción recomendada. Tu equipo aprueba y ejecuta.
        </p>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <ul className="space-y-4">
            <DecideItem
              icon={AlertCircle}
              title="Detecta lo que falta"
              body="Identifica datos incompletos antes de que se conviertan en pérdidas."
            />
            <DecideItem
              icon={Zap}
              title="Prioriza por urgencia"
              body="Clasificación automática por riesgo, valor y SLA. Sin reuniones para decidir qué hacer."
            />
            <DecideItem
              icon={Send}
              title="Ejecuta con precisión"
              body="Una acción por pedido, una plantilla por contexto. Aprobación y envío en un clic."
            />
          </ul>

          <Card className="p-5 rounded-2xl bg-secondary/40">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Vista en plataforma
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">M. López · #4821</div>
                  <div className="text-[12.5px] text-muted-foreground truncate">
                    Pedido B2C · valor $1,800 · entrega +18h
                  </div>
                </div>
                <span className="text-[10.5px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-danger/10 text-danger/90 border border-danger/20 shrink-0">
                  P0 · Crítico
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-danger/90 font-medium">Pago no confirmado</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">SLA en 18 h</span>
              </div>
            </div>

            <div className="flex justify-center text-muted-foreground my-3">
              <ArrowDown className="h-4 w-4" />
            </div>

            <div className="rounded-xl border border-foreground/15 bg-foreground/3 p-4">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                Acción recomendada
              </div>
              <div className="text-[14px] font-semibold mb-2">Solicitar anticipo</div>
              <div className="text-[12.5px] text-foreground/80 italic leading-snug mb-3">
                "Hola María, para asegurar tu pedido del viernes te compartimos los datos
                para el anticipo de $1,800. Confirmamos al recibirlo."
              </div>
              <Button size="sm" className="w-full h-9">
                <Send className="h-3.5 w-3.5" /> Aprobar y enviar
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Industrias */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border">
        <SectionLabel>Industrias</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Construida para operaciones donde cada conversación es ingreso.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "Retail D2C",
            "Food & Beverage",
            "Servicios técnicos",
            "Salud y bienestar",
            "Logística última milla",
            "Educación",
            "Inmobiliaria",
            "Profesional B2B",
          ].map((x) => (
            <Card key={x} className="p-4 rounded-xl text-[13.5px] font-medium">
              {x}
            </Card>
          ))}
        </div>
      </section>

      {/* Clientes */}
      <section
        id="clientes"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border"
      >
        <SectionLabel>Clientes</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Equipos operando con menos fricción y más control.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Testimonial
            quote="Centralizamos la operación de cinco sucursales en una sola vista. Redujimos pedidos perdidos a casi cero y recuperamos horas operativas todos los días."
            name="Mariana Cortés"
            role="Head of Operations · Dulce Hogar"
            initial="M"
          />
          <Testimonial
            quote="La priorización automática eliminó las dobles reservas. El equipo deja de discutir qué hacer y simplemente ejecuta."
            name="Andrea Reyes"
            role="Directora · Belle Studios"
            initial="A"
          />
          <Testimonial
            quote="Visibilidad real del pipeline de servicios y cobros. Mejoramos tiempos de respuesta 3× sin contratar más gente."
            name="Luis Hernández"
            role="COO · Hogar Plus"
            initial="L"
          />
        </div>
      </section>

      {/* Precios */}
      <section
        id="precios"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border"
      >
        <SectionLabel>Precios</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-3 max-w-2xl">
          Planes por etapa de operación.
        </h2>
        <p className="text-muted-foreground text-[14.5px] mb-10 max-w-xl">
          Sin permanencia. Migración asistida desde cualquier plan.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Plan
            name="Inicial"
            price="$499"
            tagline="Para empezar a organizar tus pedidos."
            features={[
              "Hasta 50 pedidos / mes",
              "Inbox unificado",
              "Plan operativo diario",
              "1 usuario",
            ]}
          />
          <Plan
            name="Pro"
            highlighted
            price="$999"
            tagline="Para negocios que reciben pedidos todos los días."
            features={[
              "Pedidos ilimitados",
              "CRM integrado y notas",
              "Acciones recomendadas y cobros",
              "Hasta 3 usuarios",
            ]}
          />
          <Plan
            name="Negocio"
            price="$1,999"
            tagline="Para equipos que no pueden perder pedidos ni dinero."
            features={[
              "Todo lo de Pro",
              "Usuarios ilimitados con roles",
              "WhatsApp Cloud API · SLA y reportes",
              "Soporte prioritario y onboarding",
            ]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-20 border-t border-border"
      >
        <SectionLabel>Preguntas frecuentes</SectionLabel>
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mb-10 max-w-2xl">
          Lo esencial antes de implementar.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Faq
            q="¿Cómo se integra con WhatsApp?"
            a="Soportamos ingesta manual y conexión nativa con WhatsApp Cloud API. La migración es asistida y no requiere migrar tu número."
          />
          <Faq
            q="¿Cómo manejan seguridad y permisos?"
            a="Cuentas con roles granulares, registro de auditoría y separación de datos por organización. Infraestructura cifrada en tránsito y en reposo."
          />
          <Faq
            q="¿Qué tan rápido se implementa?"
            a="Operación productiva en menos de un día. Para equipos grandes ofrecemos onboarding guiado y plantillas por industria."
          />
          <Faq
            q="¿Pueden integrarse con nuestros sistemas?"
            a="Exponemos API y webhooks. Integramos con CRM, ERP y herramientas de pago utilizadas por equipos de operación."
          />
        </div>
      </section>

      {/* CTA + Contacto */}
      <section
        id="contacto"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <Card className="p-8 md:p-12 rounded-2xl text-center">
          <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight max-w-2xl mx-auto">
            La operación de tu negocio merece una plataforma, no una libreta.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-[14.5px]">
            Agenda una demo de 20 minutos. Te mostramos cómo se vería con tu operación.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <a href="mailto:hola@operia.app?subject=Solicitar%20demo%20Operia">
                Solicitar demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 px-5">
              <Link to="/login">Probar plataforma</Link>
            </Button>
          </div>
          <p className="text-[12px] text-muted-foreground mt-5">
            hola@operia.app · Respuesta en menos de 24 h hábiles
          </p>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} Operia. Plataforma operativa para ventas por WhatsApp.
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-4 rounded-xl">
      <div className="text-[22px] font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string;
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-foreground text-background grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
          {n}
        </span>
      </div>
      <div className="text-[16px] font-semibold mb-1">{title}</div>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

function Benefit({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
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
      <div
        className={`text-[11px] uppercase tracking-[0.14em] mb-2 ${
          highlighted ? "text-background/70" : "text-muted-foreground"
        }`}
      >
        {name} {highlighted && "· Recomendado"}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[34px] font-semibold tracking-tight tabular-nums">{price}</span>
        <span
          className={`text-[12.5px] ${
            highlighted ? "text-background/70" : "text-muted-foreground"
          }`}
        >
          MXN / mes
        </span>
      </div>
      <p
        className={`text-[13px] mb-5 ${
          highlighted ? "text-background/80" : "text-muted-foreground"
        }`}
      >
        {tagline}
      </p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13.5px]">
            <Check
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                highlighted ? "text-background" : "text-foreground/70"
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        variant={highlighted ? "secondary" : "default"}
        className="h-10 w-full"
      >
        <Link to="/login">Comenzar</Link>
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
