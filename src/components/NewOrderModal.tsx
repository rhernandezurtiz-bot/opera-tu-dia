import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Save, Copy, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useUI, buildMissingMessage } from "@/lib/ui-store";
import { parseWhatsapp, useOperia, typeLabels, type Order } from "@/lib/operia-store";
import { useUsageLimits } from "@/lib/usage-limits";
import { RiskBadge } from "./AppShell";
import { Link } from "@tanstack/react-router";
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

      {draft.faltantes.length > 0 && (
        <div className="p-4 rounded-2xl bg-warning/15 border border-warning/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium text-sm">Faltan datos</span>
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
          <Button onClick={onCopy} variant="secondary" className="rounded-full">
            <Copy className="h-4 w-4 mr-2" /> Copiar mensaje para datos faltantes
          </Button>
        )}
        <Button onClick={onBack} variant="ghost" className="rounded-full">Volver</Button>
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
