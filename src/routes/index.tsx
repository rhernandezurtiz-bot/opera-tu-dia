import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DemoRequestModal } from "@/components/DemoRequestModal";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  ArrowDown,
  MessagesSquare,
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
  Brain,
} from "lucide-react";
import operiaLogo from "@/assets/operia-logo.png";
import operiaIcon from "@/assets/operia-icon.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Operia — Centraliza, controla y ejecuta tus ventas de WhatsApp",
      },
      {
        name: "description",
        content:
          "Operia convierte conversaciones de WhatsApp en operaciones claras para equipos. Evita pérdidas, mejora tiempos de respuesta y escala sin caos.",
      },
      {
        property: "og:title",
        content: "Operia — Infraestructura operativa para ventas por WhatsApp",
      },
      {
        property: "og:description",
        content:
          "Una capa operativa enterprise sobre WhatsApp. Estructura, asigna, prioriza y ejecuta cada pedido con control total.",
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
            <a href="#plataforma" className="hover:text-foreground transition-colors">Plataforma</a>
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

      {/* 1. HERO */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Infraestructura operativa para ventas conversacionales</span>
          </div>
          <h1 className="text-[42px] md:text-[60px] leading-[1.04] font-semibold tracking-tight">
            Centraliza, controla y{" "}
            <span className="bg-foreground text-background px-2 rounded-md">
              ejecuta
            </span>{" "}
            tus ventas de WhatsApp.
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
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 px-5 text-[14px]"
            >
              <Link to="/login">Explorar plataforma</Link>
            </Button>
          </div>
          <p className="mt-6 text-[12.5px] text-muted-foreground">
            Implementación guiada · Roles y auditoría · Listo en menos de 1 día
          </p>
        </div>

        {/* Métricas cualitativas */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric value="Menos pérdidas" label="Cierra pedidos que hoy se caen sin seguimiento." />
          <Metric value="Más velocidad" label="Respuestas estructuradas en lugar de improvisadas." />
          <Metric value="Cobranza clara" label="Anticipos y pagos con trazabilidad por pedido." />
          <Metric value="Listo en 1 día" label="Implementación guiada por nuestro equipo." />
        </div>
      </section>

      {/* 2. PROBLEMA */}
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
              title="Conversaciones perdidas"
              detail="Mensajes sin respuesta. Clientes que se van sin que el equipo lo note."
            />
            <ProblemItem
              title="Pedidos sin seguimiento"
              detail="Sin estado, sin responsable, sin siguiente paso definido."
            />
            <ProblemItem
              title="Equipos descoordinados"
              detail="Cada agente con su criterio. Cero visibilidad cruzada."
            />
            <ProblemItem
              title="Falta de visibilidad"
              detail="No hay métricas, no hay control, no hay forma de auditar."
            />
          </div>
        </div>
      </section>

      {/* 3. SOLUCIÓN */}
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
          prioriza y coordina para que el equipo trabaje sobre datos, no chats.
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
            title="Asigna responsables"
            body="Define quién hace qué, sin ambigüedad sobre dueños y siguientes pasos."
          />
          <SolutionItem
            n="03"
            icon={Zap}
            title="Prioriza por urgencia y riesgo"
            body="El motor enfoca al equipo en lo que mueve la operación."
          />
          <SolutionItem
            n="04"
            icon={LineChart}
            title="Dashboard en tiempo real"
            body="Estado de cada pedido, agente y SLA en una sola vista."
          />
        </div>
      </section>

      {/* 3.5 CONEXIÓN WHATSAPP */}
      <section
        id="whatsapp"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>Integración</SectionLabel>
        <h2 className="text-[30px] md:text-[44px] leading-[1.06] font-semibold tracking-tight max-w-3xl">
          Conectado directamente con WhatsApp
        </h2>
        <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-2xl">
          Operia se adapta a cómo ya trabajas. Puedes empezar en segundos o
          integrarlo a nivel empresa.
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <Card className="p-6 rounded-2xl flex flex-col h-full">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
              Opción 1 · Inmediato
            </div>
            <div className="text-[17px] font-semibold tracking-tight mb-2">
              Sin integración
            </div>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Pega cualquier mensaje de WhatsApp y Operia lo convierte en un
              pedido estructurado al instante. Ideal para empezar sin
              configuración.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl flex flex-col h-full">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
              Opción 2 · Automático
            </div>
            <div className="text-[17px] font-semibold tracking-tight mb-2">
              Conexión automática
            </div>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Conecta WhatsApp Cloud API y Operia recibe, organiza y procesa
              mensajes automáticamente en tiempo real.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl flex flex-col h-full border-foreground/40">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
              Opción 3 · Enterprise
            </div>
            <div className="text-[17px] font-semibold tracking-tight mb-2">
              Integración enterprise
            </div>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Integración con CRM, ERP y sistemas internos vía API y webhooks.
              Diseñado para operaciones de alto volumen.
            </p>
          </Card>
        </div>

        <p className="mt-10 text-[14.5px] md:text-[15px] text-foreground/80 font-medium">
          Empieza manual. Escala automático.
        </p>
      </section>

      {/* 4. MOMENTO WOW */}
      <section
        id="plataforma"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <SectionLabel>Momento wow</SectionLabel>
        <h2 className="text-[30px] md:text-[44px] leading-[1.06] font-semibold tracking-tight max-w-3xl">
          Así se ve operar con Operia.
        </h2>
        <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed max-w-2xl">
          De mensaje a pedido estructurado a acción ejecutable. En segundos.
        </p>

        <div className="mt-12 grid lg:grid-cols-2 gap-6 items-start">
          {/* Mock: mensaje → pedido → acción */}
          <Card className="p-5 rounded-2xl bg-secondary/40">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
              1. Mensaje del cliente
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-[13px] text-foreground/80 italic leading-relaxed">
                "Hola, quiero un pastel mañana para 20 personas."
              </div>
              <div className="mt-2 text-[11.5px] text-muted-foreground">
                M. López · WhatsApp · hace 2 min
              </div>
            </div>

            <div className="flex justify-center text-muted-foreground my-3">
              <ArrowDown className="h-4 w-4" />
            </div>

            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
              2. Pedido estructurado
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-[13px]">
              <FieldRow k="Cliente" v="M. López" />
              <FieldRow k="Fecha" v="Mañana" />
              <FieldRow k="Producto" v="Pastel · 20 personas" />
              <FieldRow k="Datos faltantes" v="Sabor · Hora · Anticipo" warn />
            </div>

            <div className="flex justify-center text-muted-foreground my-3">
              <ArrowDown className="h-4 w-4" />
            </div>

            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
              3. Acción recomendada
            </div>
            <div className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-4">
              <div className="text-[14px] font-semibold mb-2">
                Solicitar anticipo
              </div>
              <div className="text-[12.5px] text-foreground/80 italic leading-snug mb-3">
                "Hola María, para asegurar tu pedido te compartimos los datos
                para el anticipo. Confirmamos al recibirlo."
              </div>
              <Button size="sm" className="w-full h-9">
                <Send className="h-3.5 w-3.5" /> Aprobar y enviar
              </Button>
            </div>
          </Card>

          {/* Lateral: qué hace el motor */}
          <div className="space-y-3">
            <ExecRow
              icon={AlertCircle}
              title="Detecta lo que falta"
              body="Datos incompletos, anticipos pendientes, confirmaciones por cerrar."
            />
            <ExecRow
              icon={Gauge}
              title="Clasifica el riesgo"
              body="Urgencia, valor del pedido y SLA evaluados de forma automática."
            />
            <ExecRow
              icon={Target}
              title="Propone la siguiente acción"
              body="Una recomendación clara por pedido, lista para que el equipo apruebe."
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
                Menos decisiones manuales. Más ejecución medible.
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. CAPA OPERATIVA */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Capa operativa</SectionLabel>
        <h2 className="text-[28px] md:text-[40px] leading-[1.06] font-semibold tracking-tight mb-3 max-w-3xl">
          Una sola superficie operativa para todo el ciclo de venta.
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mb-12">
          Captura, decisión y ejecución conectadas en un mismo flujo.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Step
            n="01"
            icon={MessagesSquare}
            title="Captura"
            body="Mensajes desde WhatsApp Cloud API o ingestados vía API. Una bandeja central."
          />
          <Step
            n="02"
            icon={Brain}
            title="Decisión"
            body="Motor que prioriza, detecta faltantes y propone el siguiente paso óptimo."
          />
          <Step
            n="03"
            icon={Send}
            title="Ejecución"
            body="Cobros, confirmaciones y entregas ejecutadas con plantilla y trazabilidad."
          />
        </div>
      </section>

      {/* 6. COSTO DE NO USAR SISTEMA */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>El costo de no operar con sistema</SectionLabel>
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <h2 className="text-[30px] md:text-[42px] leading-[1.06] font-semibold tracking-tight">
              Cada día sin sistema, hay ingresos que no recuperas.
            </h2>
            <p className="mt-5 text-[15px] text-muted-foreground leading-relaxed max-w-md">
              Operia no es un gasto. Es infraestructura para recuperar
              ingresos que hoy se pierden silenciosamente en la operación.
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-3 gap-3">
            <CostCard
              title="Pedidos sin cierre"
              label="Conversaciones que avanzan, pero nunca terminan en venta confirmada."
            />
            <CostCard
              title="Retrabajo y errores"
              label="Información incompleta que genera retrasos y reclamos del cliente."
            />
            <CostCard
              title="Cobros olvidados"
              label="Anticipos y saldos pendientes que no se ejecutan a tiempo."
            />
          </div>
        </div>

        <Card className="mt-10 p-7 md:p-9 rounded-2xl bg-foreground text-background flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg border border-background/20 grid place-items-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-[18px] md:text-[22px] leading-[1.2] font-semibold tracking-tight max-w-2xl">
              Operia no es un gasto. Es infraestructura para recuperar
              ingresos.
            </div>
          </div>
          <Button asChild variant="secondary" className="h-10 shrink-0">
            <a href="#contacto">Solicitar demo</a>
          </Button>
        </Card>
      </section>

      {/* 7. CAPACIDADES */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Capacidades de la plataforma</SectionLabel>
        <h2 className="text-[28px] md:text-[40px] leading-[1.06] font-semibold tracking-tight mb-10 max-w-2xl">
          Todo lo que tu operación necesita, en una sola plataforma.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ControlItem
            icon={MessagesSquare}
            title="Centralización de conversaciones"
            body="Toda la actividad de WhatsApp en una bandeja única auditable."
          />
          <ControlItem
            icon={Layers}
            title="Gestión estructurada de pedidos"
            body="Cada pedido con campos, estado, dueño y siguiente acción."
          />
          <ControlItem
            icon={Users}
            title="Asignación y seguimiento"
            body="Reparto de carga, escalamientos y supervisión por equipo."
          />
          <ControlItem
            icon={AlertTriangle}
            title="Detección de riesgos operativos"
            body="Alertas tempranas sobre SLA, datos faltantes y cobros pendientes."
          />
          <ControlItem
            icon={History}
            title="Historial por cliente"
            body="Contexto completo: conversaciones, pedidos y comportamiento de pago."
          />
          <ControlItem
            icon={Zap}
            title="Acciones automatizadas"
            body="Recordatorios, cobros y confirmaciones ejecutados con plantilla."
          />
        </div>
      </section>

      {/* 8. CONTROL Y VISIBILIDAD */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Control y visibilidad total</SectionLabel>
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
              Infraestructura segura, con datos cifrados en tránsito y reposo.
            </div>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-3">
            <ControlItem
              icon={History}
              title="Historial de acciones"
              body="Auditoría completa de cada cambio, mensaje y decisión."
            />
            <ControlItem
              icon={Users}
              title="Trazabilidad por usuario"
              body="Quién hizo qué, cuándo y por qué. Responsabilidad clara."
            />
            <ControlItem
              icon={ListChecks}
              title="Control de pedidos en tiempo real"
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

      {/* 9. INTELIGENCIA OPERATIVA */}
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
            title="Prioriza por urgencia"
            body="Clasificación automática por riesgo, valor y SLA. Sin reuniones para decidir."
          />
          <Step
            n="03"
            icon={Send}
            title="Ejecuta con precisión"
            body="Una acción por pedido, lista para aprobar y enviar en un clic."
          />
        </div>
      </section>

      {/* 10. INDUSTRIAS */}
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

      {/* 11. SOCIAL PROOF */}
      <section className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border">
        <SectionLabel>Social proof</SectionLabel>
        <h2 className="text-[28px] md:text-[40px] leading-[1.06] font-semibold tracking-tight mb-12 max-w-2xl">
          Equipos operando con menos fricción y más control.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Quote
            kpi="Operaciones centralizadas"
            text="Pasamos de tres teléfonos y una hoja de cálculo a una sola plataforma. Hoy todo el equipo ve lo mismo, en tiempo real."
            author="Dirección de Operaciones · Retail D2C"
          />
          <Quote
            kpi="Errores eliminados"
            text="Los pedidos sin anticipo y los olvidos desaparecieron. La operación dejó de depender de la memoria de cada agente."
            author="Gerencia Comercial · Food & Beverage"
          />
          <Quote
            kpi="Tiempos de respuesta"
            text="Bajamos el tiempo promedio de respuesta a menos de la mitad. Cada pedido llega con su acción recomendada."
            author="CEO · Servicios técnicos"
          />
        </div>
      </section>

      {/* 12. ENTERPRISE STACK */}
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

      {/* 13. PRECIOS */}
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
            price="A medida"
            tagline="Operaciones críticas con requerimientos a medida."
            features={[
              "Implementación a medida",
              "Integraciones (ERP, CRM, pagos)",
              "SLA dedicado",
              "Soporte prioritario",
            ]}
            ctaLabel="Solicitar demo"
            ctaHref="#contacto"
            enterprise
          />
        </div>
      </section>

      {/* 14. FAQ */}
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
            q="¿Cómo se integra con WhatsApp Cloud API?"
            a="Conexión nativa y oficial con WhatsApp Cloud API. Sin intermediarios y sin cambiar tu número. Migración asistida por nuestro equipo."
          />
          <Faq
            q="¿Cómo manejan seguridad y roles?"
            a="Roles granulares por función y equipo, registro de auditoría inmutable y aislamiento de datos por organización. Cifrado en tránsito y en reposo."
          />
          <Faq
            q="¿Tiempo de implementación?"
            a="Operación productiva en menos de un día. Para equipos grandes ofrecemos onboarding guiado y plantillas por industria."
          />
          <Faq
            q="¿Integración con CRM y ERP?"
            a="API-first y webhooks en tiempo real. Integramos con CRM, ERP y plataformas de pago utilizadas por equipos de operación."
          />
        </div>
      </section>

      {/* 15. CTA FINAL */}
      <section
        id="contacto"
        className="px-5 md:px-8 max-w-6xl mx-auto py-16 md:py-24 border-t border-border"
      >
        <Card className="p-8 md:p-14 rounded-2xl text-center">
          <h2 className="text-[28px] md:text-[40px] font-semibold tracking-tight max-w-2xl mx-auto leading-[1.08]">
            Tu operación ya es compleja. Tu sistema no debería serlo.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-[14.5px] leading-relaxed">
            Agenda una demo y te mostramos cómo se vería Operia funcionando con
            tu operación.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <a href="mailto:hola@operia.app?subject=Solicitar%20demo%20Operia">
                Solicitar demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 px-5">
              <Link to="/login">Ver demo de plataforma</Link>
            </Button>
          </div>
          <p className="text-[12px] text-muted-foreground mt-5">
            Contacto en menos de 24 h hábiles
          </p>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[12.5px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img src={operiaIcon} alt="" className="h-5 w-5 rounded-full" />
            <span className="text-foreground font-medium">Operia</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              Plataforma operativa para ventas conversacionales
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href="mailto:hola@operia.app"
              className="hover:text-foreground transition-colors"
            >
              hola@operia.app
            </a>
            <span>© {new Date().getFullYear()} Operia</span>
          </div>
        </div>
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
    <Card className="p-5 rounded-xl h-full">
      <div className="text-[18px] md:text-[19px] font-semibold tracking-tight">
        {value}
      </div>
      <div className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">
        {label}
      </div>
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

function FieldRow({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
        {k}
      </span>
      <span
        className={`text-[13px] font-medium tracking-tight ${warn ? "text-danger" : "text-foreground"}`}
      >
        {v}
      </span>
    </div>
  );
}

function CostCard({ title, label }: { title: string; label: string }) {
  return (
    <Card className="p-6 rounded-2xl h-full">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-foreground/70" />
        <div className="text-[14.5px] font-semibold tracking-tight">
          {title}
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        {label}
      </p>
    </Card>
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

function Quote({
  kpi,
  text,
  author,
}: {
  kpi: string;
  text: string;
  author: string;
}) {
  return (
    <Card className="p-6 rounded-2xl flex flex-col h-full">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
        {kpi}
      </div>
      <p className="text-[14px] text-foreground/90 leading-relaxed flex-1">
        "{text}"
      </p>
      <div className="mt-5 pt-4 border-t border-border text-[12px] text-muted-foreground">
        {author}
      </div>
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
