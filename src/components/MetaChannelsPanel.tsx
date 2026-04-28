/**
 * Panel "Canales conectados (Meta — backend real)".
 * Lee y actualiza meta_channels vía server functions.
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { listMetaChannels, upsertMetaChannel } from "@/server/meta.functions";
import { MessageCircle, Instagram, Facebook, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

type Channel = "whatsapp" | "instagram" | "facebook";
type ReplyMode = "manual" | "suggested" | "auto";

interface ChannelRow {
  id: string;
  channel: Channel;
  connected: boolean;
  account_label: string | null;
  external_account_id: string | null;
  reply_mode: ReplyMode;
  last_message_at: string | null;
}

const META = {
  whatsapp: { label: "WhatsApp Business", icon: MessageCircle, accountHint: "Phone Number ID" },
  instagram: { label: "Instagram DM", icon: Instagram, accountHint: "IG Business Account ID" },
  facebook: { label: "Facebook Messenger", icon: Facebook, accountHint: "Page ID" },
} as const;

const MODE_LABEL: Record<ReplyMode, string> = {
  manual: "Manual",
  suggested: "Sugerido",
  auto: "Automático",
};

export function MetaChannelsPanel() {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Channel | null>(null);

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

  const findRow = (c: Channel): Partial<ChannelRow> =>
    rows.find((r) => r.channel === c) ?? { channel: c, connected: false, reply_mode: "manual", account_label: "", external_account_id: "" };

  const update = async (c: Channel, patch: Partial<ChannelRow>) => {
    setSaving(c);
    try {
      const current = findRow(c);
      await upsertMetaChannel({
        data: {
          channel: c,
          connected: patch.connected ?? !!current.connected,
          account_label: patch.account_label ?? current.account_label ?? null,
          external_account_id: patch.external_account_id ?? current.external_account_id ?? null,
          reply_mode: patch.reply_mode ?? (current.reply_mode as ReplyMode) ?? "manual",
        },
      });
      await refresh();
      toast.success("Canal actualizado");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="p-5 rounded-xl">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="font-display text-lg">Canales conectados (backend real)</h3>
          <p className="text-sm text-muted-foreground">
            Estado real de WhatsApp, Instagram y Facebook usando la infraestructura oficial de Meta.
            Webhook: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/api/public/webhooks/meta</code>
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {(Object.keys(META) as Channel[]).map((c) => {
          const meta = META[c];
          const row = findRow(c);
          const Icon = meta.icon;
          const isSaving = saving === c;
          return (
            <div key={c} className="p-4 rounded-xl border bg-card/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{meta.label}</span>
                </div>
                <Badge variant={row.connected ? "default" : "outline"} className="text-xs">
                  {row.connected ? <><Check className="h-3 w-3 mr-1"/>Conectado</> : <><X className="h-3 w-3 mr-1"/>No conectado</>}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Cuenta vinculada</Label>
                <Input
                  className="rounded-lg h-9 text-sm"
                  placeholder={`Ej: Pastelería Luna`}
                  defaultValue={row.account_label ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== (row.account_label ?? null)) void update(c, { account_label: v });
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{meta.accountHint}</Label>
                <Input
                  className="rounded-lg h-9 text-sm font-mono"
                  placeholder="123456789012345"
                  defaultValue={row.external_account_id ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== (row.external_account_id ?? null)) void update(c, { external_account_id: v });
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Modo de respuesta</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(["manual", "suggested", "auto"] as ReplyMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => void update(c, { reply_mode: m })}
                      className={`text-xs py-1.5 rounded-lg border transition-colors ${
                        row.reply_mode === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-secondary border-border"
                      }`}
                    >
                      {MODE_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Último mensaje: {row.last_message_at ? new Date(row.last_message_at).toLocaleString() : "—"}
              </div>

              <Button
                size="sm"
                variant={row.connected ? "outline" : "default"}
                className="w-full rounded-full"
                disabled={isSaving}
                onClick={() => void update(c, { connected: !row.connected })}
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : row.connected ? "Desconectar" : "Marcar como conectado"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
