ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS intent TEXT NULL,
  ADD COLUMN IF NOT EXISTS product_requested TEXT NULL,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS requested_date DATE NULL,
  ADD COLUMN IF NOT EXISTS requested_time TIME NULL,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS missing_fields TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'bajo',
  ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Renombrar source_message_text → original_message si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='source_message_text'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='original_message'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN source_message_text TO original_message;
  END IF;
END $$;

-- Asegurar que existe (por si el rename no aplicaba)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS original_message TEXT NULL;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;