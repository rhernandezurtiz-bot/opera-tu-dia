-- 1) Hacer owner_id opcional
ALTER TABLE public.meta_conversations ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.meta_messages ALTER COLUMN owner_id DROP NOT NULL;

-- 2) Añadir columna phone (snapshot del número)
ALTER TABLE public.meta_conversations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.meta_messages ADD COLUMN IF NOT EXISTS phone text;

CREATE INDEX IF NOT EXISTS idx_meta_conversations_phone ON public.meta_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_meta_messages_phone ON public.meta_messages(phone);

-- 3) Actualizar RLS para permitir ver registros sin owner (modo demo)
DROP POLICY IF EXISTS conversations_owner_all ON public.meta_conversations;
CREATE POLICY conversations_owner_select ON public.meta_conversations
  FOR SELECT TO authenticated
  USING (owner_id IS NULL OR auth.uid() = owner_id);
CREATE POLICY conversations_owner_modify ON public.meta_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS messages_owner_all ON public.meta_messages;
CREATE POLICY messages_owner_select ON public.meta_messages
  FOR SELECT TO authenticated
  USING (owner_id IS NULL OR auth.uid() = owner_id);
CREATE POLICY messages_owner_modify ON public.meta_messages
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);