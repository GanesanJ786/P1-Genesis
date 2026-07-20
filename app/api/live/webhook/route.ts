import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingColumnError } from "@/lib/supabase/errors";
import type { Json } from "@/types/database.types";

type ResultRow = {
  rank: number;
  bib?: string;
  name: string;
  school: string;
  result: string;
  record?: string;
};

type LiveResultPayload = {
  event_key: string;
  event_name: string;
  category: string;
  gender?: string | null;
  event_type?: string | null;
  heat_label?: string | null;
  day?: number;
  sort_order?: number;
  status?: string;
  results?: ResultRow[];
  notes?: string | null;
  /** Live-hub event this row belongs to; falls back to the default event. */
  event_slug?: string | null;
  // Schedule metadata is normally admin-entered. The sheet may send these,
  // but absent keys never overwrite what admin saved (presence rule below).
  scheduled_at?: string | null;
  venue?: string | null;
  poc_name?: string | null;
  poc_phone?: string | null;
  wind?: string | null;
  participants_count?: number | null;
  media?: unknown;
};

const VALID_STATUSES = ["upcoming", "finalist", "in_progress", "paused", "completed"] as const;
const STATUS_ALIASES: Record<string, (typeof VALID_STATUSES)[number]> = {
  live: "in_progress",
};

function normalizeStatus(status: unknown): (typeof VALID_STATUSES)[number] {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (normalized in STATUS_ALIASES) return STATUS_ALIASES[normalized];
  return (VALID_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as (typeof VALID_STATUSES)[number])
    : "upcoming";
}

type EventRef = { id: string; slug: string } | null;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  const expected = process.env.LIVE_WEBHOOK_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    results?: LiveResultPayload[];
    event_slug?: string | null;
    /** Event Keys the sheet no longer has (row deleted) — mirror as deletes. */
    deleted_keys?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = Array.isArray(body.results) ? body.results : [];
  const deletedKeys = Array.isArray(body.deleted_keys)
    ? body.deleted_keys.filter((k): k is string => typeof k === "string" && k.length > 0)
    : [];
  if (rows.length === 0 && deletedKeys.length === 0) {
    return NextResponse.json({ error: "No results provided" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Resolve event slugs → ids once per request. The deployed Apps Script sends
  // no slug at all: those rows fall back to the default live-tracked event, so
  // legacy payloads keep working and self-heal event_id on existing rows.
  const eventCache = new Map<string, EventRef>();
  const bySlug = async (slug: string): Promise<EventRef> => {
    const cached = eventCache.get(slug);
    if (cached !== undefined) return cached;
    const { data } = await supabase
      .from("events")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();
    const ref = data ? { id: data.id, slug: data.slug } : null;
    eventCache.set(slug, ref);
    return ref;
  };
  let defaultEvent: EventRef | undefined;
  const getDefaultEvent = async (): Promise<EventRef> => {
    if (defaultEvent !== undefined) return defaultEvent;
    const envSlug = process.env.LIVE_DEFAULT_EVENT_SLUG;
    if (envSlug) {
      defaultEvent = await bySlug(envSlug);
      if (defaultEvent) return defaultEvent;
    }
    // Newest live-tracked event; errors (e.g. un-migrated DB) → null.
    const { data } = await supabase
      .from("events")
      .select("id, slug")
      .eq("live_tracking", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    defaultEvent = data ? { id: data.id, slug: data.slug } : null;
    return defaultEvent;
  };
  const resolveEvent = async (r: LiveResultPayload): Promise<EventRef> => {
    const slug = r.event_slug ?? body.event_slug;
    return slug ? await bySlug(slug) : await getDefaultEvent();
  };

  const now = new Date().toISOString();
  // Columns the sheet has always owned — written unconditionally.
  const legacyPayload = (r: LiveResultPayload) => ({
    event_key: r.event_key,
    event_name: r.event_name,
    category: r.category,
    gender: r.gender ?? null,
    event_type: r.event_type ?? null,
    heat_label: r.heat_label ?? null,
    day: r.day ?? 1,
    sort_order: r.sort_order ?? 0,
    status: normalizeStatus(r.status),
    results: r.results ?? [],
    notes: r.notes ?? null,
    updated_at: now,
  });
  // New (0006) columns are admin-entered schedule metadata: include them only
  // when the sheet explicitly sends the key, so an ordinary results push never
  // nulls out what admin saved.
  const fullPayload = (r: LiveResultPayload, event: EventRef) => ({
    ...legacyPayload(r),
    event_id: event?.id ?? null,
    ...("scheduled_at" in r ? { scheduled_at: r.scheduled_at ?? null } : {}),
    ...("venue" in r ? { venue: r.venue ?? null } : {}),
    ...("poc_name" in r ? { poc_name: r.poc_name ?? null } : {}),
    ...("poc_phone" in r ? { poc_phone: r.poc_phone ?? null } : {}),
    ...("wind" in r ? { wind: r.wind ?? null } : {}),
    ...("participants_count" in r
      ? { participants_count: r.participants_count ?? null }
      : {}),
    ...("media" in r ? { media: (r.media ?? []) as Json } : {}),
  });

  const touchedSlugs = new Set<string>();

  if (rows.length > 0) {
    const fullRows = [];
    for (const r of rows) {
      const event = await resolveEvent(r);
      if (event) touchedSlugs.add(event.slug);
      fullRows.push(fullPayload(r, event));
    }

    let { error } = await supabase
      .from("live_results")
      .upsert(fullRows, { onConflict: "event_key" });

    // DB not migrated to 0006 yet → retry with the legacy column set so the
    // sheet pipeline never goes down.
    if (error && isMissingColumnError(error)) {
      ({ error } = await supabase
        .from("live_results")
        .upsert(rows.map(legacyPayload), { onConflict: "event_key" }));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Rows the sheet no longer has (deleted by the owner). Deleting by exact
  // Event Key — never by "anything not in this push" — so this can only ever
  // remove a race the sheet itself previously created; admin-only rows
  // (`/admin/live`, no matching sheet row) are never touched.
  if (deletedKeys.length > 0) {
    const { data: toDelete } = await supabase
      .from("live_results")
      .select("event_id")
      .in("event_key", deletedKeys);

    const { error: delError } = await supabase
      .from("live_results")
      .delete()
      .in("event_key", deletedKeys);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    const deletedEventIds = [
      ...new Set((toDelete ?? []).map((r) => r.event_id).filter((id): id is string => Boolean(id))),
    ];
    if (deletedEventIds.length > 0) {
      const { data: evs } = await supabase
        .from("events")
        .select("slug")
        .in("id", deletedEventIds);
      evs?.forEach((e) => touchedSlugs.add(e.slug));
    }
  }

  revalidatePath("/live");
  for (const slug of touchedSlugs) revalidatePath(`/live/${slug}`);
  return NextResponse.json({ ok: true });
}
