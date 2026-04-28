import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Save, Copy, Pencil, AlertTriangle, CheckCircle2, Wallet, MessageCircle } from "lucide-react";
import { useUI, buildMissingMessage } from "@/lib/ui-store";
import { parseWhatsapp, useOperia, typeLabels, type Order } from "@/lib/operia-store";
import { useCatalog } from "@/lib/catalog-store";
import { evaluateOrderDecision, DECISION_LABEL, DECISION_TONE, CLOSING_LABEL, type OrderDecision } from "@/lib/decision-engine";
import { useUsageLimits } from "@/lib/usage-limits";
import { RiskBadge } from "./AppShell";
import { toast } from "sonner";

const SAMPLE = `Hola! Soy Carolina, quisiera un pastel de chocolate para mañana a las 5pm. Te paso el anticipo hoy.`;

export function NewOrderModal() {
  const open = useUI((s) => s.newOrderOpen);
  const close = useUI((s) => s.closeNewOrder);
  const addOrder = useOperia((s) => s.addOrder);
  const navigate = useNavigate();
  const usage = useUsageLimits();
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<Order | null>(null);

  const reset = () => { setMsg(""); setDraft(null); };
  const handleClose = () => { reset(); close(); };

  const analizar = () => {
    if (!msg.trim()) { toast.error("Pega primero un mensaje"); return; }
    setDraft(parseWhatsapp(msg));
  };

  const guardar = () => {
    if (!draft) return;
    const check = usage.canCreateOrder();
    if (!check.ok) { toast.error(check.reason ?? "Límite alcanzado"); return; }
    addOrder(draft);
    toast.success("Pedido guardado");
    handleClose();
    navigate({ to: "/pedidos/$id", params: { id: draft.id } });
  };

  const editar = () => {
    if (!draft) return;
    const check = usage.canCreateOrder();
    if (!check.ok) { toast.error(check.reason ?? "Límite alcanzado"); return; }
    addOrder(draft);
    handleClose();
    navigate({ to: "/pedidos/$id", params: { id: draft.id } });
  };

  const copiarFaltantes = () => {
    if (!draft) return;
    navigator.clipboard.writeText(buildMissingMessage(draft.cliente, draft.faltantes));
    toast.success("Mensaje copiado");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogContent className="max-w-2xl rounded-xl p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Nuevo pedido desde WhatsApp</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">Pega el mensaje del cliente y Operia lo organiza por ti.</p>
        </div>

        {!draft ? (
          <div className="p-6 space-y-4">
            <Textarea
              autoFocus
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Pega aquí el mensaje del cliente…"
              className="min-h-40 rounded-2xl text-base resize-none"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <Button onClick={analizar} size="lg" className="rounded-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Analizar mensaje
              </Button>
              <Button variant="ghost" onClick={() => setMsg(SAMPLE)} className="rounded-full">
                Probar con ejemplo
              </Button>
            </div>
          </div>
        ) : (
          <PreviewPanel
            draft={draft}
            onBack={() => setDraft(null)}
            onSave={guardar}
            onEdit={editar}
            onCopy={copiarFaltantes}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PreviewPanel({ draft, onBack, onSave, onEdit, onCopy }: {
  draft: Order; onBack: () => void; onSave: () => void; onEdit: () => void; onCopy: () => void;
}) {
  const catalog = useCatalog((s) => s.items);
  const allOrders = useOperia((s) => s.orders);
  const decision = useMemo(
    () => evaluateOrderDecision({ order: draft, catalog, allOrders }),
    [draft, catalog, allOrders],
  );

  const fechaTxt = draft.fechaEntrega
    ? `${draft.fechaEntrega}${draft.horaEntrega ? ` a las ${draft.horaEntrega}` : ""}`
    : "fecha pendiente";

  return (
    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="font-medium">Detectamos un pedido</span>
        <RiskBadge level={draft.riesgo} />
      </div>

      <div className="rounded-2xl bg-secondary/60 p-4 space-y-2">
        <Row label="Cliente" value={draft.cliente || "—"} />
        <Row label="Tipo" value={typeLabels[draft.tipo]} />
        <Row label="Resumen" value={draft.descripcion || "—"} highlight />
        <Row label="Cuándo" value={fechaTxt} />
        {draft.direccion && <Row label="Dónde" value={draft.direccion} />}
        {draft.detalles && <Row label="Detalles" value={draft.detalles} />}
      </div>

      <DecisionPanel decision={decision} onCopyMessage={() => {
        navigator.clipboard.writeText(decision.customerMessage);
        toast.success("Mensaje copiado");
      }} />

      {draft.faltantes.length > 0 && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground uppercase tracking-wide">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Datos pendientes (interno)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {draft.faltantes.map((f) => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-card border border-warning/40">{f}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={onSave} size="lg" className="rounded-full flex-1 min-w-[140px]">
          <Save className="h-4 w-4 mr-2" /> Guardar pedido
        </Button>
        <Button onClick={onEdit} variant="secondary" className="rounded-full">
          <Pencil className="h-4 w-4 mr-2" /> Editar
        </Button>
        {draft.faltantes.length > 0 && (
          <Button onClick={onCopy} variant="ghost" className="rounded-full">
            <Copy className="h-4 w-4 mr-2" /> Copiar pedido de datos
          </Button>
        )}
        <Button onClick={onBack} variant="ghost" className="rounded-full">Volver</Button>
      </div>
    </div>
  );
}

const TONE_CLASS: Record<string, string> = {
  success: "bg-success/10 border-success/30 text-success",
  warning: "bg-warning/10 border-warning/30 text-warning-foreground",
  danger: "bg-danger/10 border-danger/30 text-danger",
  muted: "bg-muted border-border text-muted-foreground",
};

function DecisionPanel({ decision, onCopyMessage }: { decision: OrderDecision; onCopyMessage: () => void }) {
  const tone = DECISION_TONE[decision.decisionType];
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Decisión de Operia</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${TONE_CLASS[tone]}`}>
          {DECISION_LABEL[decision.decisionType]}
        </span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${decision.canCharge ? "bg-success/10 border-success/30 text-success" : "bg-muted border-border text-muted-foreground"}`}>
          {decision.canCharge ? "Puede cobrarse" : "No cobrar aún"}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="text-[12.5px] text-muted-foreground">
          <span className="font-medium text-foreground">Motivo:</span> {decision.reason}
        </div>
        {decision.alternatives.length > 0 && (
          <div>
            <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground mb-1">Alternativas sugeridas</div>
            <ul className="space-y-1">
              {decision.alternatives.map((a, i) => (
                <li key={i} className="text-sm bg-secondary/40 border border-border rounded-lg px-3 py-1.5">
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> Mensaje listo para enviar
          </div>
          <p className="text-[13.5px] whitespace-pre-wrap bg-background border border-border rounded-lg p-3">
            {decision.customerMessage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" className="rounded-full" onClick={onCopyMessage}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar mensaje
          </Button>
          {decision.canCharge && (
            <span className="inline-flex items-center text-[11.5px] text-success gap-1 px-2">
              <Wallet className="h-3.5 w-3.5" /> Listo para generar cobro
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-right ${highlight ? "font-medium text-base" : ""}`}>{value}</span>
    </div>
  );
}

