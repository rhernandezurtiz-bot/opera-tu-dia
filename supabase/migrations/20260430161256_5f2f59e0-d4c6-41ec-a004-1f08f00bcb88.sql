ALTER TABLE public.meta_channels
ALTER COLUMN owner_id DROP NOT NULL;

-- Permitir lectura de canales sin dueño (modo demo)
DROP POLICY IF EXISTS channels_public_demo_select ON public.meta_channels;
CREATE POLICY channels_public_demo_select
ON public.meta_channels FOR SELECT
TO authenticated
USING (owner_id IS NULL);

-- Índice único para garantizar una sola fila demo por canal
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_channels_demo_unique
ON public.meta_channels (channel)
WHERE owner_id IS NULL;