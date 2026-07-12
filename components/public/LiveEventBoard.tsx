"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  Search,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ResultCard } from "@/components/public/ResultCard";
import { LiveRoundRow } from "@/components/public/LiveRoundRow";
import { AnnouncementsFeed } from "@/components/public/AnnouncementsFeed";
import { MedalTally } from "@/components/public/MedalTally";
import { Countdown } from "@/components/public/Countdown";
import {
  normalizeLiveItem,
  computeMedalTally,
  scheduleComparator,
  formatScheduledTime,
  parseFinishers,
  isFinalHeat,
  type LiveRow,
  type AnnouncementRow,
} from "@/lib/live";

type BoardEvent = { id: string; slug: string; title: string };
type Props = {
  event: BoardEvent;
  initialItems: LiveRow[];
  initialAnnouncements: AnnouncementRow[];
};

type StatusFilter = "all" | "upcoming" | "live" | "completed" | "finals";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "finals", label: "Finals" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Done" },
];

function upsertById(prev: LiveRow[], next: LiveRow): LiveRow[] {
  const idx = prev.findIndex((r) => r.id === next.id);
  if (idx >= 0) {
    const arr = [...prev];
    arr[idx] = next;
    return arr;
  }
  return [...prev, next];
}

/**
 * Reconcile the (edge-cached, up to ~30s stale) polling response with current
 * state without ever moving a row backwards in time. The polled array is the
 * authoritative *set* (so deletions still reach clients whose Realtime channel
 * dropped), but for each row we keep whichever copy has the newer `updated_at`
 * — otherwise a stale cached poll clobbers a fresher Realtime update and the
 * value visibly flickers old→new→old.
 */
function mergeFresh(prev: LiveRow[], polled: LiveRow[]): LiveRow[] {
  const prevById = new Map(prev.map((r) => [r.id, r]));
  return polled.map((row) => {
    const existing = prevById.get(row.id);
    return existing && existing.updated_at > row.updated_at ? existing : row;
  });
}

/** Same idea for announcements: polled set wins, but never drop a message the
 *  stale cache hasn't seen yet (created after the newest polled entry). */
function mergeAnnouncements(
  prev: AnnouncementRow[],
  polled: AnnouncementRow[],
): AnnouncementRow[] {
  let maxPolled = "";
  for (const a of polled) if (a.created_at > maxPolled) maxPolled = a.created_at;
  const polledIds = new Set(polled.map((a) => a.id));
  const tooNewForCache = prev.filter(
    (a) => a.created_at > maxPolled && !polledIds.has(a.id),
  );
  return [...polled, ...tooNewForCache];
}

/* ── Programme grouping ───────────────────────────────────────────────────── */
// The full programme is nested Category (age group) → Gender → Event
// (discipline, e.g. "100M") → Round (heats/semis/final). Nesting it this way
// — rather than one flat wall of "100m · U-14 · Boys"-style cards — lets a
// spectator narrow down by eye (find their age group, then their gender,
// then their event) instead of reading every card's compound title.

type EventGroup = {
  key: string;
  title: string; // just the event/discipline name — category & gender are shown by parent headers
  rounds: LiveRow[];
  hasLive: boolean;
};
type GenderGroup = { key: string; gender: string; events: EventGroup[]; hasLive: boolean };
type CategoryGroup = { key: string; category: string; genders: GenderGroup[]; hasLive: boolean };

/** Round progression order within an event: heats → quarters → semis → final. */
function roundRank(heat: string | null): number {
  const h = (heat || "").toLowerCase();
  if (h.includes("heat")) return 1;
  if (h.includes("quarter")) return 2;
  if (h.includes("semi")) return 3; // must precede the "final" check ("semifinal")
  if (h.includes("final")) return 5;
  return 4;
}

/** Leading number in an event/discipline name ("100M" -> 100, "60M" -> 60);
 *  non-numeric events (Long Jump, Shot Put, ...) sort after all track events. */
function eventSortKey(name: string): number {
  const m = /^(\d+(?:\.\d+)?)/.exec(name.trim());
  return m ? Number(m[1]) : Infinity;
}

/** Any number found in a category label ("U-14" -> 14, "BOYS10" -> 10);
 *  age-unrestricted categories ("Open", with no digits) sort last. */
function categorySortKey(category: string): number {
  const m = /(\d+)/.exec(category);
  return m ? Number(m[1]) : Infinity;
}

function genderSortKey(gender: string): number {
  const g = gender.trim().toLowerCase();
  if (g === "boys" || g === "men" || g === "male") return 0;
  if (g === "girls" || g === "women" || g === "female") return 1;
  return 2;
}

function buildProgramme(rows: LiveRow[]): CategoryGroup[] {
  const catMap = new Map<string, Map<string, Map<string, EventGroup>>>();
  for (const r of rows) {
    const category = (r.category || "Uncategorized").trim() || "Uncategorized";
    const gender = (r.gender || "Mixed").trim() || "Mixed";
    const discipline = (r.event_type || r.event_name || "Event").trim() || "Event";
    const eventKey = discipline.toLowerCase();

    let genderMap = catMap.get(category);
    if (!genderMap) { genderMap = new Map(); catMap.set(category, genderMap); }
    let eventMap = genderMap.get(gender);
    if (!eventMap) { eventMap = new Map(); genderMap.set(gender, eventMap); }
    let g = eventMap.get(eventKey);
    if (!g) {
      g = { key: `${category}|${gender}|${eventKey}`, title: discipline, rounds: [], hasLive: false };
      eventMap.set(eventKey, g);
    }
    g.rounds.push(r);
    if (r.status === "in_progress" || r.status === "paused") g.hasLive = true;
  }

  const categories: CategoryGroup[] = [];
  for (const [category, genderMap] of catMap) {
    const genders: GenderGroup[] = [];
    for (const [gender, eventMap] of genderMap) {
      const events = [...eventMap.values()];
      for (const g of events) {
        g.rounds.sort(
          (a, b) =>
            a.day - b.day ||
            roundRank(a.heat_label) - roundRank(b.heat_label) ||
            a.sort_order - b.sort_order,
        );
      }
      events.sort(
        (a, b) => eventSortKey(a.title) - eventSortKey(b.title) || a.title.localeCompare(b.title),
      );
      genders.push({
        key: `${category}|${gender}`,
        gender,
        events,
        hasLive: events.some((e) => e.hasLive),
      });
    }
    genders.sort(
      (a, b) => genderSortKey(a.gender) - genderSortKey(b.gender) || a.gender.localeCompare(b.gender),
    );
    categories.push({
      key: category,
      category,
      genders,
      hasLive: genders.some((g) => g.hasLive),
    });
  }
  categories.sort(
    (a, b) => categorySortKey(a.category) - categorySortKey(b.category) || a.category.localeCompare(b.category),
  );
  return categories;
}

/** Free-text match across event metadata and every finisher (name/school/bib). */
function matchesQuery(r: LiveRow, q: string): boolean {
  if (
    r.event_name.toLowerCase().includes(q) ||
    (r.category ?? "").toLowerCase().includes(q) ||
    (r.event_type ?? "").toLowerCase().includes(q) ||
    (r.gender ?? "").toLowerCase().includes(q) ||
    (r.heat_label ?? "").toLowerCase().includes(q) ||
    (r.venue ?? "").toLowerCase().includes(q)
  ) {
    return true;
  }
  return parseFinishers(r.results).some(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.school.toLowerCase().includes(q) ||
      (f.bib ?? "").toLowerCase().includes(q),
  );
}

function EventGroupSection({
  group,
  eventTitle,
  defaultOpen,
}: {
  group: EventGroup;
  eventTitle: string;
  defaultOpen?: boolean;
}) {
  // Finished events collapse by default; anything live/upcoming stays open.
  const allCompleted = group.rounds.every((r) => r.status === "completed");
  const doneCount = group.rounds.filter((r) => r.status === "completed").length;
  return (
    <details
      open={defaultOpen ?? !allCompleted}
      className="group/event overflow-hidden rounded-2xl border border-sand/10 bg-ink-soft/40"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={16}
          className="shrink-0 text-sand/50 transition-transform group-open/event:rotate-90"
        />
        <h3 className="min-w-0 truncate font-display text-base uppercase text-cream">
          {group.title}
        </h3>
        {group.hasLive ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        ) : null}
        <span className="ml-auto shrink-0 text-xs text-sand/50">
          {doneCount}/{group.rounds.length} done
        </span>
      </summary>
      <div className="px-4 pb-1.5">
        {group.rounds.map((r) => (
          <LiveRoundRow key={r.id} item={r} eventTitle={eventTitle} />
        ))}
      </div>
    </details>
  );
}

function FilterChips({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string | null;
  onSelect: (v: string | null) => void;
}) {
  if (options.length < 2) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.65rem] uppercase tracking-widest text-sand/60">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
            active === null
              ? "bg-ember text-white"
              : "bg-ink text-sand hover:text-cream"
          }`}
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(active === o ? null : o)}
            className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              active === o
                ? "bg-ember text-white"
                : "bg-ink text-sand hover:text-cream"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LiveEventBoard({ event, initialItems, initialAnnouncements }: Props) {
  const [items, setItems] = useState<LiveRow[]>(initialItems);
  const [announcements, setAnnouncements] =
    useState<AnnouncementRow[]>(initialAnnouncements);
  const [activeDay, setActiveDay] = useState(1);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [finalsPdfBusy, setFinalsPdfBusy] = useState(false);

  const downloadAllFinals = async () => {
    setFinalsPdfBusy(true);
    try {
      const { downloadAllFinalsPdf } = await import("@/lib/live-pdf");
      await downloadAllFinalsPdf(items, event.title);
    } finally {
      setFinalsPdfBusy(false);
    }
  };
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeGender, setActiveGender] = useState<string | null>(null);
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // Whether the Realtime channel is currently subscribed. When it is, the poll
  // stays idle — otherwise a stale (edge-cached, up to ~30s old) poll response
  // races the live update and the value visibly flickers old→new→old.
  const realtimeConnected = useRef(false);
  // Bumped on tab focus/visibility regain to force the Realtime effect below
  // to tear down and rebuild the channel — see the effect for why.
  const [reconnectKey, setReconnectKey] = useState(0);

  /* ── Supabase Realtime ─────────────────────────────────────────────────── */
  // One channel (= one WebSocket) with per-table bindings. INSERT/UPDATE are
  // filtered to this event server-side; DELETE cannot be (the old record only
  // carries the primary key), so it binds unfiltered and removes by id — a
  // no-op when the row belonged to another event.
  useEffect(() => {
    const supabase = createClient();
    const itemFilter = `event_id=eq.${event.id}`;
    const applyItem = (raw: Record<string, unknown>) => {
      setItems((prev) => upsertById(prev, normalizeLiveItem(raw)));
      setLastUpdated(new Date());
    };
    const applyAnnouncement = (raw: Record<string, unknown>) => {
      const next = raw as AnnouncementRow;
      setAnnouncements((prev) => {
        const idx = prev.findIndex((a) => a.id === next.id);
        if (idx >= 0) {
          const arr = [...prev];
          arr[idx] = next;
          return arr;
        }
        return [next, ...prev];
      });
      setLastUpdated(new Date());
    };

    const channel = supabase
      .channel(`live:${event.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_results", filter: itemFilter },
        (payload) => applyItem(payload.new as Record<string, unknown>),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_results", filter: itemFilter },
        (payload) => applyItem(payload.new as Record<string, unknown>),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "live_results" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) setItems((prev) => prev.filter((r) => r.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements", filter: itemFilter },
        (payload) => applyAnnouncement(payload.new as Record<string, unknown>),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "announcements", filter: itemFilter },
        (payload) => applyAnnouncement(payload.new as Record<string, unknown>),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "announcements" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        },
      )
      .subscribe((status) => {
        realtimeConnected.current = status === "SUBSCRIBED";
      });
    return () => {
      realtimeConnected.current = false;
      supabase.removeChannel(channel);
    };
    // reconnectKey: browsers can freeze or silently drop the WebSocket while
    // this tab is backgrounded (switching tabs, phone lock, laptop sleep)
    // without ever firing a new subscribe status — the channel looks
    // "SUBSCRIBED" forever but stops receiving events. Rebuilding the channel
    // on focus/visibility regain (see the effect below) is the only reliable
    // way to recover instead of waiting for a manual reload.
  }, [event.id, reconnectKey]);

  /* ── Polling fallback — only runs while Realtime is *not* connected, so it
        never fights a live update (handles viewers beyond the connection
        limit or with Realtime blocked). ────────────────────────────────────── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/live/${event.slug}`);
        if (res.ok) {
          const polled = (await res.json()) as {
            items: LiveRow[];
            announcements: AnnouncementRow[];
          };
          setItems((prev) => mergeFresh(prev, polled.items ?? []));
          setAnnouncements((prev) => mergeAnnouncements(prev, polled.announcements ?? []));
          setLastUpdated(new Date());
        }
      } catch { /* silent */ }
    };

    const id = setInterval(() => {
      if (realtimeConnected.current) return; // Realtime healthy → no poll needed
      poll();
    }, 10_000);

    // On regaining focus/visibility, don't trust realtimeConnected — a
    // backgrounded tab's WebSocket may be a silent zombie. Poll immediately
    // for an instant catch-up (this is what a manual reload was providing)
    // while the sibling effect above rebuilds the channel for the next update.
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [event.slug]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setReconnectKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  /* ── Derived data ─────────────────────────────────────────────────────── */
  const days = useMemo(
    () => Array.from(new Set(items.map((r) => r.day))).sort(),
    [items],
  );

  const dayAll = useMemo(
    () => items.filter((r) => r.day === activeDay).sort(scheduleComparator),
    [items, activeDay],
  );

  const categories = useMemo(
    () => Array.from(new Set(dayAll.map((r) => r.category).filter(Boolean))).sort(),
    [dayAll],
  );

  const genders = useMemo(
    () =>
      Array.from(new Set(dayAll.map((r) => r.gender).filter(Boolean))).sort() as string[],
    [dayAll],
  );

  // Disciplines update when category changes so they stay relevant
  const disciplines = useMemo(() => {
    const pool = activeCategory
      ? dayAll.filter((r) => r.category === activeCategory)
      : dayAll;
    return Array.from(
      new Set(pool.map((r) => r.event_type).filter(Boolean)),
    ).sort() as string[];
  }, [dayAll, activeCategory]);

  const handleCategoryChange = (cat: string | null) => {
    setActiveCategory(cat);
    setActiveDiscipline(null); // reset discipline when category changes
  };

  const filtered = useMemo(
    () =>
      dayAll.filter((r) => {
        if (activeCategory && r.category !== activeCategory) return false;
        if (activeGender && r.gender !== activeGender) return false;
        if (activeDiscipline && r.event_type !== activeDiscipline) return false;
        return true;
      }),
    [dayAll, activeCategory, activeGender, activeDiscipline],
  );

  // "Now Running" always shows across all days so parents never miss a live
  // event; paused items stay here too — they're still on the track.
  const allRunning = useMemo(
    () =>
      items
        .filter((r) => r.status === "in_progress" || r.status === "paused")
        .sort(
          (a, b) =>
            Number(a.status === "paused") - Number(b.status === "paused") ||
            a.sort_order - b.sort_order,
        ),
    [items],
  );

  // Nearest upcoming scheduled item across all days — the "what's next" glance.
  // The Countdown flips to "Starting soon" once its time passes, and the item
  // leaves this set the moment admin marks it live.
  const nextUp = useMemo(() => {
    return items
      .filter((r) => r.status === "upcoming" && r.scheduled_at)
      .sort(
        (a, b) =>
          new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime(),
      )[0];
  }, [items]);

  const medalTally = useMemo(() => computeMedalTally(items), [items]);

  // Build the nested Category → Gender → Event → Round programme from the
  // filtered set. The status filter narrows which rounds get grouped.
  const programme = useMemo(() => {
    const set =
      activeStatus === "upcoming"
        ? filtered.filter((r) => r.status === "upcoming")
        : activeStatus === "completed"
          ? filtered.filter((r) => r.status === "completed")
          : activeStatus === "live"
            ? filtered.filter(
                (r) => r.status === "in_progress" || r.status === "paused",
              )
            : activeStatus === "finals"
              ? filtered.filter(
                  (r) => isFinalHeat(r.heat_label) && r.status === "completed",
                )
              : filtered;
    return buildProgramme(set);
  }, [filtered, activeStatus]);

  const totalEventCount = useMemo(
    () =>
      programme.reduce(
        (sum, cat) => sum + cat.genders.reduce((s, g) => s + g.events.length, 0),
        0,
      ),
    [programme],
  );

  // Search across athletes / bibs / schools / events — the fastest way for a
  // parent to find one race in a meet with hundreds of rounds.
  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [];
    const rank = (s: LiveRow) =>
      s.status === "in_progress" || s.status === "paused"
        ? 0
        : s.status === "upcoming"
          ? 1
          : 2;
    return items
      .filter((r) => matchesQuery(r, q))
      .sort((a, b) => rank(a) - rank(b) || scheduleComparator(a, b));
  }, [items, q]);

  const hasAnyData = items.length > 0;
  const nothingMatches =
    totalEventCount === 0 && (activeStatus !== "all" || allRunning.length === 0);

  return (
    <div className="space-y-8">
      {/* Live indicator bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="font-display text-lg uppercase tracking-wide text-cream">
            Live · {event.title}
          </span>
        </div>
        <span className="text-xs text-sand" suppressHydrationWarning>
          Updated{" "}
          {lastUpdated.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>

      {/* Announcements — delays, lunch break, venue changes */}
      <AnnouncementsFeed announcements={announcements} />

      {!hasAnyData ? (
        <div className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-12 text-center">
          <p className="text-lg text-sand">Results will appear here once the event begins.</p>
          <p className="mt-2 text-sm text-sand/60">
            This page updates automatically — no refresh needed.
          </p>
        </div>
      ) : (
        <>
          {/* Now Running & Next up — hidden while searching to keep focus */}
          {!q && allRunning.length > 0 ? (
            <section>
              <p className="eyebrow mb-4 flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                Now Running
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allRunning.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          ) : null}

          {!q && nextUp ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-sand/10 bg-ink-soft px-5 py-3.5 text-sm">
              <span className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-sand/60">
                <CalendarClock size={13} className="text-ember" /> Next up
              </span>
              <span className="font-medium text-cream">
                {nextUp.event_name} · {nextUp.category}
                {nextUp.gender ? ` ${nextUp.gender}` : ""}
              </span>
              <span className="text-sand">
                {formatScheduledTime(nextUp.scheduled_at!)}
                {nextUp.venue ? ` · ${nextUp.venue}` : ""}
              </span>
              <Countdown iso={nextUp.scheduled_at!} />
            </div>
          ) : null}

          {/* Sticky controls: search (always) + status (when browsing) */}
          <div className="sticky top-16 z-30 space-y-3 rounded-2xl border border-sand/10 bg-ink/95 p-3 backdrop-blur">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand/50"
              />
              <input
                type="search"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search athlete, bib, school or event"
                className="w-full rounded-full border border-white/15 bg-ink py-2.5 pl-9 pr-9 text-sm text-cream placeholder:text-sand/50 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand/50 hover:text-cream"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
            {!q ? (
              <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setActiveStatus(s.key)}
                    className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                      activeStatus === s.key
                        ? "bg-ember text-white"
                        : "bg-ink-soft text-sand hover:text-cream"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {q ? (
            /* ── Search results ─────────────────────────────────────────── */
            <section>
              <p className="mb-3 text-sm text-sand">
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for
                “{query.trim()}”
              </p>
              {searchResults.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-sand/10 bg-ink-soft/40 px-4">
                  {searchResults.map((r) => (
                    <LiveRoundRow
                      key={r.id}
                      item={r}
                      eventTitle={event.title}
                      defaultOpen
                      highlight={q}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-10 text-center text-sm text-sand">
                  No athletes or events match “{query.trim()}”.
                </p>
              )}
            </section>
          ) : (
            /* ── Browse: day tabs, filters, grouped programme ───────────── */
            <>
              {days.length > 1 ? (
                <div className="flex gap-2">
                  {days.map((d) => (
                    <button
                      key={d}
                      onClick={() => setActiveDay(d)}
                      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                        activeDay === d
                          ? "bg-ember text-white"
                          : "bg-ink-soft text-sand hover:text-cream"
                      }`}
                    >
                      Day {d}
                    </button>
                  ))}
                </div>
              ) : null}

              {categories.length > 1 || genders.length > 1 || disciplines.length > 1 ? (
                <div className="space-y-4 rounded-2xl border border-sand/10 bg-ink-soft p-5">
                  <FilterChips
                    label="Age Group"
                    options={categories}
                    active={activeCategory}
                    onSelect={handleCategoryChange}
                  />
                  <FilterChips
                    label="Gender"
                    options={genders}
                    active={activeGender}
                    onSelect={setActiveGender}
                  />
                  <FilterChips
                    label="Discipline"
                    options={disciplines}
                    active={activeDiscipline}
                    onSelect={setActiveDiscipline}
                  />
                </div>
              ) : null}

              {activeStatus === "finals" && totalEventCount > 0 ? (
                <button
                  type="button"
                  onClick={downloadAllFinals}
                  disabled={finalsPdfBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ember px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ember-bright disabled:opacity-60 sm:w-auto"
                >
                  {finalsPdfBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Download all finals (PDF)
                </button>
              ) : null}

              {/* Programme: Category → Gender → Event → Round, each level
                  sorted ascending (age/distance-aware) so the order matches
                  how a spectator naturally scans a printed heat sheet. */}
              {programme.length > 0 ? (
                <div className="space-y-8">
                  {programme.map((cat) => (
                    <div key={cat.key} className="space-y-4">
                      <div className="flex items-center gap-2.5 border-b border-sand/15 pb-2">
                        <h2 className="font-display text-xl uppercase tracking-wide text-cream sm:text-2xl">
                          {cat.category}
                        </h2>
                        {cat.hasLive ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            Live
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-5">
                        {cat.genders.map((g) => (
                          <div key={g.key} className="space-y-3">
                            <h3 className="eyebrow flex items-center gap-2 text-ember">
                              {g.gender}
                              {g.hasLive ? (
                                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                              ) : null}
                            </h3>
                            <div className="space-y-3">
                              {g.events.map((ev) => (
                                <EventGroupSection
                                  key={ev.key}
                                  group={ev}
                                  eventTitle={event.title}
                                  defaultOpen={activeStatus === "finals" ? true : undefined}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {nothingMatches ? (
                <p className="text-center text-sm text-sand">
                  {activeStatus === "finals"
                    ? "No finals to show yet."
                    : "No events match the selected filters."}
                </p>
              ) : null}

              <MedalTally rows={medalTally} />
            </>
          )}
        </>
      )}
    </div>
  );
}
