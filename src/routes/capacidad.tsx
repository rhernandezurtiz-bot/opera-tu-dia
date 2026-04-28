import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader, SectionHeading, Eyebrow } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCatalog,
  type CatalogItem,
  type CatalogVariant,
  variantRemaining,
  dailyUsageFor,
} from "@/lib/catalog-store";
import { useOperia } from "@/lib/operia-store";
import { CalendarDays, ChevronLeft, ChevronRight, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/capacidad")({
  head: () => ({
    meta: [
      { title: "Capacidad — Operia" },
      { name: "description", content: "Define cuántos pedidos puedes cumplir cada día y deja que Operia decida sin saturar tu negocio." },
    ],
  }),
  component: CapacidadPage,
});

function todayISO() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function shiftDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function CapacidadPage() {
  const items = useCatalog((s) => s.items);
  const updateItem = useCatalog((s) => s.updateItem);
  const orders = useOperia((s) => s.orders);
  const [fecha, setFecha] = useState(todayISO());

  const conVariantes = useMemo(
    () => items.filter((it) => it.disponible && it.variantesDetalle.length > 0),
    [items],
  );

  const totalLibre = useMemo(() => {
    let acc = 0;
    for (const it of conVariantes) {
      for (const v of it.variantesDetalle) {
        if (v.stockDiario > 0 && v.disponible) {
          const r = variantRemaining(it, v, fecha, orders);
          if (Number.isFinite(r)) acc += r;
        }
      }
    }
    return acc;
  }, [conVariantes, fecha, orders]);

  const llenos = useMemo(() => {
    const out: { item: CatalogItem; variant: CatalogVariant }[] = [];
    for (const it of conVariantes) {
      for (const v of it.variantesDetalle) {
        if (v.stockDiario > 0 && variantRemaining(it, v, fecha, orders) === 0) {
          out.push({ item: it, variant: v });
        }
      }
    }
    return out;
  }, [conVariantes, fecha, orders]);

  return (
    <AppShell>
      <PageHeader
        title="Capacidad"
        subtitle="Cuántos pedidos puedes cumplir cada día. Operia deja de vender cuando se llena."
      />

      {/* Selector de fecha */}
      <Card className="p-4 rounded-xl mb-6 flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={() => setFecha(shiftDays(fecha, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Día</div>
          <div className="font-medium capitalize truncate">{prettyDate(fecha)}</div>
        </div>
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value || todayISO())}
          className="w-[160px]"
        />
        <Button size="sm" variant="outline" onClick={() => setFecha(todayISO())}>Hoy</Button>
        <Button size="icon" variant="ghost" onClick={() => setFecha(shiftDays(fecha, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>

      {/* Resumen */}
      <section className="mb-8">
        <Eyebrow>📅 Resumen del día</Eyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <SummaryCard
            tone="default"
            icon={CalendarDays}
            value={totalLibre}
            label="Lugares libres"
            hint="Pedidos que aún puedes tomar"
          />
          <SummaryCard
            tone={llenos.length > 0 ? "danger" : "default"}
            icon={AlertTriangle}
            value={llenos.length}
            label="Variantes llenas"
            hint="Ya no aceptan más pedidos"
          />
          <SummaryCard
            tone="default"
            icon={Package}
            value={conVariantes.length}
            label="Productos activos"
            hint="Con capacidad configurada"
          />
        </div>
      </section>

      {conVariantes.length === 0 ? (
        <Card className="rounded-xl p-10 text-center border-dashed bg-secondary/30">
          <CalendarDays className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <div className="text-[14px] font-medium">Aún no defines capacidad</div>
          <div className="text-[12.5px] text-muted-foreground mt-1 max-w-md mx-auto">
            Ve a tu Catálogo, agrega variantes a tus productos (por ejemplo "12 personas")
            y pon cuántas puedes hacer por día.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <SectionHeading
            title="Tus productos"
            subtitle="Cambia los cupos por día sin tocar precios ni catálogo"
          />
          {conVariantes.map((it) => (
            <ProductCapacityCard
              key={it.id}
              item={it}
              fecha={fecha}
              orders={orders}
              onSave={(variantesDetalle) => {
                updateItem(it.id, { variantesDetalle });
                toast.success("Capacidad actualizada");
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({
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
  tone: "default" | "danger";
}) {
  const styles =
    tone === "danger"
      ? "bg-danger/8 text-danger/90"
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

function ProductCapacityCard({
  item,
  fecha,
  orders,
  onSave,
}: {
  item: CatalogItem;
  fecha: string;
  orders: ReturnType<typeof useOperia.getState>["orders"];
  onSave: (vs: CatalogVariant[]) => void;
}) {
  const [draft, setDraft] = useState<CatalogVariant[]>(item.variantesDetalle);
  const dirty = JSON.stringify(draft) !== JSON.stringify(item.variantesDetalle);

  const setVariant = (id: string, patch: Partial<CatalogVariant>) =>
    setDraft((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  return (
    <Card className="p-4 rounded-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="font-medium text-[15px] truncate">{item.nombre}</div>
          <div className="text-[12px] text-muted-foreground">
            {item.variantesDetalle.length} {item.variantesDetalle.length === 1 ? "variante" : "variantes"}
          </div>
        </div>
        {dirty && (
          <Button size="sm" onClick={() => onSave(draft)}>Guardar cambios</Button>
        )}
      </div>

      <div className="space-y-2">
        {draft.map((v) => {
          const orig = item.variantesDetalle.find((x) => x.id === v.id) ?? v;
          const usados = orig.stockDiario > 0 ? dailyUsageFor(item.id, fecha, orders) : 0;
          const total = v.stockDiario;
          const libres = total > 0 ? Math.max(0, total - usados) : Number.POSITIVE_INFINITY;
          const lleno = total > 0 && libres === 0;
          const pct = total > 0 ? Math.min(100, Math.round((usados / total) * 100)) : 0;

          return (
            <div
              key={v.id}
              className={`rounded-lg border p-3 ${lleno ? "border-danger/30 bg-danger/5" : "border-border bg-secondary/20"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-medium text-[13.5px] truncate">{v.nombre || "Sin nombre"}</div>
                  {v.personas > 0 && (
                    <div className="text-[11.5px] text-muted-foreground">para {v.personas} personas</div>
                  )}
                </div>
                {total > 0 ? (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border tabular-nums ${
                      lleno
                        ? "bg-danger/10 text-danger/90 border-danger/25"
                        : libres <= 2
                          ? "bg-warning/15 text-foreground/70 border-warning/30"
                          : "bg-success/10 text-success/90 border-success/20"
                    }`}
                  >
                    {libres} libre{libres === 1 ? "" : "s"} · {usados}/{total} usados
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                    Sin límite
                  </span>
                )}
              </div>

              {total > 0 && (
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                  <div
                    className={`h-full ${lleno ? "bg-danger/70" : pct > 70 ? "bg-warning" : "bg-foreground/70"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground">¿Cuántos puedes hacer al día?</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                      onClick={() => setVariant(v.id, { stockDiario: Math.max(0, v.stockDiario - 1) })}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={v.stockDiario || ""}
                      onChange={(e) => setVariant(v.id, { stockDiario: Number(e.target.value) || 0 })}
                      placeholder="Sin límite"
                      className="h-9 text-center w-20 tabular-nums"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                      onClick={() => setVariant(v.id, { stockDiario: v.stockDiario + 1 })}
                    >
                      +
                    </Button>
                    <span className="text-[11.5px] text-muted-foreground ml-1">por día</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={v.disponible ? "outline" : "default"}
                  size="sm"
                  onClick={() => setVariant(v.id, { disponible: !v.disponible })}
                >
                  {v.disponible ? "Pausar" : "Activar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11.5px] text-muted-foreground mt-3 italic">
        💡 Operia deja de aceptar pedidos automáticamente cuando se llena el cupo del día.
      </div>
    </Card>
  );
}
