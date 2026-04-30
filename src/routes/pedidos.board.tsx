import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChannelBadge } from "@/components/ChannelBadge";
import { listOrders, updateOrderStatus } from "@/server/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Phone, MapPin, Calendar, Package, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/pedidos/board")({
  head: () => ({
    meta: [
      { title: "Tablero de pedidos — Operia" },
      {
        name: "description",
        content: "Tablero Kanban de pedidos de WhatsApp con estados y datos del cliente.",
      },
    ],
  }),
  component: BoardPage,
});

type OrderStatus =
  | "nuevo"
  | "faltan_datos"
  | "por_confirmar"
  | "confirmado"
  | "en_produccion"
  | "listo"
  | "entregado"
  | "cancelado"
  | "requiere_revision";

interface Order {
  id: string;
  conversation_id: string | null;
  customer_name: string | null;
  phone: string | null;
  channel: string;
  original_message: string | null;
  product_requested: string | null;
  quantity: number | null;
  requested_date: string | null;
  requested_time: string | null;
  delivery_address: string | null;
  delivery_mode: string | null;
  payment_status: string;
  status: OrderStatus;
  intent: string | null;
  missing_fields: string[];
  risk_level: "bajo" | "medio" | "alto";
  created_at: string;
}

const COLUMNS: { id: OrderStatus; label: string; color: string }[] = [
  { id: "nuevo", label: "Nuevo", color: "bg-blue-500/10 border-blue-500/30" },
  { id: "faltan_datos", label: "Faltan datos", color: "bg-amber-500/10 border-amber-500/30" },
  { id: "por_confirmar", label: "Por confirmar", color: "bg-purple-500/10 border-purple-500/30" },
  { id: "confirmado", label: "Confirmado", color: "bg-cyan-500/10 border-cyan-500/30" },
  { id: "en_produccion", label: "En producción", color: "bg-indigo-500/10 border-indigo-500/30" },
  { id: "listo", label: "Listo", color: "bg-emerald-500/10 border-emerald-500/30" },
  { id: "entregado", label: "Entregado", color: "bg-green-600/10 border-green-600/30" },
  { id: "cancelado", label: "Cancelado", color: "bg-rose-500/10 border-rose-500/30" },
];

const RISK_STYLES: Record<string, string> = {
  bajo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  medio: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  alto: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
};

function BoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { orders: rows } = await listOrders();
      setOrders((rows as Order[]) ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("orders-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<OrderStatus, Order[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    // Pedidos en revisión los ponemos al inicio de "Nuevo"
    for (const o of orders) {
      const key = (o.status === "requiere_revision" ? "nuevo" : o.status) as OrderStatus;
      if (map.has(key)) map.get(key)!.push(o);
      else map.get("nuevo")!.push(o);
    }
    return map;
  }, [orders]);

  const totalShown = orders.length;
  const reviewCount = orders.filter((o) => o.status === "requiere_revision").length;

  return (
    <AppShell>
      <PageHeader
        title="Tablero de pedidos"
        subtitle={`${totalShown} pedidos${reviewCount ? ` · ${reviewCount} requieren revisión` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/pedidos">Vista lista</Link>
            </Button>
            <Button
              onClick={() => void refresh()}
              size="sm"
              variant="outline"
              className="rounded-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refrescar
            </Button>
          </div>
        }
      />

      {loading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">Cargando…</Card>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Todavía no hay pedidos. Cuando llegue un mensaje por WhatsApp con intención de pedido,
            aparecerá aquí.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {COLUMNS.map((col) => {
              const items = grouped.get(col.id) ?? [];
              return (
                <div key={col.id} className="w-[300px] flex-shrink-0">
                  <div
                    className={`rounded-t-xl px-3 py-2 border-x border-t flex items-center justify-between ${col.color}`}
                  >
                    <span className="font-display text-sm">{col.label}</span>
                    <Badge variant="outline" className="text-[10px] bg-background/60">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="rounded-b-xl border border-t-0 bg-muted/20 p-2 min-h-[400px] space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center text-[11px] text-muted-foreground py-6">
                        Sin pedidos
                      </div>
                    ) : (
                      items.map((o) => <OrderCard key={o.id} order={o} onChanged={refresh} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function OrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (next: OrderStatus) => {
    setUpdating(true);
    try {
      const res = await updateOrderStatus({ data: { id: order.id, status: next } });
      if (!res.ok) throw new Error(res.error);
      toast.success("Estado actualizado");
      onChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo actualizar");
    } finally {
      setUpdating(false);
    }
  };

  const datetime =
    order.requested_date || order.requested_time
      ? `${order.requested_date ?? "—"} ${order.requested_time?.slice(0, 5) ?? ""}`.trim()
      : null;

  return (
    <Card className="p-3 space-y-2 bg-background hover:shadow-md transition-shadow">
      {/* Header: cliente + canal */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-sm truncate">
            {order.customer_name ?? "Sin nombre"}
          </div>
          {order.phone && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono mt-0.5">
              <Phone className="h-2.5 w-2.5" />
              {order.phone}
            </div>
          )}
        </div>
        <ChannelBadge canal={order.channel as any} />
      </div>

      {/* Producto */}
      {order.product_requested && (
        <div className="flex items-start gap-1.5 text-xs">
          <Package className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
          <span className="font-medium">
            {order.quantity ? `${order.quantity}× ` : ""}
            {order.product_requested}
          </span>
        </div>
      )}

      {/* Fecha/hora */}
      {datetime && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {datetime}
        </div>
      )}

      {/* Dirección */}
      {(order.delivery_address || order.delivery_mode) && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="truncate">
            {order.delivery_mode === "recoger"
              ? "Recoger en tienda"
              : order.delivery_address ?? "Entrega a domicilio"}
          </span>
        </div>
      )}

      {/* Mensaje original */}
      {order.original_message && (
        <div className="text-[11px] text-muted-foreground bg-muted/40 rounded p-1.5 line-clamp-2 italic">
          “{order.original_message}”
        </div>
      )}

      {/* Faltan datos */}
      {order.missing_fields?.length > 0 && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>Falta: {order.missing_fields.join(", ")}</span>
        </div>
      )}

      {/* Footer: riesgo + estado */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t">
        <Badge
          variant="outline"
          className={`text-[10px] ${RISK_STYLES[order.risk_level] ?? RISK_STYLES.bajo}`}
        >
          Riesgo {order.risk_level}
        </Badge>
        <Select
          value={order.status === "requiere_revision" ? "nuevo" : order.status}
          onValueChange={(v) => void changeStatus(v as OrderStatus)}
          disabled={updating}
        >
          <SelectTrigger className="h-7 text-[11px] w-[130px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {order.status === "requiere_revision" && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-3 w-3" />
          Requiere revisión humana
        </div>
      )}
    </Card>
  );
}
