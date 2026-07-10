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

/* ── Event grouping ───────────────────────────────────────────────────────── */
// An "event" in athletics = Discipline · Age group · Gender (e.g. "100m · U-14
// · Boys"); its rounds are the heats/semis/final. Grouping turns a long flat
// wall of cards into a scannable programme so spectators find their race fast.

type EventGroup = {
  key: string;
  title: string;
  rounds: LiveRow[];
  hasLive: boolean;
};

/** Round progression order within an event: heats → quarters → semis → final. */
function roundRank(heat: string | null): number {
  const h = (heat || "").toLowerCase();
  if (h.includes("heat")) return 1;
  if (h.includes("quarter")) return 2;
  if (h.includes("semi")) return 3; // must precede the "final" check ("semifinal")
  if (h.includes("final")) return 5;
  return 4;
}

function groupByEvent(rows: LiveRow[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const r of rows) {
    const discipline = (r.event_type || r.event_name || "").trim();
    const parts = [discipline, r.category, r.gender].filter(Boolean) as string[];
    const key = parts.join(" · ").toLowerCase();
    let g = map.get(key);
    if (!g) {
      g = { key, title: parts.join(" · "), rounds: [], hasLive: false };
      map.set(key, g);
    }
    g.rounds.push(r);
    if (r.status === "in_progress" || r.status === "paused") g.hasLive = true;
  }
  const groups = [...map.values()];
  for (const g of groups) {
    g.rounds.sort(
      (a, b) =>
        a.day - b.day ||
        roundRank(a.heat_label) - roundRank(b.heat_label) ||
        a.sort_order - b.sort_order,
    );
  }
  groups.sort((a, b) => scheduleComparator(a.rounds[0], b.rounds[0]));
  return groups;
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
  }, [event.id]);

  /* ── Polling fallback — only runs while Realtime is *not* connected, so it
        never fights a live update (handles viewers beyond the connection
        limit or with Realtime blocked). ────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(async () => {
      if (realtimeConnected.current) return; // Realtime healthy → no poll needed
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
    }, 10_000);
    return () => clearInterval(id);
  }, [event.slug]);

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

  // Group the filtered set into events (Discipline · Age · Gender), each with
  // its rounds — a scannable programme instead of a flat wall of cards. The
  // status filter narrows which rounds get grouped.
  const groups = useMemo(() => {
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
    return groupByEvent(set);
  }, [filtered, activeStatus]);

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
    groups.length === 0 && (activeStatus !== "all" || allRunning.length === 0);

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

              {activeStatus === "finals" && groups.length > 0 ? (
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

              {groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map((g) => (
                    <EventGroupSection
                      key={g.key}
                      group={g}
                      eventTitle={event.title}
                      defaultOpen={activeStatus === "finals" ? true : undefined}
                    />
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
