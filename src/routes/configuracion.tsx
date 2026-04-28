import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useOperia, typeLabels, type RiskRules, type OrderType } from "@/lib/operia-store";
import { Plus, Trash2, MessageCircle, Copy, Info, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — Operia" },
      { name: "description", content: "Tipo de negocio, tipos de órdenes, equipo y reglas de riesgo." },
    ],
  }),
  component: Config,
});

function Config() {
  const negocio = useOperia((s) => s.negocio);
  const setNegocio = useOperia((s) => s.setNegocio);
  const toggleTipo = useOperia((s) => s.toggleTipo);
  const miembros = useOperia((s) => s.miembros);
  const addMiembro = useOperia((s) => s.addMiembro);
  const removeMiembro = useOperia((s) => s.removeMiembro);
  const riskRules = useOperia((s) => s.riskRules);
  const setRiskRules = useOperia((s) => s.setRiskRules);
  const whatsapp = useOperia((s) => s.whatsapp);
  const setWhatsapp = useOperia((s) => s.setWhatsapp);
  const setPaymentsConfig = useOperia((s) => s.setPaymentsConfig);
  const payments = negocio.payments;

  const [nm, setNm] = useState({ nombre: "", rol: "" });

  const ruleLabels: Record<keyof RiskRules, string> = {
    fecha: "Fecha", hora: "Hora", direccion: "Dirección",
    pago: "Pago", telefono: "Teléfono", descripcion: "Descripción clara",
  };

  return (
    <AppShell>
      <PageHeader title="Configuración" subtitle="Personaliza Operia para tu negocio." />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5 rounded-xl">
          <h3 className="font-display text-lg mb-4">Datos del negocio</h3>
          <div className="space-y-3">
            <FieldRow label="Nombre del negocio" value={negocio.nombre} onChange={(v) => setNegocio({ nombre: v })} />
            <FieldRow label="Tipo de negocio" value={negocio.tipoNegocio} onChange={(v) => setNegocio({ tipoNegocio: v })} />
            <FieldRow label="Teléfono" value={negocio.telefono} onChange={(v) => setNegocio({ telefono: v })} />
            <FieldRow label="Dirección" value={negocio.direccion} onChange={(v) => setNegocio({ direccion: v })} />
            <FieldRow label="Horarios de atención" value={negocio.horarios} onChange={(v) => setNegocio({ horarios: v })} />
          </div>
        </Card>

        <Card className="p-5 rounded-xl">
          <h3 className="font-display text-lg mb-2">Tipos de órdenes activos</h3>
          <p className="text-sm text-muted-foreground mb-3">Define qué tipos de órdenes maneja tu negocio.</p>
          <div className="space-y-2">
            {(Object.keys(typeLabels) as OrderType[]).map((t) => (
              <label key={t} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50">
                <span className="text-sm">{typeLabels[t]}</span>
                <Switch checked={negocio.tiposActivos.includes(t)} onCheckedChange={() => toggleTipo(t)} />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-xl">
          <h3 className="font-display text-lg mb-2">Reglas de riesgo</h3>
          <p className="text-sm text-muted-foreground mb-3">Activa los campos obligatorios para detectar órdenes en riesgo.</p>
          <div className="space-y-2">
            {(Object.keys(ruleLabels) as (keyof RiskRules)[]).map((k) => (
              <label key={k} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50">
                <span className="text-sm">{ruleLabels[k]}</span>
                <Switch checked={riskRules[k]} onCheckedChange={(v) => setRiskRules({ [k]: v } as Partial<RiskRules>)} />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-xl">
          <h3 className="font-display text-lg mb-4">Equipo</h3>
          <div className="space-y-2 mb-4">
            {miembros.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50">
                <div>
                  <div className="font-medium">{m.nombre}</div>
                  <div className="text-xs text-muted-foreground">{m.rol}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeMiembro(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            <Input placeholder="Nombre" value={nm.nombre} onChange={(e) => setNm({ ...nm, nombre: e.target.value })} className="rounded-xl" />
            <Input placeholder="Rol" value={nm.rol} onChange={(e) => setNm({ ...nm, rol: e.target.value })} className="rounded-xl" />
            <Button className="rounded-full" onClick={() => {
              if (!nm.nombre) return toast.error("Falta el nombre");
              addMiembro({ id: "m" + Math.random().toString(36).slice(2,8), nombre: nm.nombre, rol: nm.rol });
              setNm({ nombre: "", rol: "" });
              toast.success("Miembro agregado");
            }}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
          </div>
        </Card>

        <Card className="p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-5 w-5 text-success" />
            <h3 className="font-display text-lg">Integración WhatsApp</h3>
            <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full border ${
              whatsapp.conectado
                ? "bg-success/15 text-success border-success/30"
                : "bg-secondary text-muted-foreground border-border"
            }`}>
              {whatsapp.conectado ? "Conectado" : "No conectado"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Conecta tu número de WhatsApp Business para recibir mensajes automáticamente en el Inbox.
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <FieldRow label="Phone Number ID" value={whatsapp.phoneNumberId} onChange={(v) => setWhatsapp({ phoneNumberId: v })} />
            <FieldRow label="Access Token" value={whatsapp.accessToken} onChange={(v) => setWhatsapp({ accessToken: v })} />
            <FieldRow label="Verify Token" value={whatsapp.verifyToken} onChange={(v) => setWhatsapp({ verifyToken: v })} />
            <div>
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <div className="flex gap-2 mt-1">
                <Input value={whatsapp.webhookUrl} onChange={(e) => setWhatsapp({ webhookUrl: e.target.value })} className="rounded-xl" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsapp.webhookUrl);
                    toast.success("URL copiada");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              className="rounded-full"
              onClick={() => {
                if (!whatsapp.phoneNumberId || !whatsapp.accessToken) {
                  toast.error("Falta Phone Number ID o Access Token");
                  return;
                }
                setWhatsapp({ conectado: !whatsapp.conectado });
                toast.success(whatsapp.conectado ? "Integración desactivada" : "Integración marcada como activa");
              }}
            >
              {whatsapp.conectado ? "Desconectar" : "Marcar como conectado"}
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-secondary/50 text-xs text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Para activar la integración real, Operia necesitará conectarse a <strong>WhatsApp Business Cloud API</strong> mediante webhooks.
              Por ahora, los mensajes del Inbox son simulados para que pruebes el flujo de trabajo completo.
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 rounded-xl" />
    </div>
  );
}
