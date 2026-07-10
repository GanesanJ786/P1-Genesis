import { createClient } from "@/lib/supabase/server";
import { normalizeLiveItem } from "@/lib/live";
import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];

export async function listBlogPosts(): Promise<Tables["blog_posts"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getBlogPost(id: string): Promise<Tables["blog_posts"]["Row"] | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  return data ?? null;
}

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

/* -------------------------------------------------------------------------- */
/* Live hub                                                                   */
/* -------------------------------------------------------------------------- */

/** Events available in the Live Hub manager (any status, live-tracked). */
export async function listLiveTrackedEvents(): Promise<Tables["events"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("live_tracking", true)
    .order("start_date", { ascending: false });
  return data ?? [];
}

/**
 * Schedule items for one event (or all rows when the event filter fails, e.g.
 * a database that hasn't run migration 0006 — keeps the admin table usable).
 */
export async function listLiveItems(
  eventId: string | null,
): Promise<Tables["live_results"]["Row"][]> {
  const supabase = await createClient();
  const query = supabase
    .from("live_results")
    .select("*")
    .order("day", { ascending: true })
    .order("sort_order", { ascending: true });
  if (eventId) {
    const { data, error } = await query.eq("event_id", eventId);
    if (!error) return (data ?? []).map(normalizeLiveItem);
  }
  const { data } = await supabase
    .from("live_results")
    .select("*")
    .order("day", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []).map(normalizeLiveItem);
}

export async function getLiveItem(
  id: string,
): Promise<Tables["live_results"]["Row"] | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("live_results")
    .select("*")
    .eq("id", id)
    .single();
  return data ? normalizeLiveItem(data) : null;
}

export async function listAnnouncements(
  eventId: string,
): Promise<Tables["announcements"]["Row"][]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("event_id", eventId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Sponsor ids assigned to an event (for the EventForm picker). */
export async function listEventSponsorIds(eventId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_sponsors")
    .select("sponsor_id")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => r.sponsor_id);
}

/** Rows created before migration 0006 that no event has adopted yet. */
export async function countUnassignedLiveItems(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("live_results")
    .select("*", { count: "exact", head: true })
    .is("event_id", null);
  if (error) return 0;
  return count ?? 0;
}
