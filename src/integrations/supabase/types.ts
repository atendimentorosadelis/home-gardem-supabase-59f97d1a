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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_generate_content: boolean
          can_manage_affiliates: boolean
          can_manage_articles: boolean
          can_manage_email_templates: boolean
          can_manage_image_library: boolean
          can_manage_image_queue: boolean
          can_manage_messages: boolean
          can_manage_newsletter: boolean
          can_manage_settings: boolean
          can_manage_users: boolean
          can_manage_videos: boolean
          can_use_autopilot: boolean
          can_use_video_autopilot: boolean
          created_at: string
          id: string
          is_super_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          can_generate_content?: boolean
          can_manage_affiliates?: boolean
          can_manage_articles?: boolean
          can_manage_email_templates?: boolean
          can_manage_image_library?: boolean
          can_manage_image_queue?: boolean
          can_manage_messages?: boolean
          can_manage_newsletter?: boolean
          can_manage_settings?: boolean
          can_manage_users?: boolean
          can_manage_videos?: boolean
          can_use_autopilot?: boolean
          can_use_video_autopilot?: boolean
          created_at?: string
          id?: string
          is_super_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          can_generate_content?: boolean
          can_manage_affiliates?: boolean
          can_manage_articles?: boolean
          can_manage_email_templates?: boolean
          can_manage_image_library?: boolean
          can_manage_image_queue?: boolean
          can_manage_messages?: boolean
          can_manage_newsletter?: boolean
          can_manage_settings?: boolean
          can_manage_users?: boolean
          can_manage_videos?: boolean
          can_use_autopilot?: boolean
          can_use_video_autopilot?: boolean
          created_at?: string
          id?: string
          is_super_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_banner_clicks: {
        Row: {
          article_id: string
          clicked_at: string
          id: string
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          article_id: string
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          article_id?: string
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_banner_clicks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_images: {
        Row: {
          article_id: string
          created_at: string
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          image_index: number | null
          image_type: string | null
          prompt: string | null
          public_url: string | null
          width: number | null
        }
        Insert: {
          article_id: string
          created_at?: string
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_index?: number | null
          image_type?: string | null
          prompt?: string | null
          public_url?: string | null
          width?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_index?: number | null
          image_type?: string | null
          prompt?: string | null
          public_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_images_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_videos: {
        Row: {
          article_id: string
          created_at: string
          id: string
          is_enabled: boolean | null
          updated_at: string
          video_title: string | null
          youtube_url: string
          youtube_video_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          video_title?: string | null
          youtube_url: string
          youtube_video_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          video_title?: string | null
          youtube_url?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_videos_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_views: {
        Row: {
          article_id: string
          id: string
          user_agent: string | null
          viewed_at: string
          viewer_ip: string | null
        }
        Insert: {
          article_id: string
          id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_ip?: string | null
        }
        Update: {
          article_id?: string
          id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_generation_config: {
        Row: {
          daily_limit: number | null
          enabled: boolean | null
          id: string
          publish_immediately: boolean | null
          topics: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          daily_limit?: number | null
          enabled?: boolean | null
          id?: string
          publish_immediately?: boolean | null
          topics?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          daily_limit?: number | null
          enabled?: boolean | null
          id?: string
          publish_immediately?: boolean | null
          topics?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      auto_generation_logs: {
        Row: {
          article_id: string | null
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          id: string
          status: string | null
          topic_used: string
        }
        Insert: {
          article_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          status?: string | null
          topic_used: string
        }
        Update: {
          article_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          status?: string | null
          topic_used?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_generation_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_generation_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_active: boolean | null
          time_slot: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_active?: boolean | null
          time_slot: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_active?: boolean | null
          time_slot?: string
        }
        Relationships: []
      }
      commemorative_date_settings: {
        Row: {
          date_id: string
          id: string
          is_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          date_id: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          date_id?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          replied_at: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          replied_at?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          replied_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      content_articles: {
        Row: {
          affiliate_banner_enabled: boolean | null
          affiliate_clicks_count: number | null
          author_id: string | null
          body: string | null
          category: string | null
          category_slug: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          gallery_images: Json | null
          id: string
          keywords: string | null
          likes_count: number | null
          published_at: string | null
          read_time: string | null
          slug: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          affiliate_banner_enabled?: boolean | null
          affiliate_clicks_count?: number | null
          author_id?: string | null
          body?: string | null
          category?: string | null
          category_slug?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_images?: Json | null
          id?: string
          keywords?: string | null
          likes_count?: number | null
          published_at?: string | null
          read_time?: string | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          affiliate_banner_enabled?: boolean | null
          affiliate_clicks_count?: number | null
          author_id?: string | null
          body?: string | null
          category?: string | null
          category_slug?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_images?: Json | null
          id?: string
          keywords?: string | null
          likes_count?: number | null
          published_at?: string | null
          read_time?: string | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generation_history: {
        Row: {
          article_id: string | null
          article_title: string | null
          created_at: string
          id: string
          status: string | null
          topic: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          article_title?: string | null
          created_at?: string
          id?: string
          status?: string | null
          topic: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          article_title?: string | null
          created_at?: string
          id?: string
          status?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generation_queue: {
        Row: {
          article_id: string
          created_at: string
          error_message: string | null
          id: string
          image_index: number | null
          image_type: string | null
          prompt: string
          public_url: string | null
          retry_count: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_index?: number | null
          image_type?: string | null
          prompt: string
          public_url?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_index?: number | null
          image_type?: string | null
          prompt?: string
          public_url?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_generation_queue_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "content_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      register_affiliate_click: {
        Args: {
          p_article_id: string
          p_ip_hash: string
          p_referrer?: string
          p_user_agent: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
