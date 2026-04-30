export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      meta_channels: {
        Row: {
          account_label: string | null
          channel: Database["public"]["Enums"]["meta_channel_type"]
          connected: boolean
          created_at: string
          error_message: string | null
          external_account_id: string | null
          id: string
          last_message_at: string | null
          last_outbound_at: string | null
          owner_id: string
          reply_mode: Database["public"]["Enums"]["meta_reply_mode"]
          status: Database["public"]["Enums"]["meta_channel_status"]
          updated_at: string
          verify_token: string
        }
        Insert: {
          account_label?: string | null
          channel: Database["public"]["Enums"]["meta_channel_type"]
          connected?: boolean
          created_at?: string
          error_message?: string | null
          external_account_id?: string | null
          id?: string
          last_message_at?: string | null
          last_outbound_at?: string | null
          owner_id: string
          reply_mode?: Database["public"]["Enums"]["meta_reply_mode"]
          status?: Database["public"]["Enums"]["meta_channel_status"]
          updated_at?: string
          verify_token?: string
        }
        Update: {
          account_label?: string | null
          channel?: Database["public"]["Enums"]["meta_channel_type"]
          connected?: boolean
          created_at?: string
          error_message?: string | null
          external_account_id?: string | null
          id?: string
          last_message_at?: string | null
          last_outbound_at?: string | null
          owner_id?: string
          reply_mode?: Database["public"]["Enums"]["meta_reply_mode"]
          status?: Database["public"]["Enums"]["meta_channel_status"]
          updated_at?: string
          verify_token?: string
        }
        Relationships: []
      }
      meta_conversations: {
        Row: {
          channel: Database["public"]["Enums"]["meta_channel_type"]
          created_at: string
          external_conversation_id: string
          external_sender_id: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          owner_id: string | null
          phone: string | null
          sender_name: string | null
          tags: string[]
          unread_count: number
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["meta_channel_type"]
          created_at?: string
          external_conversation_id: string
          external_sender_id: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          owner_id?: string | null
          phone?: string | null
          sender_name?: string | null
          tags?: string[]
          unread_count?: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["meta_channel_type"]
          created_at?: string
          external_conversation_id?: string
          external_sender_id?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          owner_id?: string | null
          phone?: string | null
          sender_name?: string | null
          tags?: string[]
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      meta_message_logs: {
        Row: {
          channel: Database["public"]["Enums"]["meta_channel_type"] | null
          created_at: string
          direction: Database["public"]["Enums"]["meta_message_direction"]
          id: string
          info: Json | null
          ok: boolean
          owner_id: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["meta_channel_type"] | null
          created_at?: string
          direction: Database["public"]["Enums"]["meta_message_direction"]
          id?: string
          info?: Json | null
          ok: boolean
          owner_id?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["meta_channel_type"] | null
          created_at?: string
          direction?: Database["public"]["Enums"]["meta_message_direction"]
          id?: string
          info?: Json | null
          ok?: boolean
          owner_id?: string | null
        }
        Relationships: []
      }
      meta_messages: {
        Row: {
          channel: Database["public"]["Enums"]["meta_channel_type"]
          conversation_id: string
          created_at: string
          decision: Json | null
          direction: Database["public"]["Enums"]["meta_message_direction"]
          external_message_id: string | null
          id: string
          owner_id: string | null
          phone: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["meta_message_status"]
          text: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["meta_channel_type"]
          conversation_id: string
          created_at?: string
          decision?: Json | null
          direction: Database["public"]["Enums"]["meta_message_direction"]
          external_message_id?: string | null
          id?: string
          owner_id?: string | null
          phone?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["meta_message_status"]
          text?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["meta_channel_type"]
          conversation_id?: string
          created_at?: string
          decision?: Json | null
          direction?: Database["public"]["Enums"]["meta_message_direction"]
          external_message_id?: string | null
          id?: string
          owner_id?: string | null
          phone?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["meta_message_status"]
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "meta_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: string
          conversation_id: string | null
          created_at: string
          customer_name: string | null
          id: string
          owner_id: string | null
          phone: string
          source_message_text: string
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          conversation_id?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          owner_id?: string | null
          phone: string
          source_message_text: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          conversation_id?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          owner_id?: string | null
          phone?: string
          source_message_text?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      meta_channel_status: "no_conectado" | "pendiente" | "conectado" | "error"
      meta_channel_type: "whatsapp" | "instagram" | "facebook"
      meta_message_direction: "inbound" | "outbound"
      meta_message_status:
        | "received"
        | "pending"
        | "sent"
        | "failed"
        | "delivered"
        | "read"
      meta_reply_mode: "manual" | "suggested" | "auto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      meta_channel_status: ["no_conectado", "pendiente", "conectado", "error"],
      meta_channel_type: ["whatsapp", "instagram", "facebook"],
      meta_message_direction: ["inbound", "outbound"],
      meta_message_status: [
        "received",
        "pending",
        "sent",
        "failed",
        "delivered",
        "read",
      ],
      meta_reply_mode: ["manual", "suggested", "auto"],
    },
  },
} as const
