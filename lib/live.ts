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
  "finalist",
  "in_progress",
  "paused",
  "completed",
];

export const LIVE_STATUS_LABELS: Record<LiveStatus, string> = {
  upcoming: "Upcoming",
  finalist: "Finalist",
  in_progress: "● Live",
  paused: "⏸ Paused",
  completed: "Completed",
};

export const LIVE_STATUS_STYLES: Record<LiveStatus, string> = {
  in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  paused: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  completed: "bg-green-500/15 text-green-400",
  upcoming: "bg-white/10 text-sand",
  finalist: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
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

export function roundRank(heat: string | null): number {
  const h = (heat || "").toLowerCase();
  if (h.includes("heat")) return 1;
  if (h.includes("quarter")) return 2;
  if (h.includes("semi")) return 3; // must precede the "final" check ("semifinal")
  if (h.includes("final")) return 5;
  return 4;
}

/** Numeric part of a round label ("Heat 4" -> 4, "Semifinal 2" -> 2) — every
 *  heat/semifinal shares the same roundRank(), so without this they only
 *  sort by day/sort_order, which ties for every Quick-Entry-pushed row
 *  (sort_order is always 0) and left heats ordered by push time instead of
 *  heat number (e.g. "Heat 1, Heat 4, Heat 7" — insertion order, not 1-2-3). */
export function roundNumber(heat: string | null): number {
  const m = /(\d+)/.exec(heat || "");
  return m ? Number(m[1]) : 0;
}

// Field events are sometimes named with a leading number that isn't a race
// distance at all (e.g. "5M RUNNING LONG JUMP" = a short run-up long jump,
// not a 5m dash) — checked first so those never get sorted in among actual
// track distances just because the name happens to start with a digit.
export const FIELD_EVENT_KEYWORDS = /JUMP|THROW|PUT|SHOT|DISCUS|JAVELIN|CBT/i;

/** Leading number in an event/discipline name ("100M" -> 100, "60M" -> 60);
 *  field events (Long Jump, Shot Put, ...) always sort after all track events. */
export function eventSortKey(name: string): number {
  const trimmed = name.trim();
  if (FIELD_EVENT_KEYWORDS.test(trimmed)) return Infinity;
  const m = /^(\d+(?:\.\d+)?)/.exec(trimmed);
  return m ? Number(m[1]) : Infinity;
}

/** Any number found in a category label ("U-14" -> 14, "BOYS10" -> 10);
 *  age-unrestricted categories ("Open", with no digits) sort last. */
export function categorySortKey(category: string): number {
  const m = /(\d+)/.exec(category);
  return m ? Number(m[1]) : Infinity;
}

export function genderSortKey(gender: string): number {
  const g = gender.trim().toLowerCase();
  if (g === "boys" || g === "men" || g === "male") return 0;
  if (g === "girls" || g === "women" || g === "female") return 1;
  return 2;
}

/** Coerce the results jsonb into clean Finisher rows, sorted by rank. */
/** A result of "-", "–", "N/A", "TBD" etc. means "no time recorded" (common
 *  for young age-group heats scored on placing only) — treat it as empty so
 *  the UI/share/PDF don't fill a whole column with meaningless dashes. */
function normalizeResult(raw: unknown): string {
  const s = (typeof raw === "string" ? raw : String(raw ?? "")).trim();
  if (!s) return "";
  if (/^[-–—.\s]+$/.test(s)) return ""; // only dashes/dots/spaces = no time
  if (/^(n\/?a|nil|tbd|tba)$/i.test(s)) return ""; // "no data" placeholders
  if (/^(dnf|dns|dq)$/i.test(s)) return s.toUpperCase(); // real athletics status codes — keep
  return s;
}

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
      result: normalizeResult(e.result),
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
  /** Distinct athletes this school has brought to the meet so far, across every event/round — not just medalists. */
  participants: number;
  /** Team-scoring points, summed across every completed final. */
  points: number;
};

/** Shared by computeMedalTally and computeIndividualResults so medal
 *  eligibility never drifts between the two views — a DQ/DNF/DNS result
 *  never counts as a medal even if its rank looks like 1–3. */
function isMedalEligible(f: Finisher): boolean {
  return f.rank >= 1 && f.rank <= 3 && !!f.school && !["DQ", "DNF", "DNS"].includes(f.result);
}

// Team-scoring points for a placing: 1st=7, 2nd=5, 3rd=4, 4th=3, 5th=2,
// 6th=1, 7th-or-worse=0 — the same convention as the Quick Entry sheet's own
// Points column (docs/quick-entry-apps-script.gs). Computed independently
// here from each finisher's rank/school (not by reading a value pushed from
// the sheet), so it works identically whether a result came through Quick
// Entry or was typed directly into the admin form.
const TEAM_POINTS_TABLE: Record<number, number> = { 1: 7, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 };

function isPointsEligible(f: Finisher): boolean {
  return f.rank >= 1 && !!f.school && !["DQ", "DNF", "DNS"].includes(f.result);
}

/** One race's points by school, capped at each school's best TWO placings
 *  in that race — a school's 3rd (or worse) finisher here earns nothing,
 *  so one dominant school can't sweep every point in a single event. */
function racePointsBySchool(finishers: Finisher[]): Map<string, { display: string; points: number }> {
  const bySchool = new Map<string, Finisher[]>();
  for (const f of finishers) {
    if (!isPointsEligible(f)) continue;
    const key = f.school.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key) continue;
    let list = bySchool.get(key);
    if (!list) {
      list = [];
      bySchool.set(key, list);
    }
    list.push(f);
  }
  const out = new Map<string, { display: string; points: number }>();
  for (const [key, list] of bySchool) {
    list.sort((a, b) => a.rank - b.rank);
    const points = list
      .slice(0, 2)
      .reduce((sum, f) => sum + (TEAM_POINTS_TABLE[f.rank] ?? 0), 0);
    out.set(key, { display: list[0].school, points });
  }
  return out;
}

/**
 * Medal tally by school/club: completed finals only, ranks 1–3, excluding
 * a DQ/DNF/DNS result even if its rank looks like a podium finish.
 * School names are matched case/whitespace-insensitively; the first-seen
 * casing is displayed. Participants counts every distinct athlete from that
 * school across the whole meet (any round, any result) — not just
 * medalists — via the same athleteKey dedup computeMeetStats uses. Points
 * (see racePointsBySchool) can put a school in this table even with zero
 * medals, since 4th–6th place also scores.
 */
export function computeMedalTally(rows: LiveRow[]): MedalTallyRow[] {
  const tally = new Map<string, MedalTallyRow>();
  const schoolAthletes = new Map<string, Set<string>>();

  function getOrCreate(key: string, display: string): MedalTallyRow {
    let entry = tally.get(key);
    if (!entry) {
      entry = { school: display, gold: 0, silver: 0, bronze: 0, total: 0, participants: 0, points: 0 };
      tally.set(key, entry);
    }
    return entry;
  }

  for (const row of rows) {
    const finishers = parseFinishers(row.results);
    for (const f of finishers) {
      if (!f.school) continue;
      const key = f.school.toLowerCase().replace(/\s+/g, " ").trim();
      if (!key) continue;

      let athletes = schoolAthletes.get(key);
      if (!athletes) {
        athletes = new Set();
        schoolAthletes.set(key, athletes);
      }
      athletes.add(athleteKey(f, f.school));
    }

    if (row.status !== "completed" || !isFinalHeat(row.heat_label)) continue;

    for (const f of finishers) {
      if (!f.school || !isMedalEligible(f)) continue;
      const key = f.school.toLowerCase().replace(/\s+/g, " ").trim();
      if (!key) continue;
      const entry = getOrCreate(key, f.school);
      if (f.rank === 1) entry.gold += 1;
      else if (f.rank === 2) entry.silver += 1;
      else entry.bronze += 1;
      entry.total += 1;
    }

    for (const [key, { display, points }] of racePointsBySchool(finishers)) {
      const entry = getOrCreate(key, display);
      entry.points += points;
    }
  }

  for (const [key, entry] of tally) {
    entry.participants = schoolAthletes.get(key)?.size ?? 0;
  }

  return [...tally.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      a.school.localeCompare(b.school),
  );
}

/** One athlete's performance in one race, flattened out of a LiveRow for the
 *  "Individual Results" browsable table — a log of every posted performance
 *  (heats and finals alike), not just medal-eligible finals. */
export type IndividualResultRow = {
  /** Source LiveRow's id — rank/bib alone repeats across *different* races
   *  once flattened into one long list, unlike within a single race's
   *  finisher list, so this is needed to keep React keys unique. */
  rowId: string;
  round: string;
  event: string;
  gender: string;
  category: string;
  bib?: string;
  name: string;
  school: string;
  result: string;
  rank: number;
  record?: string;
  medal: "Gold" | "Silver" | "Bronze" | null;
};

/**
 * Flattens every row's finishers into one browsable list — every heat and
 * final an athlete has run, not just medal-eligible finals (that's
 * computeMedalTally's job). Sorted event → gender → round → rank, the same
 * numeric-aware ordering used throughout the live programme.
 */
export function computeIndividualResults(rows: LiveRow[]): IndividualResultRow[] {
  const out: IndividualResultRow[] = [];
  for (const row of rows) {
    const event = (row.event_type || row.event_name || "Event").trim() || "Event";
    const gender = (row.gender || "Mixed").trim() || "Mixed";
    const category = (row.category || "Uncategorized").trim() || "Uncategorized";
    const round = row.heat_label?.trim() || "Final";
    const isFinal = isFinalHeat(row.heat_label);

    for (const f of parseFinishers(row.results)) {
      out.push({
        rowId: row.id,
        round,
        event,
        gender,
        category,
        bib: f.bib,
        name: f.name,
        school: f.school,
        result: f.result,
        rank: f.rank,
        record: f.record,
        // A Finalist-stage row already has finishers (the qualified lineup)
        // but its rank is just sheet arrival order and its result is blank
        // — status must be "completed", not just "isFinal", or whoever's
        // typed-in first would wrongly render as a medalist pre-race.
        medal: isFinal && row.status === "completed" && isMedalEligible(f) ? (["Gold", "Silver", "Bronze"][f.rank - 1] as "Gold" | "Silver" | "Bronze") : null,
      });
    }
  }

  return out.sort(
    (a, b) =>
      eventSortKey(a.event) - eventSortKey(b.event) ||
      a.event.localeCompare(b.event) ||
      genderSortKey(a.gender) - genderSortKey(b.gender) ||
      roundRank(a.round) - roundRank(b.round) ||
      roundNumber(a.round) - roundNumber(b.round) ||
      a.rank - b.rank,
  );
}

export type MeetStats = {
  totalAthletes: number;
  totalCategories: number;
  totalEvents: number;
  totalResults: number;
  medalTotals: { gold: number; silver: number; bronze: number; total: number };
  genderDistribution: { label: string; count: number; pct: number }[];
  topInstitutions: { school: string; count: number }[];
};

/** Dedup key for one athlete across every round/event they appear in — bib
 *  is the most reliable identifier when present (else name), combined with
 *  school since bibs aren't guaranteed unique across different events. */
function athleteKey(f: Finisher, school: string): string {
  const id = (f.bib || f.name).toLowerCase().trim();
  return `${id}|${school.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

/**
 * Meet-wide snapshot for the Overview tab: unique athletes/categories/
 * events/results posted SO FAR — not the full pre-registered roster, which
 * lives in Google Sheets and isn't visible to the site — plus medal totals
 * (summed from the same per-school tally MedalTally already computes),
 * gender split, and top institutions by *how many distinct athletes*
 * they've brought (participation, not medals — that's MedalTally's job).
 */
export function computeMeetStats(rows: LiveRow[], medalTally: MedalTallyRow[]): MeetStats {
  const athletes = new Map<string, { gender: string; school: string }>();
  const schoolAthletes = new Map<string, Set<string>>(); // school key -> athlete keys
  const schoolDisplay = new Map<string, string>(); // school key -> first-seen casing
  const categories = new Set<string>();
  const events = new Set<string>();
  let totalResults = 0;

  for (const row of rows) {
    if (row.category?.trim()) categories.add(row.category.trim());
    const discipline = (row.event_type || row.event_name || "").trim();
    if (discipline) events.add(discipline);

    const finishers = parseFinishers(row.results);
    totalResults += finishers.length;

    for (const f of finishers) {
      const school = f.school || "Unattached";
      const schoolKey = school.toLowerCase().replace(/\s+/g, " ").trim();
      if (!schoolDisplay.has(schoolKey)) schoolDisplay.set(schoolKey, school);

      const key = athleteKey(f, school);
      if (!athletes.has(key)) athletes.set(key, { gender: row.gender ?? "", school });

      let set = schoolAthletes.get(schoolKey);
      if (!set) {
        set = new Set();
        schoolAthletes.set(schoolKey, set);
      }
      set.add(key);
    }
  }

  const totalAthletes = athletes.size;
  const genderCounts = new Map<string, number>();
  for (const { gender } of athletes.values()) {
    const label = gender.trim() || "Unspecified";
    genderCounts.set(label, (genderCounts.get(label) ?? 0) + 1);
  }
  const genderDistribution = [...genderCounts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      pct: totalAthletes > 0 ? Math.round((count / totalAthletes) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topInstitutions = [...schoolAthletes.entries()]
    .map(([key, set]) => ({ school: schoolDisplay.get(key) ?? key, count: set.size }))
    .sort((a, b) => b.count - a.count || a.school.localeCompare(b.school));

  const medalTotals = medalTally.reduce(
    (acc, r) => ({
      gold: acc.gold + r.gold,
      silver: acc.silver + r.silver,
      bronze: acc.bronze + r.bronze,
      total: acc.total + r.total,
    }),
    { gold: 0, silver: 0, bronze: 0, total: 0 },
  );

  return {
    totalAthletes,
    totalCategories: categories.size,
    totalEvents: events.size,
    totalResults,
    medalTotals,
    genderDistribution,
    topInstitutions,
  };
}

const SHARE_MEDALS = ["🥇", "🥈", "🥉"];

/** WhatsApp/native-share text for an event round — the full field, not just top 3. */
export function buildShareText(row: LiveRow, url: string): string {
  const header = [row.event_name, row.category, row.gender, row.heat_label]
    .filter(Boolean)
    .join(" · ");
  // A Finalist-stage row already has finisher entries (the qualified
  // lineup) but no real placing yet — only a completed race gets medal
  // markers, otherwise whoever's typed in first would read as "gold".
  const isCompleted = row.status === "completed";
  const lines = parseFinishers(row.results).map((f) => {
    const pos = isCompleted && f.rank <= 3 ? (SHARE_MEDALS[f.rank - 1] ?? `#${f.rank}`) : `#${f.rank}`;
    const bib = f.bib ? `${f.bib} ` : "";
    const school = f.school ? ` (${f.school})` : "";
    const mark = f.result ? ` — ${f.result}` : "";
    const rec = f.record ? ` [${f.record}]` : "";
    return `${pos} ${bib}${f.name}${school}${mark}${rec}`;
  });
  return [`🏆 ${header}`, ...lines, `Full results: ${url}`].join("\n");
}
