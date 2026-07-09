import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeEvent } from "@/lib/events";
import {
  SEED_EVENTS,
  SEED_SLIDES,
  SEED_TEAM,
  SITE_CONTENT,
  type EventItem,
  type Slide,
  type TeamMember,
} from "@/lib/seed-data";

/**
 * Read-side data access. Every function returns live Supabase data when the
 * backend is configured, otherwise the bundled seed content — so the public
 * site is fully functional before the database exists.
 */

export async function getSlides(groupKey: string): Promise<Slide[]> {
  if (!isSupabaseConfigured) {
    return SEED_SLIDES.filter((s) => s.group_key === groupKey && s.is_active);
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("group_key", groupKey)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as Slide[];
}

export async function getPublishedEvents(): Promise<EventItem[]> {
  if (!isSupabaseConfigured) {
    return SEED_EVENTS.filter((e) => e.status === "published");
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: true });
  if (error || !data) return [];
  return data.map(normalizeEvent);
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  if (!isSupabaseConfigured) {
    return SEED_EVENTS.find((e) => e.slug === slug && e.status === "published") ?? null;
  }
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data ? normalizeEvent(data) : null;
}

export async function getTeam(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured) {
    return SEED_TEAM.filter((t) => t.is_active);
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return SEED_TEAM;
  return data as TeamMember[];
}

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  cover_image_orientation: "landscape" | "portrait";
  category: string;
  status: "draft" | "published";
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  published_at: string | null;
  created_at: string;
};

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return data as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return (data as BlogPost) ?? null;
}

/** Editable copy by key, falling back to the seeded default. */
export async function getContent(key: string): Promise<string> {
  if (!isSupabaseConfigured) return SITE_CONTENT[key] ?? "";
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .single();
  const value = data?.value;
  if (typeof value === "string") return value;
  return SITE_CONTENT[key] ?? "";
}
