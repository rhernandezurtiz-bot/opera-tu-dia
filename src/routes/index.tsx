import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  ArrowDown,
  MessageSquare,
  MessagesSquare,
  Workflow,
  ShieldCheck,
  Layers,
  Users,
  LineChart,
  ListChecks,
  History,
  Check,
  Sparkles,
  Send,
  AlertCircle,
  AlertTriangle,
  Zap,
  Plug,
  Webhook,
  Database,
  Network,
  Lock,
  KeyRound,
  FileLock2,
  ScrollText,
  CalendarClock,
  CreditCard,
  ArrowUpRight,
  Target,
  Gauge,
  TrendingUp,
} from "lucide-react";
import operiaLogo from "@/assets/operia-logo.png";
import operiaIcon from "@/assets/operia-icon.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Operia — Convierte WhatsApp en un sistema operativo de ventas",
      },
      {
        name: "description",
        content:
          "Operia transforma conversaciones de WhatsApp en operaciones claras para equipos. Detecta, prioriza y ejecuta cada pedido sin perder control.",
      },
      {
        property: "og:title",
        content: "Operia — Sistema operativo para ventas por WhatsApp",
      },
      {
        property: "og:description",
        content:
          "Estructura, asigna, prioriza y ejecuta cada pedido. Plataforma operativa con estándar empresarial.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Operia">
            <img src={operiaIcon} alt="" className="h-7 w-7 rounded-full" />
            <img
              src={operiaLogo}
              alt="Operia"
              className="h-[16px] w-auto object-contain"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#problema" className="hover:text-foreground transition-colors">Problema</a>
            <a href="#solucion" className="hover:text-foreground transition-colors">Solución</a>
            <a href="#ejecucion" className="hover:text-foreground transition-colors">Ejecución</a>
            <a href="#enterprise" className="hover:text-foreground transition-colors">Enterprise</a>
            <a href="#precios" className="hover:text-foreground transition-colors">Precios</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
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
            <span>Sistema operativo para ventas conversacionales</span>
          </div>
          <h1 className="text-[42px] md:text-[60px] leading-[1.04] font-semibold tracking-tight">
            Convierte WhatsApp en un{" "}
            <span className="bg-foreground text-background px-2 rounded-md">
              sistema operativo
            </span>{" "}
            de ventas.
          </h1>
          <p className="mt-6 text-[16px] md:text-[18px] text-muted-foreground leading-relaxed max-w-2xl">
            Operia transforma conversaciones en operaciones claras para equipos.
            Detecta, prioriza y ejecuta cada pedido sin perder control.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-[14px]">
              <a href="#contacto">
                Solicitar demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 px-5 text-[14px]"
            >
              <Link to="/login">Probar plataforma</Link>
            </Button>
          </div>
          <p className="mt-6 text-[12.5px] text-muted-foreground">
            Implementación guiada · API-first · Seguridad empresarial
          </p>
        </div>

        {/* Proof bar */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Metric value="+32%" label="Más pedidos cerrados en 30 días" />
          <Metric value="−78%" label="Pedidos sin seguimiento" />
          <Metric value="0" label="Pedidos perdidos en operación diaria" />
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
            <h2 className="text-[30px] md:text-[42px] leading-[1.06] font-semibold tracking-tight">
              WhatsApp no fue hecho para operar negocios.
            </h2>
            <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-md">
              Es un canal de mensajería, no una plataforma operativa. A medida
              que el volumen crece, la operación se fragmenta y el riesgo se
              acumula en silencio.
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            <ProblemItem
              title="Pedidos que se pierden"
              detail="Mensajes que nunca se responden. Clientes que se van sin que el equipo lo note."
            />
            <ProblemItem
              title="Cobros sin ejecutar"
              detail="Anticipos olvidados, confirmaciones a medias, dinero que nunca entra."
            />
            <ProblemItem
              title="Equipos descoordinados"
              detail="Cada agente con su propio teléfono y criterio. Cero visibilidad cruzada."
            />
            <ProblemItem
              title="Sin trazabilidad"
              detail="No se puede auditar lo que no se registra. La operación depende de la memoria."
            />
          </div>
        </div>

        {/* Costo real */}
        <div className="mt-14 md:mt-20 grid md:grid-cols-12 gap-6 items-stretch">
          <Card className="md:col-span-7 p-7 md:p-9 rounded-2xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-8 w-8 rounded-lg border border-border grid place-items-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-[15px] font-semibold tracking-tight">
                El costo real de operar en WhatsApp
              </div>
            </div>
            <ul className="space-y-3.5">
              <CostRow text="Cada mensaje no estructurado es un riesgo." />
              <CostRow text="Cada dato faltante retrasa la operación." />
              <CostRow text="Cada pedido sin seguimiento es dinero perdido." />
            </ul>
          </Card>
          <Card className="md:col-span-5 p-7 md:p-9 rounded-2xl bg-foreground text-background flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-[0.14em] text-background/60 mb-3">
              Resumen
            </div>
            <div className="text-[24px] md:text-[28px] leading-[1.15] font-semibold tracking-tight">
              Cada día sin control = ingresos que no recuperas.
            </div>
          </Card>
        </div>
      </section>

      {/* La solución */}
      <section
        id="solucion"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>La solución</SectionLabel>
        <h2 className="text-[30px] md:text-[44px] leading-[1.06] font-semibold tracking-tight max-w-3xl">
          Operia convierte WhatsApp en un sistema operable.
        </h2>
        <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-2xl">
          Una capa operativa sobre tus conversaciones. Estructura, asigna,
          prioriza y ejecuta.
        </p>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SolutionItem
            n="01"
            icon={Layers}
            title="Estructura pedidos"
            body="Cada mensaje se transforma en un pedido con campos, estado y trazabilidad."
          />
          <SolutionItem
            n="02"
            icon={Users}
            title="Asigna responsabilidades"
            body="Define quién hace qué, sin ambigüedad sobre dueños y siguientes pasos."
          />
          <SolutionItem
            n="03"
            icon={Zap}
            title="Prioriza automáticamente"
            body="El sistema detecta urgencia, riesgo y valor para enfocar al equipo en lo crítico."
          />
          <SolutionItem
            n="04"
            icon={LineChart}
            title="Visibilidad total"
            body="Tablero central con estado en tiempo real para toda la operación."
          />
        </div>
      </section>

      {/* Motor de ejecución */}
      <section
        id="ejecucion"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>Motor de ejecución</SectionLabel>
        <h2 className="text-[30px] md:text-[44px] leading-[1.06] font-semibold tracking-tight max-w-3xl">
          No solo organizas. Ejecutas.
        </h2>
        <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-2xl">
          Cada pedido llega con contexto completo y una acción recomendada. Tu
          equipo aprueba y ejecuta.
        </p>

        <div className="mt-12 grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <ExecRow
              icon={AlertCircle}
              title="Qué falta"
              body="Datos incompletos, anticipos pendientes, confirmaciones por cerrar."
            />
            <ExecRow
              icon={Gauge}
              title="Qué riesgo tiene"
              body="Clasificación automática por urgencia, valor y SLA."
            />
            <ExecRow
              icon={Target}
              title="Qué hacer"
              body="Una acción recomendada por pedido, lista para aprobar."
            />

            <Card className="mt-6 p-6 rounded-2xl bg-foreground text-background">
              <div className="text-[11px] uppercase tracking-[0.14em] text-background/60 mb-4">
                Ejecuta en un clic
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <ExecChip icon={CreditCard} label="Solicitar pago" />
                <ExecChip icon={Check} label="Confirmar pedido" />
                <ExecChip icon={CalendarClock} label="Agendar" />
                <ExecChip icon={ArrowUpRight} label="Escalar" />
              </div>
              <div className="mt-5 text-[13px] text-background/80">
                Menos decisiones. Más ejecución.
              </div>
            </Card>
          </div>

          {/* Mock plataforma */}
          <Card className="p-5 rounded-2xl bg-secondary/40">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Vista en plataforma
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">
                    M. López · #4821
                  </div>
                  <div className="text-[12.5px] text-muted-foreground truncate">
                    Pedido B2C · valor $1,800 · entrega +18h
                  </div>
                </div>
                <span className="text-[10.5px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-danger/10 text-danger/90 border border-danger/20 shrink-0">
                  P0 · Crítico
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-danger/90 font-medium">
                  Pago no confirmado
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">SLA en 18 h</span>
              </div>
            </div>

            <div className="flex justify-center text-muted-foreground my-3">
              <ArrowDown className="h-4 w-4" />
            </div>

            <div className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-4">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                Acción recomendada
              </div>
              <div className="text-[14px] font-semibold mb-2">
                Solicitar anticipo
              </div>
              <div className="text-[12.5px] text-foreground/80 italic leading-snug mb-3">
                "Hola María, para asegurar tu pedido del viernes te compartimos
                los datos para el anticipo de $1,800. Confirmamos al recibirlo."
              </div>
              <Button size="sm" className="w-full h-9">
                <Send className="h-3.5 w-3.5" /> Aprobar y enviar
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Caso real */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Caso real</SectionLabel>
        <h2 className="text-[28px] md:text-[40px] leading-[1.06] font-semibold tracking-tight mb-3 max-w-2xl">
          De conversación a operación, en segundos.
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mb-12">
          El impacto operativo, en números reales de equipos que migraron a
          Operia.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 md:p-7 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Antes
              </div>
              <span className="text-[10.5px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-danger/10 text-danger/90 border border-danger/20">
                Sin control
              </span>
            </div>
            <ul className="space-y-3">
              <CompareRow label="Mensajes diarios" value="120" tone="muted" />
              <CompareRow label="Sin respuesta" value="30%" tone="danger" />
              <CompareRow
                label="Control de pagos"
                value="Inexistente"
                tone="danger"
              />
            </ul>
          </Card>

          <Card className="p-6 md:p-7 rounded-2xl border-foreground/30 bg-foreground/[0.02]">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Después con Operia
              </div>
              <span className="text-[10.5px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-foreground text-background">
                Operación bajo control
              </span>
            </div>
            <ul className="space-y-3">
              <CompareRow
                label="Pedidos registrados"
                value="100%"
                tone="positive"
              />
              <CompareRow
                label="Con anticipo confirmado"
                value="90%"
                tone="positive"
              />
              <CompareRow
                label="Tablero central para el equipo"
                value="1"
                tone="positive"
              />
            </ul>
          </Card>
        </div>
      </section>

      {/* Control para empresas */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Control para empresas</SectionLabel>
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <h2 className="text-[30px] md:text-[42px] leading-[1.06] font-semibold tracking-tight">
              Control y visibilidad total.
            </h2>
            <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-md">
              Cada acción, cada pedido y cada usuario auditable desde un único
              lugar. Sin zonas oscuras en la operación.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[12px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Tus datos siempre privados y organizados.
            </div>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-3">
            <ControlItem
              icon={History}
              title="Historial de acciones"
              body="Registro completo de cada cambio, mensaje y decisión."
            />
            <ControlItem
              icon={Users}
              title="Trazabilidad por usuario"
              body="Quién hizo qué, cuándo y por qué. Responsabilidad clara."
            />
            <ControlItem
              icon={ListChecks}
              title="Control de pedidos"
              body="Estado, dueño y siguiente acción visibles para cada pedido."
            />
            <ControlItem
              icon={Layers}
              title="Información centralizada"
              body="Clientes, conversaciones y métricas en una sola fuente de verdad."
            />
          </div>
        </div>
      </section>

      {/* Inteligencia operativa */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Inteligencia operativa</SectionLabel>
        <h2 className="text-[28px] md:text-[40px] leading-[1.06] font-semibold tracking-tight mb-3 max-w-2xl">
          Operia no solo organiza. Decide contigo.
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mb-12">
          El motor analiza cada pedido y propone la siguiente acción. Tu equipo
          aprueba.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Step
            n="01"
            icon={AlertCircle}
            title="Detecta lo que falta"
            body="Identifica datos incompletos antes de que se conviertan en pérdidas."
          />
          <Step
            n="02"
            icon={Zap}
            title="Prioriza por urgencia, valor y SLA"
            body="Clasificación automática. Sin reuniones para decidir qué hacer primero."
          />
          <Step
            n="03"
            icon={Send}
            title="Ejecuta con precisión"
            body="Una acción por pedido, una plantilla por contexto. Aprobación y envío en un clic."
          />
        </div>
      </section>

      {/* Enterprise stack */}
      <section
        id="enterprise"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>Enterprise stack</SectionLabel>
        <h2 className="text-[30px] md:text-[42px] leading-[1.06] font-semibold tracking-tight max-w-3xl">
          Infraestructura empresarial.
        </h2>
        <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-2xl">
          Una base técnica abierta y auditable. Conecta con tu stack y cumple
          con los requisitos de seguridad de tu organización.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <Card className="p-6 md:p-7 rounded-2xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-8 w-8 rounded-lg border border-border grid place-items-center">
                <Network className="h-4 w-4" />
              </div>
              <div className="text-[15px] font-semibold tracking-tight">
                Infraestructura
              </div>
            </div>
            <ul className="divide-y divide-border">
              <PillarItem
                icon={Plug}
                title="API-first architecture"
                body="Cada capacidad expuesta como API documentada."
              />
              <PillarItem
                icon={Webhook}
                title="Webhooks en tiempo real"
                body="Eventos de pedidos, mensajes y estados emitidos al instante."
              />
              <PillarItem
                icon={MessagesSquare}
                title="Integración WhatsApp Cloud API"
                body="Conexión nativa y oficial, sin intermediarios."
              />
              <PillarItem
                icon={Database}
                title="Exportación de datos"
                body="Acceso completo vía CSV o API. Tus datos siempre portables."
              />
            </ul>
          </Card>

          <Card className="p-6 md:p-7 rounded-2xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-8 w-8 rounded-lg border border-border grid place-items-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-[15px] font-semibold tracking-tight">
                Seguridad y control
              </div>
            </div>
            <ul className="divide-y divide-border">
              <PillarItem
                icon={KeyRound}
                title="Roles y permisos"
                body="Acceso granular por función, equipo y nivel."
              />
              <PillarItem
                icon={ScrollText}
                title="Auditoría completa"
                body="Cada acción registrada, atribuible y consultable."
              />
              <PillarItem
                icon={Lock}
                title="Datos encriptados"
                body="Cifrado en tránsito y en reposo bajo estándares de la industria."
              />
              <PillarItem
                icon={FileLock2}
                title="Cumplimiento de privacidad"
                body="Aislamiento por organización y prácticas alineadas a normativa."
              />
            </ul>
          </Card>
        </div>
      </section>

      {/* Para quién es */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Para quién es</SectionLabel>
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <h2 className="text-[30px] md:text-[42px] leading-[1.06] font-semibold tracking-tight">
              Hecho para equipos con volumen.
            </h2>
            <p className="mt-5 text-[15px] text-muted-foreground leading-relaxed max-w-md">
              Operia rinde donde el caos empieza a costar dinero: cuando los
              chats dejan de ser manejables a mano.
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-3">
            <FitItem icon={TrendingUp} text="+30 pedidos diarios" />
            <FitItem icon={Users} text="+2 personas operando WhatsApp" />
            <FitItem
              icon={AlertCircle}
              text="Problemas de seguimiento o cobro"
            />
            <FitItem icon={ShieldCheck} text="Necesidad de control y auditoría" />
          </div>
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
            "Salud",
            "Logística",
            "Educación",
            "Inmobiliaria",
            "B2B",
          ].map((x) => (
            <Card key={x} className="p-4 rounded-xl text-[13.5px] font-medium">
              {x}
            </Card>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section
        id="precios"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>Precios</SectionLabel>
        <h2 className="text-[28px] md:text-[40px] leading-[1.06] font-semibold tracking-tight mb-3 max-w-2xl">
          Planes por etapa de operación.
        </h2>
        <p className="text-muted-foreground text-[14.5px] mb-10 max-w-xl">
          Sin permanencia. Migración asistida desde cualquier plan.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Plan
            name="Inicial"
            price="$499"
            tagline="Para empezar a organizar tus pedidos."
            features={["50 pedidos / mes", "Inbox unificado", "1 usuario"]}
          />
          <Plan
            name="Pro"
            highlighted
            price="$999"
            tagline="Para negocios que reciben pedidos todos los días."
            features={[
              "Pedidos ilimitados",
              "CRM + notas",
              "Acciones sugeridas",
              "Hasta 3 usuarios",
            ]}
          />
          <Plan
            name="Negocio"
            price="$1,999"
            tagline="Para equipos que no pueden perder pedidos ni dinero."
            features={[
              "Todo lo de Pro",
              "Usuarios ilimitados",
              "WhatsApp Cloud API",
              "Soporte prioritario",
            ]}
          />
          <Plan
            name="Enterprise"
            price="Desde $9,900"
            tagline="Operaciones críticas con requerimientos a medida."
            features={[
              "Implementación personalizada",
              "Integraciones a medida",
              "SLA dedicado",
              "Automatización avanzada",
              "Soporte directo",
            ]}
            ctaLabel="Solicitar demo"
            ctaHref="#contacto"
            enterprise
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
            q="¿Cómo manejan seguridad y roles?"
            a="Roles granulares, registro de auditoría y separación de datos por organización. Infraestructura cifrada en tránsito y en reposo."
          />
          <Faq
            q="¿Qué tan rápido se implementa?"
            a="Operación productiva en menos de un día. Para equipos grandes ofrecemos onboarding guiado y plantillas por industria."
          />
          <Faq
            q="¿Se integra con CRM y ERP?"
            a="Exponemos API y webhooks. Integramos con CRM, ERP y plataformas de pago utilizadas por equipos de operación."
          />
        </div>
      </section>

      {/* CTA final */}
      <section
        id="contacto"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <Card className="p-8 md:p-14 rounded-2xl text-center">
          <h2 className="text-[28px] md:text-[40px] font-semibold tracking-tight max-w-2xl mx-auto leading-[1.08]">
            La operación de tu negocio merece una plataforma, no una libreta.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-[14.5px]">
            Agenda una demo de 20 minutos. Te mostramos cómo se vería con tu
            operación.
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
            Respuesta en menos de 24 h hábiles
          </p>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} Operia. Sistema operativo para ventas
        conversacionales.
      </footer>
    </div>
  );
}

/* ---------- Helpers ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium mb-4">
      {children}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="text-[26px] font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[12.5px] text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}

function ProblemItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="bg-background p-6 md:p-7">
      <div className="flex items-center gap-2.5 mb-2">
        <AlertCircle className="h-4 w-4 text-foreground/70" />
        <div className="text-[14.5px] font-semibold tracking-tight">
          {title}
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        {detail}
      </p>
    </div>
  );
}

function CostRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="h-5 w-5 rounded-full border border-border grid place-items-center shrink-0 mt-0.5">
        <div className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
      </div>
      <div className="text-[14px] text-foreground/85 leading-relaxed">
        {text}
      </div>
    </li>
  );
}

function SolutionItem({
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
    <Card className="p-6 rounded-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="h-9 w-9 rounded-lg border border-border grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
          {n}
        </span>
      </div>
      <div className="text-[15.5px] font-semibold tracking-tight mb-1.5">
        {title}
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        {body}
      </p>
    </Card>
  );
}

function ExecRow({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg border border-border grid place-items-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[14.5px] font-semibold tracking-tight mb-1">
            {title}
          </div>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ExecChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-background/15 bg-background/5 px-3 py-2.5 text-[12.5px] font-medium">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function CompareRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "danger" | "positive";
}) {
  const valueClass =
    tone === "danger"
      ? "text-danger"
      : tone === "positive"
        ? "text-foreground"
        : "text-foreground/80";
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-[13.5px] text-muted-foreground">{label}</span>
      <span
        className={`text-[18px] font-semibold tracking-tight tabular-nums ${valueClass}`}
      >
        {value}
      </span>
    </li>
  );
}

function ControlItem({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg border border-border grid place-items-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[14.5px] font-semibold tracking-tight mb-1">
            {title}
          </div>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed">
            {body}
          </p>
        </div>
      </div>
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
      <p className="text-[13.5px] text-muted-foreground leading-relaxed">
        {body}
      </p>
    </Card>
  );
}

function PillarItem({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="h-7 w-7 rounded-md border border-border grid place-items-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-foreground/70" />
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold tracking-tight">
          {title}
        </div>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-0.5">
          {body}
        </p>
      </div>
    </li>
  );
}

function FitItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <Card className="p-5 rounded-xl flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg border border-border grid place-items-center shrink-0">
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
      <div className="text-[14px] font-medium tracking-tight">{text}</div>
    </Card>
  );
}

function Plan({
  name,
  price,
  tagline,
  features,
  highlighted,
  enterprise,
  ctaLabel,
  ctaHref,
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  enterprise?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const dark = highlighted;
  return (
    <Card
      className={`p-6 rounded-2xl flex flex-col ${
        dark ? "border-foreground bg-foreground text-background" : ""
      } ${enterprise ? "border-foreground/40" : ""}`}
    >
      <div
        className={`text-[11px] uppercase tracking-[0.14em] mb-2 ${
          dark ? "text-background/70" : "text-muted-foreground"
        }`}
      >
        {name}
        {highlighted && " · Recomendado"}
        {enterprise && " · A medida"}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[28px] md:text-[32px] font-semibold tracking-tight tabular-nums">
          {price}
        </span>
        {!enterprise && (
          <span
            className={`text-[12.5px] ${
              dark ? "text-background/70" : "text-muted-foreground"
            }`}
          >
            MXN / mes
          </span>
        )}
      </div>
      <p
        className={`text-[13px] mb-5 ${
          dark ? "text-background/80" : "text-muted-foreground"
        }`}
      >
        {tagline}
      </p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13.5px]">
            <Check
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                dark ? "text-background" : "text-foreground/70"
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {ctaHref ? (
        <Button asChild className="h-10 w-full">
          <a href={ctaHref}>{ctaLabel ?? "Comenzar"}</a>
        </Button>
      ) : (
        <Button
          asChild
          variant={dark ? "secondary" : "default"}
          className="h-10 w-full"
        >
          <Link to="/login">{ctaLabel ?? "Comenzar"}</Link>
        </Button>
      )}
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
