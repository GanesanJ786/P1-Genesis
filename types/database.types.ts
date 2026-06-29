/**
 * Database types. Hand-authored to match supabase/migrations.
 * Regenerate anytime with:
 *   supabase gen types typescript --linked > types/database.types.ts
 */

export type UserRole = "admin" | "staff" | "coach";
export type EventStatus = "draft" | "published" | "archived";
export type SponsorTier = "title" | "platinum" | "gold" | "silver" | "supporter";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string | null;
          body: string | null;
          cover_image: string | null;
          start_date: string | null;
          end_date: string | null;
          location: string | null;
          status: EventStatus;
          sort_order: number;
          registration_url: string | null;
          media: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          summary?: string | null;
          body?: string | null;
          cover_image?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          status?: EventStatus;
          sort_order?: number;
          registration_url?: string | null;
          media?: Json;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      slides: {
        Row: {
          id: string;
          group_key: string;
          title: string | null;
          subtitle: string | null;
          image_path: string | null;
          link_url: string | null;
          event_id: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_key?: string;
          title?: string | null;
          subtitle?: string | null;
          image_path: string;
          link_url?: string | null;
          event_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["slides"]["Insert"]>;
        Relationships: [];
      };
      sponsors: {
        Row: {
          id: string;
          name: string;
          tier: SponsorTier;
          logo_path: string | null;
          website_url: string | null;
          amount_inr: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tier: SponsorTier;
          logo_path?: string | null;
          website_url?: string | null;
          amount_inr?: number | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Insert"]>;
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          role_title: string | null;
          bio: string | null;
          photo_path: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          role_title?: string | null;
          bio?: string | null;
          photo_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
        Relationships: [];
      };
      site_content: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json };
        Update: { key?: string; value?: Json };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          message?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["contact_submissions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      event_status: EventStatus;
      sponsor_tier: SponsorTier;
    };
  };
}
