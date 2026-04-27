import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, RiskBadge } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sparkles, AlertTriangle, Copy, Save, RotateCcw } from "lucide-react";
import { parseWhatsapp, useOperia, type Order, type PaymentStatus } from "@/lib/operia-store";
import { toast } from "sonner";

export const Route = createFileRoute("/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo pedido — Operia" },
      { name: "description", content: "Pega un mensaje de WhatsApp y Operia extrae el pedido en segundos." },
    ],
  }),
  component: Nuevo,
});

const SAMPLE = `Hola! Soy Carolina, quisiera un pastel de chocolate para 25 personas para el sábado a las 6pm. Que diga Feliz cumpleaños Lucas. Mi número es +52 55 8765 4321. Te paso el anticipo hoy.`;

function Nuevo() {
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<Order | null>(null);
  const addOrder = useOperia((s) => s.addOrder);
  const navigate = useNavigate();

  const analizar = () => {
    if (!msg.trim()) { toast.error("Pega primero un mensaje"); return; }
    const parsed = parseWhatsapp(msg);
    setDraft(parsed);
    toast.success("Pedido analizado", { description: `${parsed.faltantes.length} campos por completar` });
  };

  const limpiar = () => { setMsg(""); setDraft(null); };

  const guardar = () => {
    if (!draft) return;
    addOrder(draft);
    toast.success("Pedido guardado");
    navigate({ to: "/pedidos/$id", params: { id: draft.id } });
  };

  const copiarFaltantes = () => {
    if (!draft) return;
    const faltantes = draft.faltantes.length
      ? draft.faltantes.map((f) => f.toLowerCase()).join(", ")
      : "algunos detalles";
    const text = `¡Hola${draft.cliente ? " " + draft.cliente : ""}! 😊 Para confirmar tu pedido solo me faltaría: ${faltantes}. ¿Me lo puedes compartir por favor? ¡Gracias!`;
    navigator.clipboard.writeText(text);
    toast.success("Mensaje copiado al portapapeles");
  };

  const update = (patch: Partial<Order>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <AppShell>
      <PageHeader
        title="Nuevo pedido"
        subtitle="Pega el mensaje de WhatsApp del cliente y Operia hará el resto."
      />

      <Card className="p-5 rounded-3xl mb-6">
        <Label className="text-sm font-medium mb-2 block">Mensaje de WhatsApp</Label>
        <Textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Pega aquí el mensaje de WhatsApp del cliente…"
          className="min-h-40 rounded-2xl text-base resize-none"
        />
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <Button onClick={analizar} size="lg" className="rounded-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Analizar pedido
          </Button>
          <Button variant="ghost" onClick={() => setMsg(SAMPLE)} className="rounded-full">
            Probar con ejemplo
          </Button>
          {msg && <Button variant="ghost" onClick={limpiar} className="rounded-full"><RotateCcw className="h-4 w-4 mr-1" />Limpiar</Button>}
        </div>
      </Card>

      {draft && (
        <Card className="p-5 md:p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-display">Pedido extraído</h2>
              <RiskBadge level={draft.riesgo} />
            </div>
            <span className="text-xs text-muted-foreground">Edita lo que sea necesario antes de guardar</span>
          </div>

          {draft.faltantes.length > 0 && (
            <div className="mb-5 p-3 rounded-2xl bg-warning/15 border border-warning/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-foreground shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Faltan algunos datos</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {draft.faltantes.map((f) => (
                    <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-card border border-warning/40">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Cliente" value={draft.cliente} onChange={(v) => update({ cliente: v })} />
            <Field label="Teléfono" value={draft.telefono} onChange={(v) => update({ telefono: v })} />
            <Field label="Producto" value={draft.producto} onChange={(v) => update({ producto: v })} />
            <Field label="Sabor" value={draft.sabor} onChange={(v) => update({ sabor: v })} />
            <Field label="Tamaño" value={draft.tamano} onChange={(v) => update({ tamano: v })} />
            <Field label="Cantidad" value={draft.cantidad} onChange={(v) => update({ cantidad: v })} />
            <Field label="Fecha de entrega" type="date" value={draft.fechaEntrega} onChange={(v) => update({ fechaEntrega: v })} />
            <Field label="Hora de entrega" type="time" value={draft.horaEntrega} onChange={(v) => update({ horaEntrega: v })} />
            <Field label="Dirección" value={draft.direccion} onChange={(v) => update({ direccion: v })} />
            <Field label="Personalización" value={draft.personalizacion} onChange={(v) => update({ personalizacion: v })} />
            <div>
              <Label className="text-xs text-muted-foreground">Estado de pago</Label>
              <Select value={draft.pago} onValueChange={(v) => update({ pago: v as PaymentStatus })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="anticipo">Anticipo recibido</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Precio estimado ($)" type="number" value={String(draft.precio || "")} onChange={(v) => update({ precio: Number(v) || 0 })} />
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Notas internas</Label>
              <Textarea value={draft.notas} onChange={(e) => update({ notas: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Button onClick={guardar} size="lg" className="rounded-full"><Save className="h-4 w-4 mr-2" />Guardar pedido</Button>
            <Button variant="secondary" onClick={copiarFaltantes} className="rounded-full">
              <Copy className="h-4 w-4 mr-2" />Copiar mensaje para pedir datos faltantes
            </Button>
            <Button variant="ghost" onClick={limpiar} className="rounded-full">Limpiar</Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 rounded-xl" />
    </div>
  );
}
