export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          phone: string
          role: string
        }
        Insert: {
          id?: string
          phone: string
          role?: string
        }
        Update: {
          id?: string
          phone?: string
          role?: string
        }
        Relationships: []
      }
      berries: {
        Row: {
          id: number
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
        }
        Insert: {
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
        }
        Update: {
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          is_visible: boolean | null
          name: string
          parent_id: number | null
          slug: string
        }
        Insert: {
          id?: number
          is_visible?: boolean | null
          name: string
          parent_id?: number | null
          slug: string
        }
        Update: {
          id?: number
          is_visible?: boolean | null
          name?: string
          parent_id?: number | null
          slug?: string
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
      corporate_images: {
        Row: {
          created_at: string | null
          id: number
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          type?: string
          url?: string
        }
        Relationships: []
      }
      corporate_requests: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: number
          message: string | null
          name: string
          phone: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: number
          message?: string | null
          name: string
          phone: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: number
          message?: string | null
          name?: string
          phone?: string
        }
        Relationships: []
      }
      customer_stories: {
        Row: {
          customer_name: string
          date: string
          id: number
          is_visible: boolean | null
          photo_url: string
          review: string
        }
        Insert: {
          customer_name: string
          date: string
          id?: number
          is_visible?: boolean | null
          photo_url: string
          review: string
        }
        Update: {
          customer_name?: string
          date?: string
          id?: number
          is_visible?: boolean | null
          photo_url?: string
          review?: string
        }
        Relationships: []
      }
      flowers: {
        Row: {
          id: number
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
        }
        Insert: {
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
        }
        Update: {
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      images: {
        Row: {
          alt: string | null
          created_at: string | null
          id: number
          section: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string | null
          id?: number
          section: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string | null
          id?: number
          section?: string
          url?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          price: number
          product_id: number | null
          quantity: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          price: number
          product_id?: number | null
          quantity: number
        }
        Update: {
          id?: string
          order_id?: string | null
          price?: number
          product_id?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging: {
        Row: {
          id: number
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
        }
        Insert: {
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
        }
        Update: {
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: number
          product_id: number
        }
        Insert: {
          category_id: number
          product_id: number
        }
        Update: {
          category_id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcategories: {
        Row: {
          product_id: number
          subcategory_id: number
        }
        Insert: {
          product_id: number
          subcategory_id: number
        }
        Update: {
          product_id?: number
          subcategory_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bonus: number | null
          composition: string | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: number
          image_url: string | null
          images: string[] | null
          in_stock: boolean | null
          is_popular: boolean | null
          is_visible: boolean | null
          order_index: number | null
          original_price: number | null
          price: number
          production_time: number | null
          short_desc: string | null
          slug: string | null
          title: string
        }
        Insert: {
          bonus?: number | null
          composition?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: number
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_popular?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          original_price?: number | null
          price: number
          production_time?: number | null
          short_desc?: string | null
          slug?: string | null
          title: string
        }
        Update: {
          bonus?: number | null
          composition?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: number
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_popular?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          original_price?: number | null
          price?: number
          production_time?: number | null
          short_desc?: string | null
          slug?: string | null
          title?: string
        }
        Relationships: []
      }
      promo_blocks: {
        Row: {
          button_text: string | null
          href: string
          id: number
          image_url: string
          order_index: number | null
          subtitle: string | null
          title: string
          type: string
        }
        Insert: {
          button_text?: string | null
          href: string
          id?: number
          image_url: string
          order_index?: number | null
          subtitle?: string | null
          title: string
          type: string
        }
        Update: {
          button_text?: string | null
          href?: string
          id?: number
          image_url?: string
          order_index?: number | null
          subtitle?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          discount: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          page_href: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string | null
          discount?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          page_href?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          discount?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          page_href?: string | null
          used_count?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: number
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: number
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          href: string
          id: number
          label: string
          order_index: number | null
        }
        Insert: {
          href: string
          id?: number
          label: string
          order_index?: number | null
        }
        Update: {
          href?: string
          id?: number
          label?: string
          order_index?: number | null
        }
        Relationships: []
      }
      static_pages: {
        Row: {
          href: string
          id: number
          label: string
          order_index: number | null
        }
        Insert: {
          href: string
          id?: number
          label: string
          order_index?: number | null
        }
        Update: {
          href?: string
          id?: number
          label?: string
          order_index?: number | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          banner_active: boolean | null
          banner_message: string | null
          id: number
          order_acceptance_enabled: boolean | null
          order_acceptance_schedule: Json
          store_hours: Json
          updated_at: string | null
        }
        Insert: {
          banner_active?: boolean | null
          banner_message?: string | null
          id?: number
          order_acceptance_enabled?: boolean | null
          order_acceptance_schedule: Json
          store_hours: Json
          updated_at?: string | null
        }
        Update: {
          banner_active?: boolean | null
          banner_message?: string | null
          id?: number
          order_acceptance_enabled?: boolean | null
          order_acceptance_schedule?: Json
          store_hours?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: number | null
          id: number
          is_visible: boolean | null
          label: string | null
          name: string
          slug: string
        }
        Insert: {
          category_id?: number | null
          id?: number
          is_visible?: boolean | null
          label?: string | null
          name: string
          slug: string
        }
        Update: {
          category_id?: number | null
          id?: number
          is_visible?: boolean | null
          label?: string | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subcategories_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_items: {
        Row: {
          category: string
          category_id: number | null
          id: string
          image_url: string
          price: number
          title: string
        }
        Insert: {
          category: string
          category_id?: number | null
          id: string
          image_url: string
          price: number
          title: string
        }
        Update: {
          category?: string
          category_id?: number | null
          id?: string
          image_url?: string
          price?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_balance_and_log: {
        Args: { p_user_id: string; p_amount: number; p_reason: string }
        Returns: boolean
      }
      increment_balance: {
        Args: { user_id: string; amount: number }
        Returns: undefined
      }
      increment_balance_and_log: {
        Args: { p_user_id: string; p_amount: number; p_reason: string }
        Returns: undefined
      }
      table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
