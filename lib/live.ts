import type { Database, Json, LiveStatus, AnnouncementType } from "@/types/database.types";
import { normalizeMedia } from "@/lib/events";
import type { MediaItem } from "@/lib/seed-data";

/**
 * Live-hub domain helpers: schedule items (live_results rows), finishers,
 * statuses, announcements, medal tally and share text. Single source of truth
 * for the status maps that were previously duplicated across the public card
 * and the admin table.
 */

export type LiveRow = Database["public"]["Tables"]["live_results"]["Row"];
export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];

/** One finisher entry inside live_results.results (jsonb). */
export type Finisher = {
  rank: number;
  bib?: string;
  name: string;
  school: string;
  result: string;
  /** Record broken by this performance, e.g. "MR" (meet) / "NR" (national). */
  record?: string;
};

/** Public pages show at most the top N finishers per event. */
export const TOP_FINISHERS = 6;

export const LIVE_STATUSES: LiveStatus[] = [
  "upcoming",
  "in_progress",
  "paused",
  "completed",
];

export const LIVE_STATUS_LABELS: Record<LiveStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "● Live",
  paused: "⏸ Paused",
  completed: "Completed",
};

export const LIVE_STATUS_STYLES: Record<LiveStatus, string> = {
  in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  paused: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  completed: "bg-green-500/15 text-green-400",
  upcoming: "bg-white/10 text-sand",
};

export const ANNOUNCEMENT_TYPES: Record<
  AnnouncementType,
  { label: string; style: string }
> = {
  info: { label: "Info", style: "bg-sky-500/15 text-sky-400" },
  delay: { label: "Delay", style: "bg-amber-500/20 text-amber-400" },
  venue: { label: "Venue", style: "bg-purple-500/15 text-purple-400" },
  safety: { label: "Safety", style: "bg-red-500/15 text-red-400" },
  results: { label: "Results", style: "bg-green-500/15 text-green-400" },
};

function coerceStatus(value: unknown): LiveStatus {
  return LIVE_STATUSES.includes(value as LiveStatus)
    ? (value as LiveStatus)
    : "upcoming";
}

/** Medals are awarded only in finals (no heat label, or an explicit "Final"). */
export function isFinalHeat(heatLabel: string | null | undefined): boolean {
  return !heatLabel || heatLabel.trim().toLowerCase() === "final";
}

/** Coerce the results jsonb into clean Finisher rows, sorted by rank. */
export function parseFinishers(raw: Json): Finisher[] {
  if (!Array.isArray(raw)) return [];
  const out: Finisher[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim() : "";
    if (!name) continue;
    out.push({
      rank: typeof e.rank === "number" ? e.rank : Number(e.rank) || out.length + 1,
      bib: typeof e.bib === "string" && e.bib.trim() ? String(e.bib).trim() : undefined,
      name,
      school: typeof e.school === "string" ? e.school.trim() : "",
      result: typeof e.result === "string" ? e.result.trim() : String(e.result ?? ""),
      record:
        typeof e.record === "string" && e.record.trim()
          ? e.record.trim().toUpperCase()
          : undefined,
    });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

/**
 * Normalise a raw live_results row, defending against a database that hasn't
 * run migration 0006 yet (missing event_id/scheduled_at/… columns) so the
 * public site never breaks — same role normalizeEvent plays for events.
 */
export function normalizeLiveItem(row: Record<string, unknown>): LiveRow {
  return {
    id: String(row.id),
    event_key: String(row.event_key ?? ""),
    event_name: String(row.event_name ?? ""),
    category: String(row.category ?? ""),
    gender: (row.gender as string) ?? null,
    event_type: (row.event_type as string) ?? null,
    heat_label: (row.heat_label as string) ?? null,
    day: typeof row.day === "number" ? row.day : 1,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    status: coerceStatus(row.status),
    results: (row.results as Json) ?? [],
    notes: (row.notes as string) ?? null,
    event_id: (row.event_id as string) ?? null,
    scheduled_at: (row.scheduled_at as string) ?? null,
    venue: (row.venue as string) ?? null,
    poc_name: (row.poc_name as string) ?? null,
    poc_phone: (row.poc_phone as string) ?? null,
    wind: (row.wind as string) ?? null,
    participants_count:
      typeof row.participants_count === "number" ? row.participants_count : null,
    media: (row.media as Json) ?? [],
    updated_at: (row.updated_at as string) ?? new Date(0).toISOString(),
  };
}

/** Media attached to a schedule item (photo/video highlights). */
export function liveItemMedia(row: LiveRow): MediaItem[] {
  return normalizeMedia(row.media);
}

/** Timetable order: day, then scheduled time (unscheduled last), then sort. */
export function scheduleComparator(a: LiveRow, b: LiveRow): number {
  if (a.day !== b.day) return a.day - b.day;
  const at = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
  const bt = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
  if (at !== bt) return at - bt;
  return a.sort_order - b.sort_order;
}

export function relativeTime(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/** "10:30 AM" in stadium time (IST), deterministic on server and client. */
export function formatScheduledTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export type MedalTallyRow = {
  school: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
};

/**
 * Medal tally by school/club: completed finals only, ranks 1–3.
 * School names are matched case/whitespace-insensitively; the first-seen
 * casing is displayed.
 */
export function computeMedalTally(rows: LiveRow[]): MedalTallyRow[] {
  const tally = new Map<string, MedalTallyRow>();
  for (const row of rows) {
    if (row.status !== "completed" || !isFinalHeat(row.heat_label)) continue;
    for (const f of parseFinishers(row.results)) {
      if (f.rank < 1 || f.rank > 3 || !f.school) continue;
      const key = f.school.toLowerCase().replace(/\s+/g, " ").trim();
      if (!key) continue;
      let entry = tally.get(key);
      if (!entry) {
        entry = { school: f.school, gold: 0, silver: 0, bronze: 0, total: 0 };
        tally.set(key, entry);
      }
      if (f.rank === 1) entry.gold += 1;
      else if (f.rank === 2) entry.silver += 1;
      else entry.bronze += 1;
      entry.total += 1;
    }
  }
  return [...tally.values()].sort(
    (a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      a.school.localeCompare(b.school),
  );
}

const SHARE_MEDALS = ["🥇", "🥈", "🥉"];

/** WhatsApp/native-share text for an event round — the full field, not just top 3. */
export function buildShareText(row: LiveRow, url: string): string {
  const header = [row.event_name, row.category, row.gender, row.heat_label]
    .filter(Boolean)
    .join(" · ");
  const lines = parseFinishers(row.results).map((f) => {
    const pos = f.rank <= 3 ? (SHARE_MEDALS[f.rank - 1] ?? `#${f.rank}`) : `#${f.rank}`;
    const bib = f.bib ? `${f.bib} ` : "";
    const school = f.school ? ` (${f.school})` : "";
    const mark = f.result ? ` — ${f.result}` : "";
    const rec = f.record ? ` [${f.record}]` : "";
    return `${pos} ${bib}${f.name}${school}${mark}${rec}`;
  });
  return [`🏆 ${header}`, ...lines, `Full results: ${url}`].join("\n");
}
