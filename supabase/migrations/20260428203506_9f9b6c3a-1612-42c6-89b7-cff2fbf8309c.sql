
CREATE TYPE public.meta_channel_status AS ENUM ('no_conectado', 'pendiente', 'conectado', 'error');

ALTER TABLE public.meta_channels
  ADD COLUMN status public.meta_channel_status NOT NULL DEFAULT 'no_conectado',
  ADD COLUMN error_message TEXT,
  ADD COLUMN last_outbound_at TIMESTAMPTZ,
  ADD COLUMN verify_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Backfill status para filas existentes basado en `connected`
UPDATE public.meta_channels SET status = 'conectado' WHERE connected = true;
