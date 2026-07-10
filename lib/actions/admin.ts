"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { STORAGE_BUCKET } from "@/lib/constants";
import {
  eventSchema,
  slideSchema,
  sponsorSchema,
  teamMemberSchema,
  blogPostSchema,
  liveItemSchema,
  announcementSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { parseMediaLinks } from "@/lib/events";
import { isMissingColumnError } from "@/lib/supabase/errors";
import type { Finisher } from "@/lib/live";
import type { Database, LiveStatus } from "@/types/database.types";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type LiveInsert = Database["public"]["Tables"]["live_results"]["Insert"];

export type ActionResult = { ok: boolean; error?: string };

/** Re-render the public pages affected by a content change. */
function revalidatePublic(paths: string[] = ["/"]) {
  for (const p of paths) revalidatePath(p);
}

/** Remove an object from the public-media bucket (best effort). */
async function removeMedia(path?: string | null) {
  if (!path || path.startsWith("http") || path.startsWith("/")) return;
  try {
    const admin = createAdminClient();
    await admin.storage.from(STORAGE_BUCKET).remove([path]);
  } catch {
    // Non-fatal: orphaned object can be cleaned up later.
  }
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveEvent(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = eventSchema.safeParse({
    ...raw,
    slug: raw.slug || slugify(raw.title ?? ""),
    live_tracking: raw.live_tracking === "on" || raw.live_tracking === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const base: EventInsert = {
    title: d.title,
    slug: d.slug,
    summary: d.summary || null,
    body: d.body || null,
    cover_image: d.cover_image || null,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    location: d.location || null,
    status: d.status,
    sort_order: d.sort_order,
  };
  // The media/registration columns are added by migration 0003 and
  // live_tracking by 0006. Include them, but if the DB hasn't been migrated
  // yet, retry without them so editing events never breaks.
  const full: EventInsert = {
    ...base,
    registration_url: d.registration_url || null,
    media: parseMediaLinks(d.media_links),
    live_tracking: d.live_tracking,
  };

  const save = (payload: EventInsert) =>
    id
      ? supabase.from("events").update(payload).eq("id", id)
      : supabase.from("events").insert({ ...payload, created_by: profile.id });

  let { error } = await save(full);
  if (error && isMissingColumnError(error)) {
    ({ error } = await save(base));
  }

  if (error) return { ok: false, error: error.message };

  // Per-event sponsor showcase: sync the junction only when the form rendered
  // the picker (marker field), so older/other forms can't wipe assignments.
  // Best-effort — a database without migration 0006 skips silently.
  if (formData.get("sponsor_ids_present")) {
    let eventId = id;
    if (!eventId) {
      const { data } = await supabase
        .from("events")
        .select("id")
        .eq("slug", d.slug)
        .single();
      eventId = data?.id ?? null;
    }
    if (eventId) {
      const sponsorIds = formData
        .getAll("sponsor_ids")
        .map(String)
        .filter(Boolean);
      const { error: clearError } = await supabase
        .from("event_sponsors")
        .delete()
        .eq("event_id", eventId);
      if (!clearError && sponsorIds.length > 0) {
        await supabase.from("event_sponsors").insert(
          sponsorIds.map((sponsor_id, i) => ({
            event_id: eventId,
            sponsor_id,
            sort_order: i,
          })),
        );
      }
    }
  }

  revalidatePublic(["/", "/events", `/events/${d.slug}`, "/live", `/live/${d.slug}`]);
  redirect("/admin/events");
}

export async function deleteEvent(id: string, cover?: string | null) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  await removeMedia(cover);
  revalidatePublic(["/", "/events"]);
  revalidatePath("/admin/events");
}

/* -------------------------------------------------------------------------- */
/* Slides                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveSlide(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = slideSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on" || raw.is_active === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const payload = {
    group_key: d.group_key,
    title: d.title || null,
    subtitle: d.subtitle || null,
    image_path: d.image_path,
    link_url: d.link_url || null,
    sort_order: d.sort_order,
    is_active: d.is_active,
  };

  const { error } = id
    ? await supabase.from("slides").update(payload).eq("id", id)
    : await supabase.from("slides").insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidatePublic(["/"]);
  redirect("/admin/slides");
}

export async function deleteSlide(id: string, image?: string | null) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("slides").delete().eq("id", id);
  await removeMedia(image);
  revalidatePublic(["/"]);
  revalidatePath("/admin/slides");
}

export async function toggleSlideActive(id: string, next: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("slides").update({ is_active: next }).eq("id", id);
  revalidatePublic(["/"]);
  revalidatePath("/admin/slides");
}

/* -------------------------------------------------------------------------- */
/* Sponsors                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveSponsor(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = sponsorSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on" || raw.is_active === "true",
    amount_inr: raw.amount_inr || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const supabase = await createClient();
  const payload = {
    name: d.name,
    tier: d.tier,
    description: d.description || null,
    logo_path: d.logo_path || null,
    banner_path: d.banner_path || null,
    website_url: d.website_url || null,
    amount_inr: d.amount_inr ?? null,
    is_active: d.is_active,
    sort_order: d.sort_order,
  };
  let sponsorId = id;
  if (id) {
    const { error } = await supabase.from("sponsors").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("sponsors")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    sponsorId = data?.id ?? null;
  }

  // Sync which live events showcase this sponsor (sponsor-side picker). Scoped
  // to currently live-tracked events so links to other events stay untouched;
  // mirrors the event-side EventSponsorPicker on the other axis of the junction.
  if (sponsorId && formData.get("event_ids_present")) {
    const selected = formData.getAll("event_ids").map(String).filter(Boolean);
    const { data: liveEvents } = await supabase
      .from("events")
      .select("id")
      .eq("live_tracking", true);
    const candidateIds = (liveEvents ?? []).map((e) => e.id);
    if (candidateIds.length > 0) {
      await supabase
        .from("event_sponsors")
        .delete()
        .eq("sponsor_id", sponsorId)
        .in("event_id", candidateIds);
      const toInsert = selected.filter((eid) => candidateIds.includes(eid));
      if (toInsert.length > 0) {
        await supabase.from("event_sponsors").insert(
          toInsert.map((event_id) => ({
            event_id,
            sponsor_id: sponsorId,
            sort_order: d.sort_order,
          })),
        );
      }
    }
  }

  // Sponsors also surface on the live-event pages (via event_sponsors).
  revalidatePublic(["/", "/sponsorship", "/live"]);
  redirect("/admin/sponsors");
}

export async function deleteSponsor(
  id: string,
  logo?: string | null,
  banner?: string | null,
) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("sponsors").delete().eq("id", id);
  await removeMedia(logo);
  await removeMedia(banner);
  revalidatePublic(["/", "/sponsorship", "/live"]);
  revalidatePath("/admin/sponsors");
}

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

export async function saveTeamMember(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = teamMemberSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on" || raw.is_active === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const supabase = await createClient();
  const payload = {
    name: d.name,
    role_title: d.role_title || null,
    bio: d.bio || null,
    photo_path: d.photo_path || null,
    sort_order: d.sort_order,
    is_active: d.is_active,
  };
  const { error } = id
    ? await supabase.from("team_members").update(payload).eq("id", id)
    : await supabase.from("team_members").insert(payload);
  if (error) return { ok: false, error: error.message };

  revalidatePublic(["/", "/team"]);
  redirect("/admin/team");
}

export async function deleteTeamMember(id: string, photo?: string | null) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", id);
  await removeMedia(photo);
  revalidatePublic(["/", "/team"]);
  revalidatePath("/admin/team");
}

/* -------------------------------------------------------------------------- */
/* Blog posts                                                                 */
/* -------------------------------------------------------------------------- */

export async function saveBlogPost(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = blogPostSchema.safeParse({
    ...raw,
    slug: raw.slug || slugify(raw.title ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const publishedAt =
    d.status === "published"
      ? id
        ? undefined
        : new Date().toISOString()
      : null;

  const base = {
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt || null,
    body: d.body || null,
    cover_image: d.cover_image || null,
    category: d.category,
    status: d.status,
    meta_title: d.meta_title || null,
    meta_description: d.meta_description || null,
    focus_keyword: d.focus_keyword || null,
    ...(publishedAt !== undefined ? { published_at: publishedAt } : {}),
  };
  // cover_image_orientation (0004) and sort_order (0005) are additive migrations.
  // Include them, but if the DB hasn't been migrated yet, retry without them so
  // editing posts never breaks.
  const full = {
    ...base,
    cover_image_orientation: d.cover_image_orientation,
    sort_order: d.sort_order,
  };

  const save = (payload: typeof base | typeof full) =>
    id
      ? supabase.from("blog_posts").update(payload).eq("id", id)
      : supabase
          .from("blog_posts")
          .insert({ ...payload, created_by: profile.id, published_at: publishedAt ?? null });

  let { error } = await save(full);
  if (error && isMissingColumnError(error)) {
    ({ error } = await save(base));
  }

  if (error) return { ok: false, error: error.message };

  revalidatePublic(["/blog", `/blog/${d.slug}`, "/"]);
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string, cover?: string | null) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  await removeMedia(cover);
  revalidatePublic(["/blog", "/"]);
  revalidatePath("/admin/blog");
}

/* -------------------------------------------------------------------------- */
/* Site content (editable copy)                                               */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Live hub: schedule items, statuses, announcements                          */
/* -------------------------------------------------------------------------- */

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Slug of a live event, for revalidating its public page (best effort). */
async function liveEventSlug(
  supabase: SupabaseServer,
  eventId: string | null | undefined,
): Promise<string | null> {
  if (!eventId) return null;
  const { data } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .maybeSingle();
  return data?.slug ?? null;
}

function revalidateLive(slug: string | null) {
  revalidatePath("/live");
  if (slug) revalidatePath(`/live/${slug}`);
  revalidatePath("/admin/live");
}

/** Assemble the fixed 6-row results editor (bib_1…6 etc.) into finishers. */
function finishersFromForm(raw: Record<string, string>): Finisher[] {
  const out: Finisher[] = [];
  for (let i = 1; i <= 6; i += 1) {
    const name = (raw[`name_${i}`] ?? "").trim();
    if (!name) continue; // empty rows are dropped
    const bib = (raw[`bib_${i}`] ?? "").trim();
    const record = (raw[`record_${i}`] ?? "").trim();
    out.push({
      rank: i,
      ...(bib ? { bib } : {}),
      name,
      school: (raw[`school_${i}`] ?? "").trim(),
      result: (raw[`mark_${i}`] ?? "").trim(),
      ...(record ? { record } : {}),
    });
  }
  return out;
}

/** datetime-local is timezone-naive; the meet runs in IST. */
function toIstTimestamp(value: string): string {
  const base = value.length === 16 ? `${value}:00` : value;
  return `${base}+05:30`;
}

export async function saveLiveItem(
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = liveItemSchema.safeParse({
    ...raw,
    participants_count: raw.participants_count || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const eventKey = d.event_key
    ? slugify(d.event_key)
    : slugify(
        [d.event_name, d.category, d.gender, `d${d.day}`, d.heat_label || "final"]
          .filter(Boolean)
          .join(" "),
      );

  const base: LiveInsert = {
    event_key: eventKey,
    event_name: d.event_name,
    category: d.category,
    gender: d.gender || null,
    event_type: d.event_type || null,
    heat_label: d.heat_label || null,
    day: d.day,
    sort_order: d.sort_order,
    status: d.status,
    results: finishersFromForm(raw),
    notes: d.notes || null,
    updated_at: new Date().toISOString(),
  };
  // Schedule-metadata columns are added by migration 0006; retry without them
  // on an un-migrated database (a 'paused' status still needs the migration).
  const full: LiveInsert = {
    ...base,
    event_id: d.event_id,
    scheduled_at: d.scheduled_at ? toIstTimestamp(d.scheduled_at) : null,
    venue: d.venue || null,
    poc_name: d.poc_name || null,
    poc_phone: d.poc_phone || null,
    wind: d.wind || null,
    participants_count: d.participants_count ?? null,
    media: parseMediaLinks(d.media_links),
  };

  const save = (payload: LiveInsert) =>
    id
      ? supabase.from("live_results").update(payload).eq("id", id)
      : supabase.from("live_results").insert(payload);

  let { error } = await save(full);
  if (error && isMissingColumnError(error)) {
    ({ error } = await save(base));
  }

  if (error) return { ok: false, error: error.message };

  revalidateLive(await liveEventSlug(supabase, d.event_id));
  redirect("/admin/live");
}

export async function deleteLiveItem(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("live_results")
    .select("event_id")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("live_results").delete().eq("id", id);
  revalidateLive(await liveEventSlug(supabase, data?.event_id));
}

/** One-tap status switch (Upcoming | Live | Paused | Done) on /admin/live. */
export async function setLiveItemStatus(
  id: string,
  status: LiveStatus,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("live_results")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("event_id")
    .maybeSingle();
  revalidateLive(await liveEventSlug(supabase, data?.event_id));
}

/** Wipe one event's schedule/results (start-of-day reset). */
export async function clearLiveResults(eventId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("live_results").delete().eq("event_id", eventId);
  revalidateLive(await liveEventSlug(supabase, eventId));
}

/** Attach rows created before migration 0006 (event_id null) to an event. */
export async function adoptUnassignedLiveItems(eventId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("live_results")
    .update({ event_id: eventId })
    .is("event_id", null);
  revalidateLive(await liveEventSlug(supabase, eventId));
}

export async function postAnnouncement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = announcementSchema.safeParse({
    ...raw,
    is_pinned: raw.is_pinned === "on" || raw.is_pinned === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    event_id: d.event_id,
    message: d.message,
    type: d.type,
    is_pinned: d.is_pinned,
    created_by: profile.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidateLive(await liveEventSlug(supabase, d.event_id));
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("event_id")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("announcements").delete().eq("id", id);
  revalidateLive(await liveEventSlug(supabase, data?.event_id));
}

export async function toggleAnnouncementPinned(
  id: string,
  next: boolean,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .update({ is_pinned: next })
    .eq("id", id)
    .select("event_id")
    .maybeSingle();
  revalidateLive(await liveEventSlug(supabase, data?.event_id));
}

export async function saveContent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "");
  if (!key) return { ok: false, error: "Key is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  revalidatePublic(["/"]);
  return { ok: true };
}
