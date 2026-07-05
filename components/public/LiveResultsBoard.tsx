"use client";

import { useEffect, useState } from "react";
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

export function LiveResultsBoard({ initialData }: Props) {
  const [results, setResults] = useState<LiveResult[]>(initialData);
  const [activeDay, setActiveDay] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /* ── Supabase Realtime subscription ─────────────────────────────────── */
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Polling fallback — handles viewers beyond 200-connection limit ── */
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/live");
        if (res.ok) {
          const data: LiveResult[] = await res.json();
          setResults(data);
          setLastUpdated(new Date());
        }
      } catch {
        // silent — polling is best-effort
      }
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const days = Array.from(new Set(results.map((r) => r.day))).sort();
  const dayResults = results
    .filter((r) => r.day === activeDay)
    .sort((a, b) => a.sort_order - b.sort_order);

  const running = dayResults.filter((r) => r.status === "in_progress");
  const completed = dayResults.filter((r) => r.status === "completed");
  const upcoming = dayResults.filter((r) => r.status === "upcoming");

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
          Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

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

      {!hasAnyData ? (
        <div className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-12 text-center">
          <p className="text-lg text-sand">Results will appear here once the event begins.</p>
          <p className="mt-2 text-sm text-sand/60">This page updates automatically — no refresh needed.</p>
        </div>
      ) : (
        <>
          {/* Now Running */}
          {running.length > 0 ? (
            <section>
              <p className="eyebrow mb-4 flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                Now Running
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {running.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Completed */}
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
        </>
      )}
    </div>
  );
}
