ALTER TABLE public.meta_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.meta_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_conversations;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;