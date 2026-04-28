/**
 * Módulo "Canales conectados" — Operia.
 *
 * Tres tarjetas (WhatsApp / Instagram / Facebook) con:
 *   estado, modo de respuesta, último in/out, configurar, probar, logs.
 * Más un simulador de mensaje entrante que dispara el mismo flujo que el webhook.
 */

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  listMetaChannels, upsertMetaChannel, testMetaConnection,
  listChannelLogs, simulateInboundMessage,
} from "@/server/meta.functions";
import {
  MessageCircle, Instagram, Facebook, Loader2, Settings2, Activity, ScrollText,
  Copy, Send, Sparkles, AlertTriangle, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type Channel = "whatsapp" | "instagram" | "facebook";
type ReplyMode = "manual" | "suggested" | "auto";
type Status = "no_conectado" | "pendiente" | "conectado" | "error";

interface ChannelRow {
  id: string;
  channel: Channel;
  connected: boolean;
  status: Status;
  account_label: string | null;
  external_account_id: string | null;
  reply_mode: ReplyMode;
  last_message_at: string | null;
  last_outbound_at: string | null;
  error_message: string | null;
  verify_token: string;
}

interface LogRow {
  id: string;
  direction: "inbound" | "outbound";
  ok: boolean;
  info: any;
  created_at: string;
}

const META = {
  whatsapp: { label: "WhatsApp Business", icon: MessageCircle, idLabel: "Phone Number ID", placeholder: "1234567890" },
  instagram: { label: "Instagram", icon: Instagram, idLabel: "Instagram Account ID", placeholder: "17841400000000000" },
  facebook: { label: "Facebook Messenger", icon: Facebook, idLabel: "Page ID", placeholder: "100000000000000" },
} as const;

const MODE_LABEL: Record<ReplyMode, string> = { manual: "Manual", suggested: "Sugerido", auto: "Automático" };

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  no_conectado: { label: "No conectado", cls: "bg-secondary text-muted-foreground border-border", icon: XCircle },
  pendiente:    { label: "Pendiente",    cls: "bg-warning/15 text-warning-foreground border-warning/30", icon: Clock },
  conectado:    { label: "Conectado",    cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  error:        { label: "Error",        cls: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function webhookUrl() {
  if (typeof window === "undefined") return "/api/public/webhooks/meta";
  return `${window.location.origin}/api/public/webhooks/meta`;
}

export function MetaChannelsPanel() {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [configFor, setConfigFor] = useState<Channel | null>(null);
  const [logsFor, setLogsFor] = useState<Channel | null>(null);
  const [simOpen, setSimOpen] = useState(false);

  const refresh = async () => {
    try {
      const res = await listMetaChannels();
      setRows((res.channels ?? []) as ChannelRow[]);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudieron cargar los canales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const findRow = (c: Channel) => rows.find((r) => r.channel === c);

  return (
    <Card className="p-5 rounded-xl">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg">Canales conectados</h3>
          <p className="text-sm text-muted-foreground">
            Operia centraliza WhatsApp, Instagram y Facebook en un solo Inbox.
            Los mensajes pasan por el motor de decisión y se responden según el modo elegido.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setSimOpen(true)}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Simular mensaje entrante
          </Button>
          <Button size="sm" variant="ghost" asChild className="rounded-full">
            <Link to="/inbox/meta">Abrir Inbox →</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {(Object.keys(META) as Channel[]).map((c) => {
          const meta = META[c];
          const row = findRow(c);
          const status = (row?.status ?? "no_conectado") as Status;
          const sm = STATUS_META[status];
          const Icon = meta.icon;
          const SIcon = sm.icon;
          return (
            <div key={c} className="p-4 rounded-xl border bg-card/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{meta.label}</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${sm.cls}`}>
                  <SIcon className="h-3 w-3" />
                  {sm.label}
                </span>
              </div>

              {row?.error_message && status === "error" && (
                <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                  {row.error_message}
                </div>
              )}

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cuenta</span>
                  <span className="font-medium truncate max-w-[160px]">{row?.account_label || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modo</span>
                  <Badge variant="outline" className="text-[10px]">{MODE_LABEL[row?.reply_mode ?? "manual"]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Último recibido</span>
                  <span className="text-foreground/80">{fmt(row?.last_message_at ?? null)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Última respuesta</span>
                  <span className="text-foreground/80">{fmt(row?.last_outbound_at ?? null)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Modo de respuesta</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(["manual", "suggested", "auto"] as ReplyMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={async () => {
                        try {
                          await upsertMetaChannel({ data: { channel: c, reply_mode: m } });
                          await refresh();
                        } catch (err: any) { toast.error(err?.message ?? "Error"); }
                      }}
                      className={`text-[11px] py-1.5 rounded-lg border transition-colors ${
                        (row?.reply_mode ?? "manual") === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-secondary border-border"
                      }`}
                    >
                      {MODE_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-1">
                <Button size="sm" variant="outline" className="rounded-full text-[11px] h-8" onClick={() => setConfigFor(c)}>
                  <Settings2 className="h-3 w-3 mr-1" /> Configurar
                </Button>
                <TestConnectionButton channel={c} onDone={refresh} />
                <Button size="sm" variant="ghost" className="rounded-full text-[11px] h-8" onClick={() => setLogsFor(c)}>
                  <ScrollText className="h-3 w-3 mr-1" /> Logs
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfigSheet
        channel={configFor}
        row={configFor ? findRow(configFor) ?? null : null}
        onClose={() => setConfigFor(null)}
        onSaved={refresh}
      />
      <LogsDialog channel={logsFor} onClose={() => setLogsFor(null)} />
      <SimulateDialog open={simOpen} onClose={() => setSimOpen(false)} onSent={refresh} />
    </Card>
  );
}

// ── Botón "Probar conexión" con menú de outcome ──────────────────────────
function TestConnectionButton({ channel, onDone }: { channel: Channel; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const run = async (outcome: "auto" | "success" | "token_error" | "webhook_unverified") => {
    setLoading(true);
    try {
      const res = await testMetaConnection({ data: { channel, outcome } });
      if (res.outcome === "success") toast.success("Conexión exitosa");
      else if (res.outcome === "token_error") toast.error("Token inválido");
      else toast.warning("Webhook no verificado");
      await onDone();
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full text-[11px] h-8">
          <Activity className="h-3 w-3 mr-1" /> Probar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Probar conexión</DialogTitle>
          <DialogDescription>
            Aún no hay credenciales reales conectadas. Elige el resultado a simular.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="outline" className="rounded-full justify-start" disabled={loading} onClick={() => run("success")}>
            <CheckCircle2 className="h-4 w-4 mr-2 text-success" /> Conexión exitosa
          </Button>
          <Button variant="outline" className="rounded-full justify-start" disabled={loading} onClick={() => run("token_error")}>
            <AlertTriangle className="h-4 w-4 mr-2 text-destructive" /> Error de token
          </Button>
          <Button variant="outline" className="rounded-full justify-start" disabled={loading} onClick={() => run("webhook_unverified")}>
            <Clock className="h-4 w-4 mr-2 text-warning" /> Webhook no verificado
          </Button>
        </div>
        {loading && <div className="text-xs text-muted-foreground flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" />Probando...</div>}
      </DialogContent>
    </Dialog>
  );
}

// ── Sheet de configuración por canal ─────────────────────────────────────
function ConfigSheet({
  channel, row, onClose, onSaved,
}: {
  channel: Channel | null;
  row: ChannelRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [accountLabel, setAccountLabel] = useState("");
  const [externalId, setExternalId] = useState("");
  const [accessTokenDemo, setAccessTokenDemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAccountLabel(row?.account_label ?? "");
    setExternalId(row?.external_account_id ?? "");
    setAccessTokenDemo("");
  }, [row?.id, channel]);

  if (!channel) return null;
  const meta = META[channel];

  const save = async () => {
    setSaving(true);
    try {
      await upsertMetaChannel({
        data: {
          channel,
          account_label: accountLabel.trim() || null,
          external_account_id: externalId.trim() || null,
          status: externalId.trim() ? "pendiente" : "no_conectado",
        },
      });
      toast.success("Configuración guardada");
      await onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar");
    } finally { setSaving(false); }
  };

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copiado`);
  };

  return (
    <Sheet open={!!channel} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <meta.icon className="h-4 w-4" />
            Configurar {meta.label}
          </SheetTitle>
          <SheetDescription>
            Pega los identificadores públicos de la cuenta. Las credenciales reales (Access Tokens) se guardan como secretos del backend antes de activar producción.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre amigable de la cuenta</Label>
            <Input value={accountLabel} onChange={(e) => setAccountLabel(e.target.value)} placeholder="Ej: Pastelería Luna" className="rounded-lg" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{meta.idLabel}</Label>
            <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder={meta.placeholder} className="rounded-lg font-mono" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Access Token (placeholder demo)</Label>
            <Input
              value={accessTokenDemo}
              onChange={(e) => setAccessTokenDemo(e.target.value)}
              placeholder="No se guardará en el frontend"
              className="rounded-lg font-mono"
              type="password"
            />
            <p className="text-[11px] text-muted-foreground">
              Las credenciales reales se configurarán como secretos del backend antes de activar producción.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Verify Token (generado por Operia)</Label>
            <div className="flex gap-2">
              <Input readOnly value={row?.verify_token ?? ""} className="rounded-lg font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" className="rounded-lg shrink-0" onClick={() => copy(row?.verify_token ?? "", "Verify Token")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl()} className="rounded-lg font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" className="rounded-lg shrink-0" onClick={() => copy(webhookUrl(), "Webhook URL")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pega esta URL y el Verify Token en la configuración de Webhooks de Meta.
            </p>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-full" onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Diálogo de logs ──────────────────────────────────────────────────────
function LogsDialog({ channel, onClose }: { channel: Channel | null; onClose: () => void }) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!channel) return;
    setLoading(true);
    listChannelLogs({ data: { channel, limit: 100 } })
      .then((r) => setLogs((r.logs ?? []) as LogRow[]))
      .catch((err: any) => toast.error(err?.message ?? "Error al cargar logs"))
      .finally(() => setLoading(false));
  }, [channel]);

  if (!channel) return null;
  const meta = META[channel];

  return (
    <Dialog open={!!channel} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <meta.icon className="h-4 w-4" /> Logs — {meta.label}
          </DialogTitle>
          <DialogDescription>Últimos 100 eventos: mensajes recibidos, respuestas, intentos de envío, pruebas de conexión.</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1"/>Cargando...</div>}
        {!loading && logs.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">Sin logs todavía.</div>}
        <div className="space-y-1.5">
          {logs.map((l) => (
            <div key={l.id} className="text-xs border rounded-lg p-2 flex items-start gap-2">
              <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                l.ok ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"
              }`}>
                {l.direction === "inbound" ? "in" : "out"} · {l.ok ? "ok" : "err"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-foreground/80 truncate">
                  {l.info?.kind ?? l.info?.reason ?? (l.direction === "inbound" ? "mensaje recibido" : "mensaje enviado")}
                  {l.info?.preview && <span className="text-muted-foreground"> — “{l.info.preview}”</span>}
                  {l.info?.error && <span className="text-destructive"> — {l.info.error}</span>}
                </div>
                <div className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Diálogo "Simular mensaje entrante" ───────────────────────────────────
function SimulateDialog({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [name, setName] = useState("María López");
  const [text, setText] = useState("Hola, quiero un pastel de chocolate para 12 personas mañana 🎂");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const res = await simulateInboundMessage({ data: { channel, senderName: name, text } });
      if (res.mode === "auto") toast.success("Simulado: respuesta automática enviada");
      else if (res.mode === "suggested") toast.success("Simulado: respuesta sugerida lista para revisar");
      else toast.success("Simulado: mensaje guardado en Inbox");
      await onSent();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo simular");
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Simular mensaje entrante</DialogTitle>
          <DialogDescription>Ejecuta el mismo flujo que el webhook de Meta.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(META) as Channel[]).map((c) => (
                  <SelectItem key={c} value={c}>{META[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre del cliente</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mensaje</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="rounded-lg resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-full" disabled={sending || !name.trim() || !text.trim()} onClick={() => void send()}>
            {sending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />} Enviar al Inbox
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
