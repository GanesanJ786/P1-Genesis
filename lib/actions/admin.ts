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
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { parseMediaLinks } from "@/lib/events";
import type { Database } from "@/types/database.types";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

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
  // The media/registration columns are added by migration 0003. Include them,
  // but if the DB hasn't been migrated yet, retry without them so editing
  // events never breaks.
  const full: EventInsert = {
    ...base,
    registration_url: d.registration_url || null,
    media: parseMediaLinks(d.media_links),
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

  revalidatePublic(["/", "/events", `/events/${d.slug}`]);
  redirect("/admin/events");
}

/** Detect a "column does not exist" error so we can retry without new columns. */
function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  if (error.code === "PGRST204" || error.code === "42703") return true;
  const m = error.message ?? "";
  return /registration_url|'media'|\bmedia\b column|schema cache/i.test(m);
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
    logo_path: d.logo_path || null,
    website_url: d.website_url || null,
    amount_inr: d.amount_inr ?? null,
    is_active: d.is_active,
    sort_order: d.sort_order,
  };
  const { error } = id
    ? await supabase.from("sponsors").update(payload).eq("id", id)
    : await supabase.from("sponsors").insert(payload);
  if (error) return { ok: false, error: error.message };

  revalidatePublic(["/", "/sponsorship"]);
  redirect("/admin/sponsors");
}

export async function deleteSponsor(id: string, logo?: string | null) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("sponsors").delete().eq("id", id);
  await removeMedia(logo);
  revalidatePublic(["/", "/sponsorship"]);
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

  const payload = {
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt || null,
    body: d.body || null,
    cover_image: d.cover_image || null,
    category: d.category,
    status: d.status,
    ...(publishedAt !== undefined ? { published_at: publishedAt } : {}),
  };

  const { error } = id
    ? await supabase.from("blog_posts").update(payload).eq("id", id)
    : await supabase
        .from("blog_posts")
        .insert({ ...payload, created_by: profile.id, published_at: publishedAt ?? null });

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
/* Live results                                                                */
/* -------------------------------------------------------------------------- */

export async function clearLiveResults(): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("live_results")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  revalidatePath("/live");
  revalidatePath("/admin/live");
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
