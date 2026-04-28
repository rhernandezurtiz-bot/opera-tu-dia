import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, SectionHeading, Eyebrow } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { useLearningEngine, useLearningMetrics, buildImprovementHints } from "@/lib/learning-engine";
import { useOperia } from "@/lib/operia-store";
import { Sparkles, TrendingUp, TrendingDown, Brain, MessageCircle, Trophy, Target, Wallet } from "lucide-react";
import { DECISION_LABELS } from "@/lib/auto-reply";
import { money } from "@/lib/ui-store";

export const Route = createFileRoute("/aprendizaje")({
  head: () => ({
    meta: [
      { title: "Aprendizaje — Operia" },
      { name: "description", content: "Operia aprende de cada conversación y mejora qué vender, cómo responder y cuándo cobrar." },
    ],
  }),
  component: AprendizajePage,
});

function AprendizajePage() {
  useLearningEngine();
  const m = useLearningMetrics();
  const logs = useOperia((s) => s.autoReplyLog);
  const hints = buildImprovementHints(m);

  const recentLogs = logs.slice(0, 8);

  return (
    <AppShell>
      <PageHeader
        title="Aprendizaje"
        subtitle="Operia analiza cada conversación y se ajusta sola para venderte más cada día."
      />

      {/* Métricas principales */}
      <section className="mb-8">
        <Eyebrow>📈 Resultados</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric
            icon={MessageCircle}
            value={m.totalConversaciones}
            label="Conversaciones"
            hint={`${m.totalCierres} con intento de cierre`}
          />
          <Metric
            icon={Target}
            value={`${(m.conversionGlobal * 100).toFixed(0)}%`}
            label="Tasa de conversión"
            hint={`${m.totalPagados} pagaron`}
            tone="success"
          />
          <Metric
            icon={Wallet}
            value={money(m.ingresosEstimados)}
            label="Ingresos generados"
            hint="Por respuestas automáticas"
          />
          <Metric
            icon={TrendingDown}
            value={m.totalRechazados}
            label="No cerraron"
            hint={`${m.totalPendientes} aún en curso`}
            tone="warning"
          />
        </div>
      </section>

      {/* Sugerencias de mejora */}
      {hints.length > 0 && (
        <section className="mb-8">
          <Eyebrow>✨ Lo que Operia aprendió</Eyebrow>
          <div className="space-y-2">
            {hints.map((h, i) => (
              <Card key={i} className="p-4 rounded-xl flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                  h.tipo === "producto_estrella"
                    ? "bg-success/10 text-success/90"
                    : h.tipo === "producto_debil" || h.tipo === "respuesta_floja"
                      ? "bg-warning/15 text-foreground/70"
                      : "bg-secondary text-muted-foreground"
                }`}>
                  {h.tipo === "producto_estrella" ? <Trophy className="h-4 w-4" />
                    : h.tipo === "producto_debil" ? <TrendingDown className="h-4 w-4" />
                      : h.tipo === "respuesta_floja" ? <MessageCircle className="h-4 w-4" />
                        : <Brain className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{h.titulo}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{h.detalle}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Productos más vendidos */}
      {m.productos.length > 0 && (
        <section className="mb-8">
          <SectionHeading
            title="Productos que más venden"
            subtitle="Operia los prioriza automáticamente al sugerir alternativas"
          />
          <div className="space-y-2">
            {m.productos.slice(0, 6).map((p) => {
              const conv = (p.conversion * 100).toFixed(0);
              const boost = p.weight > 1.1 ? "↑" : p.weight < 0.9 ? "↓" : "·";
              const boostClass = p.weight > 1.1 ? "text-success/90" : p.weight < 0.9 ? "text-warning" : "text-muted-foreground";
              return (
                <Card key={p.productoId} className="p-3.5 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{p.nombre}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {p.conversaciones} conversaciones · {p.pagados} pagaron · {money(p.ingresos)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[16px] font-semibold tabular-nums">{conv}%</div>
                      <div className={`text-[11px] ${boostClass}`}>
                        {boost} prioridad {p.weight.toFixed(1)}x
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${p.conversion >= 0.4 ? "bg-success/70" : p.conversion >= 0.15 ? "bg-foreground/60" : "bg-warning"}`}
                      style={{ width: `${Math.min(100, p.conversion * 100)}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Respuestas más efectivas */}
      {m.respuestas.length > 0 && (
        <section className="mb-8">
          <SectionHeading
            title="Respuestas más efectivas"
            subtitle="Tipo de mensaje vs % que terminó en pago"
          />
          <div className="grid sm:grid-cols-2 gap-2">
            {m.respuestas.filter((r) => r.enviadas > 0).map((r) => (
              <Card key={r.decision} className="p-3.5 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">
                      {DECISION_LABELS[r.decision as keyof typeof DECISION_LABELS] ?? r.decision}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {r.enviadas} enviadas · {r.pagadas} pagaron
                    </div>
                  </div>
                  <div className="text-[16px] font-semibold tabular-nums">
                    {(r.efectividad * 100).toFixed(0)}%
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Log reciente */}
      <section>
        <SectionHeading
          title="Conversaciones recientes"
          subtitle="Lo que detectó Operia y cómo terminó"
        />
        {recentLogs.length === 0 ? (
          <Card className="rounded-xl p-10 text-center border-dashed bg-secondary/30">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <div className="text-[14px] font-medium">Aún sin conversaciones</div>
            <div className="text-[12.5px] text-muted-foreground mt-1">
              En cuanto empiecen a llegar mensajes, Operia comenzará a aprender.
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((l) => {
              const tone =
                l.outcome === "pagado" ? "bg-success/10 border-success/25 text-success/90"
                : l.outcome === "rechazado" ? "bg-danger/8 border-danger/25 text-danger/90"
                : l.outcome === "no_pagado" ? "bg-warning/15 border-warning/30 text-foreground/70"
                : "bg-secondary border-border text-muted-foreground";
              const outcomeLabel =
                l.outcome === "pagado" ? "Pagó"
                : l.outcome === "rechazado" ? "Rechazó"
                : l.outcome === "no_pagado" ? "No pagó"
                : "Pendiente";
              return (
                <Card key={l.id} className="p-3.5 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">
                        {l.cliente} · {l.canal}
                        {l.productoDetectado && (
                          <span className="text-muted-foreground"> → {l.productoDetectado}</span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        "{l.recibido}"
                      </div>
                    </div>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full border tabular-nums shrink-0 ${tone}`}>
                      {outcomeLabel}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  hint,
  tone,
}: {
  icon: any;
  value: number | string;
  label: string;
  hint: string;
  tone?: "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? "bg-success/10 text-success/90"
      : tone === "warning"
        ? "bg-warning/15 text-foreground/70"
        : "bg-secondary text-foreground/70 border border-border";
  return (
    <Card className="p-4 rounded-xl">
      <div className={`h-8 w-8 rounded-lg grid place-items-center mb-3 ${styles}`}>
        <Icon className="h-[15px] w-[15px]" />
      </div>
      <div className="text-[24px] leading-none font-semibold tabular-nums">{value}</div>
      <div className="text-[12.5px] text-foreground/70 mt-2 font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
    </Card>
  );
}
