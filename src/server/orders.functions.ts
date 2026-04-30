import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const StatusEnum = z.enum([
  "nuevo",
  "faltan_datos",
  "por_confirmar",
  "confirmado",
  "en_produccion",
  "listo",
  "entregado",
  "cancelado",
  "requiere_revision",
]);

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[listOrders] error:", error);
    return { orders: [] };
  }
  return { orders: data ?? [] };
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), status: StatusEnum }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) {
      console.error("[updateOrderStatus] error:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });
