import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];

/**
 * Admin-side reads. These run under the logged-in staff session, so RLS returns
 * ALL rows (including drafts / inactive) — unlike the public queries.
 */

export async function listEvents(): Promise<Tables["events"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getEvent(id: string): Promise<Tables["events"]["Row"] | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  return data ?? null;
}

export async function listSlides(): Promise<Tables["slides"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("slides")
    .select("*")
    .order("group_key", { ascending: true })
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getSlide(id: string): Promise<Tables["slides"]["Row"] | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("slides").select("*").eq("id", id).single();
  return data ?? null;
}

export async function listSponsors(): Promise<Tables["sponsors"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getSponsor(id: string): Promise<Tables["sponsors"]["Row"] | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("sponsors").select("*").eq("id", id).single();
  return data ?? null;
}

export async function listTeam(): Promise<Tables["team_members"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getTeamMember(id: string): Promise<Tables["team_members"]["Row"] | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("team_members").select("*").eq("id", id).single();
  return data ?? null;
}

export async function listContent(): Promise<Tables["site_content"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("*")
    .order("key", { ascending: true });
  return data ?? [];
}

export async function countSubmissions(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("contact_submissions")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}
