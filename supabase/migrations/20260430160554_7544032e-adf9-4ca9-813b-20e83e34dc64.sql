-- Tabla de pedidos detectados automáticamente
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NULL,
  phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  source_message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nuevo',
  owner_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Lectura: dueño o pedidos huérfanos (sin owner)
CREATE POLICY "orders_owner_select"
ON public.orders FOR SELECT
TO authenticated
USING (owner_id IS NULL OR auth.uid() = owner_id);

-- Modificación: solo dueño
CREATE POLICY "orders_owner_modify"
ON public.orders FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE INDEX idx_orders_conversation ON public.orders(conversation_id);
CREATE INDEX idx_orders_phone ON public.orders(phone);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_meta_set_updated_at();

-- Etiquetas en conversaciones
ALTER TABLE public.meta_conversations
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_meta_conversations_tags
ON public.meta_conversations USING GIN(tags);