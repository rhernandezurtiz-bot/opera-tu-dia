import { useEffect, useRef } from "react";
import { useOperia, type Order } from "./operia-store";
import { useCatalog, validateOrder, type CatalogItem } from "./catalog-store";

/**
 * Motor de inventario.
 * - Cuando un pedido pasa a "confirmado" o "pago=pagado", descuenta stock del item del catálogo
 *   con el que hace match (si stockDisponible > 0).
 * - Cuando un pedido se cancela, restaura el stock previamente reservado.
 * - Marca Order.stockReservadoFor + stockReservedQty para no duplicar movimientos.
 */
export function useInventoryEngine() {
  const lastSnapshot = useRef<Map<string, { estado: string; pago: string }>>(new Map());

  useEffect(() => {
    const tick = () => {
      const { orders, updateOrder } = useOperia.getState();
      const { items, decrementStock, incrementStock } = useCatalog.getState();

      for (const o of orders) {
        const prev = lastSnapshot.current.get(o.id);
        const reserve = shouldReserveStock(o);
        const release = shouldReleaseStock(o);

        if (reserve && !o.stockReservadoFor) {
          const match = matchCatalogItem(o, items);
          if (match && match.stockDisponible > 0) {
            const qty = parseQty(o.cantidad) || 1;
            decrementStock(match.id, qty);
            updateOrder(o.id, { stockReservadoFor: match.id, stockReservedQty: qty });
          }
        }

        if (release && o.stockReservadoFor) {
          incrementStock(o.stockReservadoFor, o.stockReservedQty || 1);
          updateOrder(o.id, { stockReservadoFor: undefined, stockReservedQty: undefined });
        }

        lastSnapshot.current.set(o.id, { estado: o.estado, pago: o.pago });
        void prev;
      }
    };

    tick();
    const id = setInterval(tick, 4000);
    const unsub = useOperia.subscribe(tick);
    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);
}

function shouldReserveStock(o: Order): boolean {
  if (o.estado === "cancelado") return false;
  return (
    o.estado === "confirmado" ||
    o.estado === "en_proceso" ||
    o.estado === "listo" ||
    o.estado === "entregado" ||
    o.pago === "pagado"
  );
}

function shouldReleaseStock(o: Order): boolean {
  return o.estado === "cancelado";
}

function parseQty(s: string): number {
  const n = parseInt(s || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function matchCatalogItem(o: Order, items: CatalogItem[]): CatalogItem | undefined {
  const v = validateOrder(o, items);
  return v.match;
}

/* ============== Métricas para dashboard ============== */

export interface InventoryMetrics {
  bajoStock: CatalogItem[];           // items con stockDisponible <= stockMinimo y stockMinimo > 0
  stockCritico: CatalogItem[];        // stockDisponible === 0 y bloquearSinDisponibilidad
  capacidadHoy: { item: CatalogItem; usado: number; total: number; libre: number }[];
  pedidosBloqueados: Order[];         // pedidos no entregados con validación bloqueada
}

export function getInventoryMetrics(items: CatalogItem[], orders: Order[]): InventoryMetrics {
  const today = new Date().toISOString().slice(0, 10);

  const bajoStock = items.filter(
    (it) => it.stockMinimo > 0 && it.stockDisponible > 0 && it.stockDisponible <= it.stockMinimo,
  );
  const stockCritico = items.filter(
    (it) =>
      (it.tipoInventario === "producto_terminado" || it.tipoInventario === "insumo") &&
      it.stockMinimo > 0 &&
      it.stockDisponible === 0 &&
      it.bloquearSinDisponibilidad,
  );

  const capacidadHoy = items
    .filter((it) => it.capacidadDiaria > 0)
    .map((it) => {
      const usado = orders.filter(
        (o) =>
          o.fechaEntrega === today &&
          o.estado !== "cancelado" &&
          (o.stockReservadoFor === it.id ||
            (o.descripcion || "").toLowerCase().includes(it.nombre.toLowerCase().split(" ")[0])),
      ).length;
      return { item: it, usado, total: it.capacidadDiaria, libre: Math.max(0, it.capacidadDiaria - usado) };
    });

  const pedidosBloqueados = orders.filter((o) => {
    if (o.estado === "entregado" || o.estado === "cancelado") return false;
    const v = validateOrder(o, items, orders);
    return v.blockPayment;
  });

  return { bajoStock, stockCritico, capacidadHoy, pedidosBloqueados };
}
