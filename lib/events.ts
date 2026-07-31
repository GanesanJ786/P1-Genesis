import type { EventItem, MediaItem } from "@/lib/seed-data";

/**
 * Event scheduling + external-media helpers.
 * Keeps the "upcoming vs. successful" rule and the YouTube/Instagram parsing in
 * one place, shared by the public pages and the admin save action.
 */

/** Extract a YouTube video id from any common URL shape (watch, youtu.be, shorts, embed). */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|v)\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Classify a pasted URL as YouTube or Instagram (or null if neither). */
export function detectMediaType(url: string): MediaItem["type"] | null {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  return null;
}

/**
 * Parse the admin "media links" textarea into a MediaItem[].
 * One entry per line; optional caption after a "|" (e.g. `https://youtu.be/x | Finals`).
 * Lines that aren't recognisable YouTube/Instagram URLs are skipped.
 */
export function parseMediaLinks(text: string | null | undefined): MediaItem[] {
  if (!text) return [];
  const items: MediaItem[] = [];
  for (const line of text.split("\n")) {
    const [rawUrl, ...rest] = line.split("|");
    const url = rawUrl.trim();
    if (!url) continue;
    const type = detectMediaType(url);
    if (!type) continue;
    const caption = rest.join("|").trim();
    items.push(caption ? { type, url, caption } : { type, url });
  }
  return items;
}

/** Serialise a MediaItem[] back into the textarea format (for editing). */
export function mediaToText(media: MediaItem[] | null | undefined): string {
  if (!media?.length) return "";
  return media
    .map((m) => (m.caption ? `${m.url} | ${m.caption}` : m.url))
    .join("\n");
}

/** Coerce an unknown jsonb value into a clean MediaItem[]. */
export function normalizeMedia(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  const out: MediaItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const url = (raw as Record<string, unknown>).url;
    if (typeof url !== "string") continue;
    const type = detectMediaType(url) ?? ((raw as Record<string, unknown>).type as MediaItem["type"]);
    if (type !== "youtube" && type !== "instagram") continue;
    const caption = (raw as Record<string, unknown>).caption;
    out.push(
      typeof caption === "string" && caption
        ? { type, url, caption }
        : { type, url },
    );
  }
  return out;
}

/**
 * Normalise a raw DB/seed row into a fully-formed EventItem.
 * Defends against a database that hasn't run migration 0003 yet (missing
 * registration_url / media columns) so the public site never breaks.
 */
export function normalizeEvent(row: Record<string, unknown>): EventItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ""),
    summary: (row.summary as string) ?? "",
    body: (row.body as string) ?? "",
    cover_image: (row.cover_image as string) ?? null,
    start_date: (row.start_date as string) ?? null,
    end_date: (row.end_date as string) ?? null,
    location: (row.location as string) ?? null,
    status: (row.status as EventItem["status"]) ?? "draft",
    sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    registration_url: (row.registration_url as string) ?? null,
    media: normalizeMedia(row.media),
    live_tracking: row.live_tracking === true,
    // Opt-out feature (unlike live_tracking): defaults true so a database
    // that hasn't run migration 0008 yet — or an event nobody has touched
    // this checkbox on — still shows the Schedule section.
    show_schedule: row.show_schedule !== false,
  };
}

/** True for events that have already finished (or been archived). */
export function isPastEvent(e: EventItem, now: Date = new Date()): boolean {
  if (e.status === "archived") return true;
  const ref = e.end_date ?? e.start_date;
  if (!ref) return false; // dateless events stay "upcoming"
  // Compare on date only (end of that day) so an event isn't "past" mid-day.
  const end = new Date(`${ref}T23:59:59`);
  return end.getTime() < now.getTime();
}

/** True once an event's start date has arrived but it hasn't finished yet —
 *  splitEvents() only flips "upcoming" -> "past" at the END date, so a
 *  multi-day event reads as "upcoming" for its entire run; this is what lets
 *  the Events listing swap Register for a "Track live" CTA once it's
 *  actually underway. */
export function isOngoingEvent(e: EventItem, now: Date = new Date()): boolean {
  if (!e.start_date || isPastEvent(e, now)) return false;
  const start = new Date(`${e.start_date}T00:00:00`);
  return start.getTime() <= now.getTime();
}

/**
 * Split events into upcoming (soonest first) and past/successful (most recent
 * first). Upcoming events are always surfaced with priority.
 */
export function splitEvents(
  events: EventItem[],
  now: Date = new Date(),
): { upcoming: EventItem[]; past: EventItem[] } {
  const upcoming: EventItem[] = [];
  const past: EventItem[] = [];
  for (const e of events) (isPastEvent(e, now) ? past : upcoming).push(e);

  const time = (d: string | null) => (d ? new Date(d).getTime() : 0);
  upcoming.sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      time(a.start_date) - time(b.start_date),
  );
  past.sort(
    (a, b) => time(b.end_date ?? b.start_date) - time(a.end_date ?? a.start_date),
  );
  return { upcoming, past };
}
