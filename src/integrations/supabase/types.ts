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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon_url: string | null
          id: string
          is_active: boolean
          level: number
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          rfq_id: string
          sender_id: string
          sender_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          rfq_id: string
          sender_id: string
          sender_role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          rfq_id?: string
          sender_id?: string
          sender_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string
          delivery_date: string | null
          id: string
          order_number: string
          payment_status: string
          po_number: string
          quote_id: string
          rfq_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_address: string
          delivery_date?: string | null
          id?: string
          order_number: string
          payment_status?: string
          po_number: string
          quote_id: string
          rfq_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_address?: string
          delivery_date?: string | null
          id?: string
          order_number?: string
          payment_status?: string
          po_number?: string
          quote_id?: string
          rfq_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      product_quotes: {
        Row: {
          created_at: string
          id: string
          lead_time: number
          product_id: string
          quote_id: string
          terms: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          lead_time: number
          product_id: string
          quote_id: string
          terms?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          lead_time?: number
          product_id?: string
          quote_id?: string
          terms?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_quotes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_quotes_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          manufacturer: string | null
          name: string
          quantity: number
          rfq_id: string
          target_lead_time: number | null
          target_price: number | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          manufacturer?: string | null
          name: string
          quantity?: number
          rfq_id: string
          target_lead_time?: number | null
          target_price?: number | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          manufacturer?: string | null
          name?: string
          quantity?: number
          rfq_id?: string
          target_lead_time?: number | null
          target_price?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_account: string | null
          company: string | null
          company_url: string | null
          created_at: string
          gst: string | null
          id: string
          mobile: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          company?: string | null
          company_url?: string | null
          created_at?: string
          gst?: string | null
          id: string
          mobile?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          company?: string | null
          company_url?: string | null
          created_at?: string
          gst?: string | null
          id?: string
          mobile?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          id: string
          quote_number: string
          rfq_id: string
          status: string
          supplier_id: string | null
          supplier_name: string
          total_amount: number
          updated_at: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          id?: string
          quote_number: string
          rfq_id: string
          status?: string
          supplier_id?: string | null
          supplier_name: string
          total_amount: number
          updated_at?: string
          valid_until: string
        }
        Update: {
          created_at?: string
          id?: string
          quote_number?: string
          rfq_id?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          rfq_number: string
          rfq_status: Database["public"]["Enums"]["rfq_status"] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          rfq_number: string
          rfq_status?: Database["public"]["Enums"]["rfq_status"] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          rfq_number?: string
          rfq_status?: Database["public"]["Enums"]["rfq_status"] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          name: string
          price: number | null
          price_max: number | null
          price_min: number | null
          sku: string | null
          status: string
          supplier_id: string | null
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          name: string
          price?: number | null
          price_max?: number | null
          price_min?: number | null
          sku?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          name?: string
          price?: number | null
          price_max?: number | null
          price_min?: number | null
          sku?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          company_name: string
          contact_info: Json | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_info?: Json | null
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      supplier_directory: {
        Row: {
          company: string | null
          company_url: string | null
          created_at: string | null
          id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      generate_rfq_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supplier" | "customer"
      rfq_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "supplier", "customer"],
      rfq_status: ["pending", "approved", "rejected"],
    },
  },
} as const
