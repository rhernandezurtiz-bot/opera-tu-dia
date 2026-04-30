import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useOperia, typeLabels, type RiskRules, type OrderType, type AutoReplyMode, CHANNEL_LABELS } from "@/lib/operia-store";
import { DECISION_LABELS, INTENT_LABELS } from "@/lib/auto-reply";
import { Plus, Trash2, MessageCircle, Copy, Info, CreditCard, Lock, Instagram, Facebook, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MetaChannelsPanel } from "@/components/MetaChannelsPanel";

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
  const instagram = useOperia((s) => s.instagram);
  const setInstagram = useOperia((s) => s.setInstagram);
  const facebook = useOperia((s) => s.facebook);
  const setFacebook = useOperia((s) => s.setFacebook);
  const channelMode = useOperia((s) => s.channelMode);
  const setChannelMode = useOperia((s) => s.setChannelMode);
  const setPaymentsConfig = useOperia((s) => s.setPaymentsConfig);
  const autoReplyMode = useOperia((s) => s.autoReplyMode);
  const setAutoReplyMode = useOperia((s) => s.setAutoReplyMode);
  const autoReplyLog = useOperia((s) => s.autoReplyLog);
  const payments = negocio.payments;

  const [nm, setNm] = useState({ nombre: "", rol: "" });
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ruleLabels: Record<keyof RiskRules, string> = {
    fecha: "Fecha", hora: "Hora", direccion: "Dirección",
    pago: "Pago", telefono: "Teléfono", descripcion: "Descripción clara",
  };

  return (
    <AppShell>
      <PageHeader title="Configuración" subtitle="Personaliza Operia para tu negocio." />

      <div className="mb-5">
        <MetaChannelsPanel />
      </div>

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

        {/* Canales conectados (Instagram + Facebook) */}
        <Card className="p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-5 w-5 text-foreground/70" />
            <h3 className="font-display text-lg">Canales conectados</h3>
            <div className="ml-auto flex items-center gap-2 text-[12px]">
              <span className="text-muted-foreground">Modo</span>
              {mounted ? (
                <select
                  value={channelMode}
                  onChange={(e) => setChannelMode(e.target.value as "demo" | "produccion")}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-[12px]"
                >
                  <option value="demo">Demo</option>
                  <option value="produccion">Producción</option>
                </select>
              ) : (
                <span className="h-8 inline-flex items-center rounded-lg border border-border bg-background px-2 text-[12px] text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Recibe pedidos por WhatsApp, Instagram DM y Facebook Messenger en un solo Inbox.
          </p>

          <div className="mb-5 p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Instagram className="h-4 w-4" />
              <span className="font-medium">Instagram DM</span>
              <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full border ${instagram.conectado ? "bg-success/15 text-success border-success/30" : "bg-secondary text-muted-foreground border-border"}`}>
                {instagram.conectado ? "Conectado" : "No conectado"}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <FieldRow label="IG Business Account ID" value={instagram.igBusinessAccountId} onChange={(v) => setInstagram({ igBusinessAccountId: v })} />
              <FieldRow label="Page ID" value={instagram.pageId} onChange={(v) => setInstagram({ pageId: v })} />
              <FieldRow label="Access Token" value={instagram.accessToken} onChange={(v) => setInstagram({ accessToken: v })} />
              <FieldRow label="Verify Token" value={instagram.verifyToken} onChange={(v) => setInstagram({ verifyToken: v })} />
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={instagram.webhookUrl} onChange={(e) => setInstagram({ webhookUrl: e.target.value })} className="rounded-xl" />
                  <Button variant="secondary" size="icon" className="rounded-xl shrink-0" onClick={() => { navigator.clipboard.writeText(instagram.webhookUrl); toast.success("URL copiada"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button className="rounded-full mt-3" onClick={() => { setInstagram({ conectado: !instagram.conectado }); toast.success(instagram.conectado ? "Instagram desconectado" : "Instagram marcado como conectado"); }}>
              {instagram.conectado ? "Desconectar" : "Marcar como conectado"}
            </Button>
          </div>

          <div className="p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Facebook className="h-4 w-4" />
              <span className="font-medium">Facebook Messenger</span>
              <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full border ${facebook.conectado ? "bg-success/15 text-success border-success/30" : "bg-secondary text-muted-foreground border-border"}`}>
                {facebook.conectado ? "Conectado" : "No conectado"}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <FieldRow label="Page ID" value={facebook.pageId} onChange={(v) => setFacebook({ pageId: v })} />
              <FieldRow label="Page Access Token" value={facebook.accessToken} onChange={(v) => setFacebook({ accessToken: v })} />
              <FieldRow label="Verify Token" value={facebook.verifyToken} onChange={(v) => setFacebook({ verifyToken: v })} />
              <FieldRow label="App Secret" value={facebook.appSecret} onChange={(v) => setFacebook({ appSecret: v })} />
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={facebook.webhookUrl} onChange={(e) => setFacebook({ webhookUrl: e.target.value })} className="rounded-xl" />
                  <Button variant="secondary" size="icon" className="rounded-xl shrink-0" onClick={() => { navigator.clipboard.writeText(facebook.webhookUrl); toast.success("URL copiada"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button className="rounded-full mt-3" onClick={() => { setFacebook({ conectado: !facebook.conectado }); toast.success(facebook.conectado ? "Facebook desconectado" : "Facebook marcado como conectado"); }}>
              {facebook.conectado ? "Desconectar" : "Marcar como conectado"}
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-secondary/50 text-xs text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              En <strong>Demo</strong> los mensajes son simulados. En <strong>Producción</strong> se valida la firma de Meta y se envía vía Graph API.
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg">Pagos</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configura cómo Operia genera links de pago automáticos desde cada pedido.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">Proveedor principal</Label>
              {mounted ? (
                <select
                  value={payments.proveedorPrincipal}
                  onChange={(e) => setPaymentsConfig({ proveedorPrincipal: e.target.value as "mercadopago" | "stripe" | "ambos" })}
                  className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="stripe">Stripe</option>
                  <option value="ambos">Ambos</option>
                </select>
              ) : (
                <div className="mt-1 w-full h-10 rounded-xl border border-border bg-background" />
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Moneda</Label>
              {mounted ? (
                <select
                  value={payments.moneda}
                  onChange={(e) => setPaymentsConfig({ moneda: e.target.value as "MXN" | "USD" })}
                  className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="MXN">MXN — Peso mexicano</option>
                  <option value="USD">USD — Dólar</option>
                </select>
              ) : (
                <div className="mt-1 w-full h-10 rounded-xl border border-border bg-background" />
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Modo</Label>
              {mounted ? (
                <select
                  value={payments.modo}
                  onChange={(e) => setPaymentsConfig({ modo: e.target.value as "simulacion" | "produccion" })}
                  className="mt-1 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="simulacion">Simulación</option>
                  <option value="produccion">Producción</option>
                </select>
              ) : (
                <div className="mt-1 w-full h-10 rounded-xl border border-border bg-background" />
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Mercado Pago Access Token
              </Label>
              <Input placeholder="APP_USR-..." disabled className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Stripe Secret Key
              </Label>
              <Input placeholder="sk_live_..." disabled className="mt-1 rounded-xl" />
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={payments.webhookUrl}
                onChange={(e) => setPaymentsConfig({ webhookUrl: e.target.value })}
                className="rounded-xl"
              />
              <Button
                variant="secondary"
                size="icon"
                className="rounded-xl shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(payments.webhookUrl);
                  toast.success("URL copiada");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Mercado Pago:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${payments.mercadopagoConectado ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
              {payments.mercadopagoConectado ? "Conectado" : "No conectado"}
            </span>
            <span className="text-sm text-muted-foreground ml-3">Stripe:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${payments.stripeConectado ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
              {payments.stripeConectado ? "Conectado" : "No conectado"}
            </span>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-secondary/50 text-xs text-muted-foreground flex gap-2">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Por seguridad, las credenciales reales (Access Token, Secret Key) nunca se guardan en el frontend.
              Se configuran como secretos del backend. Estos campos son visuales para previsualizar la conexión.
            </span>
          </div>
        </Card>

        {/* Automatización: respuestas automáticas */}
        <Card className="p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg">Automatización</h3>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full border bg-secondary text-muted-foreground border-border">
              {autoReplyMode === "manual" ? "Manual" : autoReplyMode === "sugerido" ? "Sugerido" : "Automático"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Operia detecta intención del mensaje, lo cruza con catálogo y stock, y genera la respuesta. Nunca cobra sin disponibilidad confirmada.
          </p>

          <div className="grid sm:grid-cols-3 gap-2 mb-4">
            {(["manual", "sugerido", "automatico"] as AutoReplyMode[]).map((m) => {
              const label = m === "manual" ? "Manual" : m === "sugerido" ? "Sugerido" : "Automático";
              const desc = m === "manual"
                ? "Operia no responde, tú decides todo."
                : m === "sugerido"
                  ? "Operia genera la respuesta, tú la envías."
                  : "Operia responde sola los casos seguros.";
              const active = autoReplyMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setAutoReplyMode(m)}
                  className={`text-left p-3 rounded-2xl border transition ${active ? "border-primary bg-primary/8" : "border-border hover:bg-secondary/40"}`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {active && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">Historial de respuestas</h4>
            <span className="text-xs text-muted-foreground">{autoReplyLog.length} eventos</span>
          </div>
          {autoReplyLog.length === 0 ? (
            <div className="p-4 rounded-2xl bg-secondary/40 text-sm text-muted-foreground">
              Aún no hay respuestas automáticas registradas. Activa "Sugerido" o "Automático" y entra al Inbox.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {autoReplyLog.slice(0, 20).map((e) => (
                <div key={e.id} className="p-3 rounded-xl border border-border text-xs">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{e.cliente}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px]">{CHANNEL_LABELS[e.canal]}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{INTENT_LABELS[e.intencion]}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-warning/10 text-foreground/80 text-[10px]">{DECISION_LABELS[e.decision]}</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] ${
                      e.resultado === "ok" ? "bg-success/15 text-success" :
                      e.resultado === "error" ? "bg-danger/15 text-danger" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {e.enviado ? "Enviado" : e.resultado === "error" ? "Error" : "Pendiente"}
                    </span>
                  </div>
                  <div className="text-muted-foreground italic line-clamp-1">"{e.recibido}"</div>
                  <div className="text-foreground/80 mt-1 whitespace-pre-wrap line-clamp-3">{e.respuesta}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(e.at).toLocaleString("es-MX")} · modo {e.modo}
                    {e.error ? ` · ${e.error}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 rounded-2xl bg-secondary/50 text-xs text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              En modo <strong>Automático</strong>, Operia envía respuestas seguras vía <code>/api/send-message</code> (stub). Los casos ambiguos se marcan como <strong>Requiere revisión</strong> y no se envían.
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
