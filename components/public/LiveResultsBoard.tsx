"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ResultCard } from "@/components/public/ResultCard";
import type { Database } from "@/types/database.types";

type LiveResult = Database["public"]["Tables"]["live_results"]["Row"];
type Props = { initialData: LiveResult[] };

function upsertById(prev: LiveResult[], next: LiveResult): LiveResult[] {
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
function mergeFresh(prev: LiveResult[], polled: LiveResult[]): LiveResult[] {
  const prevById = new Map(prev.map((r) => [r.id, r]));
  return polled.map((row) => {
    const existing = prevById.get(row.id);
    return existing && existing.updated_at > row.updated_at ? existing : row;
  });
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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
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
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
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

export function LiveResultsBoard({ initialData }: Props) {
  const [results, setResults] = useState<LiveResult[]>(initialData);
  const [activeDay, setActiveDay] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // Whether the Realtime channel is currently subscribed. When it is, the poll
  // stays idle — otherwise a stale (edge-cached, up to ~30s old) poll response
  // races the live update and the value visibly flickers old→new→old.
  const realtimeConnected = useRef(false);

  /* ── Supabase Realtime ─────────────────────────────────────────────────── */
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("live-results-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_results" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setResults((prev) => prev.filter((r) => r.id !== payload.old.id));
          } else {
            setResults((prev) => upsertById(prev, payload.new as LiveResult));
          }
          setLastUpdated(new Date());
        },
      )
      .subscribe((status) => {
        realtimeConnected.current = status === "SUBSCRIBED";
      });
    return () => {
      realtimeConnected.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Polling fallback — only runs while Realtime is *not* connected, so it
        never fights a live update (handles viewers beyond the connection
        limit or with Realtime blocked). ────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(async () => {
      if (realtimeConnected.current) return; // Realtime healthy → no poll needed
      try {
        const res = await fetch("/api/live");
        if (res.ok) {
          const polled = (await res.json()) as LiveResult[];
          setResults((prev) => mergeFresh(prev, polled));
          setLastUpdated(new Date());
        }
      } catch { /* silent */ }
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  /* ── Derived data ─────────────────────────────────────────────────────── */
  const days = useMemo(
    () => Array.from(new Set(results.map((r) => r.day))).sort(),
    [results],
  );

  const dayAll = useMemo(
    () =>
      results
        .filter((r) => r.day === activeDay)
        .sort((a, b) => a.sort_order - b.sort_order),
    [results, activeDay],
  );

  const categories = useMemo(
    () =>
      Array.from(new Set(dayAll.map((r) => r.category).filter(Boolean))).sort(),
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
        if (activeDiscipline && r.event_type !== activeDiscipline) return false;
        return true;
      }),
    [dayAll, activeCategory, activeDiscipline],
  );

  // "Now Running" always shows across all days so parents never miss a live event
  const allRunning = useMemo(
    () =>
      results
        .filter((r) => r.status === "in_progress")
        .sort((a, b) => a.sort_order - b.sort_order),
    [results],
  );

  const completed = filtered.filter((r) => r.status === "completed");
  const upcoming = filtered.filter((r) => r.status === "upcoming");
  const hasAnyData = results.length > 0;

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
            Live · Genesis Track Fest 2026
          </span>
        </div>
        <span className="text-xs text-sand">
          Updated{" "}
          {lastUpdated.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>

      {!hasAnyData ? (
        <div className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-12 text-center">
          <p className="text-lg text-sand">Results will appear here once the event begins.</p>
          <p className="mt-2 text-sm text-sand/60">
            This page updates automatically — no refresh needed.
          </p>
        </div>
      ) : (
        <>
          {/* Now Running — pinned above filters so parents never miss a live event */}
          {allRunning.length > 0 ? (
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

          {/* Day tabs */}
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

          {/* Filter bar — only shown when there's something to filter */}
          {(categories.length > 1 || disciplines.length > 1) ? (
            <div className="space-y-4 rounded-2xl border border-sand/10 bg-ink-soft p-5">
              <FilterChips
                label="Age Group"
                options={categories}
                active={activeCategory}
                onSelect={handleCategoryChange}
              />
              <FilterChips
                label="Discipline"
                options={disciplines}
                active={activeDiscipline}
                onSelect={setActiveDiscipline}
              />
            </div>
          ) : null}

          {/* Completed results */}
          {completed.length > 0 ? (
            <section>
              <p className="eyebrow mb-4">✓ Completed</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Upcoming */}
          {upcoming.length > 0 ? (
            <section>
              <p className="eyebrow mb-4">⏳ Upcoming</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          ) : null}

          {filtered.length === 0 && allRunning.length === 0 ? (
            <p className="text-center text-sm text-sand">
              No events match the selected filters.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
