// @/types/index.ts

// Определение типа Json
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Определение интерфейса PromoBlock
export interface PromoBlock {
  id: number;
  title: string;
  subtitle?: string | null;
  button_text?: string | null;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  order_index?: number | null;
}

// Определение типов для базы данных (на основе вашего index.ts)
export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          phone: string;
          role: string;
        };
        Insert: {
          id?: string;
          phone: string;
          role?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          role?: string;
        };
        Relationships: [];
      };
      berries: {
        Row: {
          id: number;
          image_url: string | null;
          is_available: boolean | null;
          name: string;
          price: number;
        };
        Insert: {
          id?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          name: string;
          price: number;
        };
        Update: {
          id?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      bonus_history: {
        Row: {
          amount: number | null;
          created_at: string | null;
          id: string;
          reason: string | null;
          user_id: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string | null;
          id?: string;
          reason?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string | null;
          id?: string;
          reason?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      bonuses: {
        Row: {
          bonus_balance: number | null;
          id: string;
          level: string | null;
          phone: string;
          total_bonus: number;
          total_spent: number | null;
          updated_at: string | null;
        };
        Insert: {
          bonus_balance?: number | null;
          id?: string;
          level?: string | null;
          phone: string;
          total_bonus?: number;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Update: {
          bonus_balance?: number | null;
          id?: string;
          level?: string | null;
          phone?: string;
          total_bonus?: number;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          parent_id: number | null;
          slug: string;
        };
        Insert: {
          id?: number;
          name: string;
          parent_id?: number | null;
          slug: string;
        };
        Update: {
          id?: number;
          name?: string;
          parent_id?: number | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      corporate_images: {
        Row: {
          created_at: string | null;
          id: number;
          type: string;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          type: string;
          url: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          type?: string;
          url?: string;
        };
        Relationships: [];
      };
      corporate_requests: {
        Row: {
          company: string | null;
          created_at: string | null;
          email: string;
          id: number;
          message: string | null;
          name: string;
          phone: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string | null;
          email: string;
          id?: number;
          message?: string | null;
          name: string;
          phone: string;
        };
        Update: {
          company?: string | null;
          created_at?: string | null;
          email?: string;
          id?: number;
          message?: string | null;
          name?: string;
          phone?: string;
        };
        Relationships: [];
      };
      customer_stories: {
        Row: {
          customer_name: string;
          date: string;
          id: number;
          is_visible: boolean | null;
          photo_url: string;
          review: string;
        };
        Insert: {
          customer_name: string;
          date: string;
          id?: number;
          is_visible?: boolean | null;
          photo_url: string;
          review: string;
        };
        Update: {
          customer_name?: string;
          date?: string;
          id?: number;
          is_visible?: boolean | null;
          photo_url?: string;
          review?: string;
        };
        Relationships: [];
      };
      flowers: {
        Row: {
          id: number;
          image_url: string | null;
          is_available: boolean | null;
          name: string;
          price: number;
        };
        Insert: {
          id?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          name: string;
          price: number;
        };
        Update: {
          id?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      images: {
        Row: {
          alt: string | null;
          created_at: string | null;
          id: number;
          section: string;
          url: string;
        };
        Insert: {
          alt?: string | null;
          created_at?: string | null;
          id?: number;
          section: string;
          url: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string | null;
          id?: number;
          section?: string;
          url?: string;
        };
        Relationships: [];
      };
      important_dates: {
        Row: {
          anniversary: string | null;
          birthday: string | null;
          created_at: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          anniversary?: string | null;
          birthday?: string | null;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          anniversary?: string | null;
          birthday?: string | null;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          price: number;
          product_id: number | null;
          quantity: number;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          price: number;
          product_id?: number | null;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          price?: number;
          product_id?: number | null;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          bonus: number;
          bonus_used: number | null;
          bonuses_used: number | null;
          contact_name: string | null;
          created_at: string | null;
          delivery_date: string | null;
          delivery_instructions: string | null;
          delivery_method: string | null;
          delivery_time: string | null;
          id: string;
          items: Json | null;
          name: string | null;
          order_number: number;
          payment_method: string | null;
          phone: string | null;
          postcard_text: string | null;
          promo_code: string | null;
          promo_discount: number | null;
          promo_id: string | null;
          recipient: string;
          status: string | null;
          total: number | null;
          upsell_details: Json | null;
          whatsapp: boolean | null;
        };
        Insert: {
          address: string;
          bonus: number;
          bonus_used?: number | null;
          bonuses_used?: number | null;
          contact_name?: string | null;
          created_at?: string | null;
          delivery_date?: string | null;
          delivery_instructions?: string | null;
          delivery_method?: string | null;
          delivery_time?: string | null;
          id?: string;
          items?: Json | null;
          name?: string | null;
          order_number?: number;
          payment_method?: string | null;
          phone?: string | null;
          postcard_text?: string | null;
          promo_code?: string | null;
          promo_discount?: number | null;
          promo_id?: string | null;
          recipient: string;
          status?: string | null;
          total?: number | null;
          upsell_details?: Json | null;
          whatsapp?: boolean | null;
        };
        Update: {
          address?: string;
          bonus?: number;
          bonus_used?: number | null;
          bonuses_used?: number | null;
          contact_name?: string | null;
          created_at?: string | null;
          delivery_date?: string | null;
          delivery_instructions?: string | null;
          delivery_method?: string | null;
          delivery_time?: string | null;
          id?: string;
          items?: Json | null;
          name?: string | null;
          order_number?: number;
          payment_method?: string | null;
          phone?: string | null;
          postcard_text?: string | null;
          promo_code?: string | null;
          promo_discount?: number | null;
          promo_id?: string | null;
          recipient?: string;
          status?: string | null;
          total?: number | null;
          upsell_details?: Json | null;
          whatsapp?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_promo_id_fkey';
            columns: ['promo_id'];
            isOneToOne: false;
            referencedRelation: 'promo_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      packaging: {
        Row: {
          id: number;
          image_url: string | null;
          is_available: boolean | null;
          name: string;
          price: number;
        };
        Insert: {
          id?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          name: string;
          price: number;
        };
        Update: {
          id?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          bonus: number | null;
          category: string | null;
          category_id: number | null;
          composition: string | null;
          created_at: string | null;
          description: string | null;
          discount_percent: number | null;
          id: number;
          image_url: string | null;
          images: string[] | null;
          in_stock: boolean | null;
          is_popular: boolean | null;
          is_visible: boolean | null;
          original_price: number | null;
          price: number;
          short_desc: string | null;
          slug: string | null;
          subcategory_id: number | null;
          title: string;
        };
        Insert: {
          bonus?: number | null;
          category?: string | null;
          category_id?: number | null;
          composition?: string | null;
          created_at?: string | null;
          description?: string | null;
          discount_percent?: number | null;
          id?: number;
          image_url?: string | null;
          images?: string[] | null;
          in_stock?: boolean | null;
          is_popular?: boolean | null;
          is_visible?: boolean | null;
          original_price?: number | null;
          price: number;
          short_desc?: string | null;
          slug?: string | null;
          subcategory_id?: number | null;
          title: string;
        };
        Update: {
          bonus?: number | null;
          category?: string | null;
          category_id?: number | null;
          composition?: string | null;
          created_at?: string | null;
          description?: string | null;
          discount_percent?: number | null;
          id?: number;
          image_url?: string | null;
          images?: string[] | null;
          in_stock?: boolean | null;
          is_popular?: boolean | null;
          is_visible?: boolean | null;
          original_price?: number | null;
          price?: number;
          short_desc?: string | null;
          slug?: string | null;
          subcategory_id?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_subcategory';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
        ];
      };
      promo_blocks: {
        Row: {
          button_text: string | null;
          href: string;
          id: number;
          image_url: string;
          order_index: number | null;
          subtitle: string | null;
          title: string;
          type: string;
        };
        Insert: {
          button_text?: string | null;
          href: string;
          id?: number;
          image_url: string;
          order_index?: number | null;
          subtitle?: string | null;
          title: string;
          type: string;
        };
        Update: {
          button_text?: string | null;
          href?: string;
          id?: number;
          image_url?: string;
          order_index?: number | null;
          subtitle?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          code: string;
          created_at: string | null;
          discount: number;
          discount_type: string;
          discount_value: number;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          max_uses: number | null;
          page_href: string | null;
          used_count: number;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          discount?: number;
          discount_type?: string;
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          page_href?: string | null;
          used_count?: number;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          discount?: number;
          discount_type?: string;
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          page_href?: string | null;
          used_count?: number;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: number;
          key: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          id?: number;
          key: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          id?: number;
          key?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      site_pages: {
        Row: {
          href: string;
          id: number;
          label: string;
          order_index: number | null;
        };
        Insert: {
          href: string;
          id?: number;
          label: string;
          order_index?: number | null;
        };
        Update: {
          href?: string;
          id?: number;
          label?: string;
          order_index?: number | null;
        };
        Relationships: [];
      };
      sms_codes: {
        Row: {
          code: string | null;
          created_at: string | null;
          phone: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          phone: string;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          phone?: string;
        };
        Relationships: [];
      };
      static_pages: {
        Row: {
          href: string;
          id: number;
          label: string;
          order_index: number | null;
        };
        Insert: {
          href: string;
          id?: number;
          label: string;
          order_index?: number | null;
        };
        Update: {
          href?: string;
          id?: number;
          label?: string;
          order_index?: number | null;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          banner_active: boolean | null;
          banner_message: string | null;
          id: number;
          order_acceptance_enabled: boolean | null;
          order_acceptance_schedule: Json;
          store_hours: Json;
          updated_at: string | null;
        };
        Insert: {
          banner_active?: boolean | null;
          banner_message?: string | null;
          id?: number;
          order_acceptance_enabled?: boolean | null;
          order_acceptance_schedule: Json;
          store_hours: Json;
          updated_at?: string | null;
        };
        Update: {
          banner_active?: boolean | null;
          banner_message?: string | null;
          id?: number;
          order_acceptance_enabled?: boolean | null;
          order_acceptance_schedule?: Json;
          store_hours?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subcategories: {
        Row: {
          category_id: number | null;
          id: number;
          label: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          category_id?: number | null;
          id?: number;
          label?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          category_id?: number | null;
          id?: number;
          label?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_subcategories_category_id';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subcategories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      upsell_items: {
        Row: {
          category: string;
          id: string;
          image_url: string;
          price: number;
          title: string;
        };
        Insert: {
          category: string;
          id: string;
          image_url: string;
          price: number;
          title: string;
        };
        Update: {
          category?: string;
          id?: string;
          image_url?: string;
          price?: number;
          title?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_balance_and_log: {
        Args: { p_user_id: string; p_amount: number; p_reason: string };
        Returns: boolean;
      };
      increment_balance: {
        Args: { user_id: string; amount: number };
        Returns: undefined;
      };
      table_exists: {
        Args: { table_name: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;