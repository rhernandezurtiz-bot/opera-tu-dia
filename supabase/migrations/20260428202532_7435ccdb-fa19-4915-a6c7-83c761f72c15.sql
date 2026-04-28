
-- Channel type enum
CREATE TYPE public.meta_channel_type AS ENUM ('whatsapp', 'instagram', 'facebook');
CREATE TYPE public.meta_reply_mode AS ENUM ('manual', 'suggested', 'auto');
CREATE TYPE public.meta_message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE public.meta_message_status AS ENUM ('received', 'pending', 'sent', 'failed', 'delivered', 'read');

-- Channels: one row per (owner, channel type)
CREATE TABLE public.meta_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  channel public.meta_channel_type NOT NULL,
  connected BOOLEAN NOT NULL DEFAULT false,
  account_label TEXT,
  external_account_id TEXT,
  reply_mode public.meta_reply_mode NOT NULL DEFAULT 'manual',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, channel)
);

-- Conversations: one per (owner, channel, external sender)
CREATE TABLE public.meta_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  channel public.meta_channel_type NOT NULL,
  external_conversation_id TEXT NOT NULL,
  external_sender_id TEXT NOT NULL,
  sender_name TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  unread_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, channel, external_conversation_id)
);

CREATE INDEX idx_meta_conversations_owner_recent
  ON public.meta_conversations (owner_id, last_message_at DESC);

-- Messages
CREATE TABLE public.meta_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.meta_conversations(id) ON DELETE CASCADE,
  channel public.meta_channel_type NOT NULL,
  direction public.meta_message_direction NOT NULL,
  text TEXT,
  status public.meta_message_status NOT NULL DEFAULT 'received',
  external_message_id TEXT,
  raw_payload JSONB,
  decision JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meta_messages_conversation ON public.meta_messages (conversation_id, created_at);
CREATE INDEX idx_meta_messages_owner ON public.meta_messages (owner_id, created_at DESC);

-- Logs
CREATE TABLE public.meta_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  channel public.meta_channel_type,
  direction public.meta_message_direction NOT NULL,
  ok BOOLEAN NOT NULL,
  info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meta_message_logs_owner ON public.meta_message_logs (owner_id, created_at DESC);

-- updated_at trigger function (reuse pattern)
CREATE OR REPLACE FUNCTION public.tg_meta_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_meta_channels_updated
  BEFORE UPDATE ON public.meta_channels
  FOR EACH ROW EXECUTE FUNCTION public.tg_meta_set_updated_at();

CREATE TRIGGER trg_meta_conversations_updated
  BEFORE UPDATE ON public.meta_conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_meta_set_updated_at();

-- Enable RLS
ALTER TABLE public.meta_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_message_logs ENABLE ROW LEVEL SECURITY;

-- Policies: owner can manage own rows
CREATE POLICY "channels_owner_all" ON public.meta_channels
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "conversations_owner_all" ON public.meta_conversations
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "messages_owner_all" ON public.meta_messages
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "logs_owner_select" ON public.meta_message_logs
  FOR SELECT USING (auth.uid() = owner_id);
