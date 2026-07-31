"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { MedalTallyRow } from "@/lib/live";

const VISIBLE_DEFAULT = 10;

/**
 * Running team standings by school/club, computed from completed finals.
 * Cards, not a table — this page's users are overwhelmingly on mobile, and a
 * 6+ column table forces horizontal scrolling (same reasoning as the
 * Individual Results tab's card redesign). Points is the primary ranking
 * metric (see computeMedalTally), so it's the most prominent number here;
 * medal counts and participants are secondary context underneath.
 */
export function MedalTally({
  rows,
  onViewInstitution,
}: {
  rows: MedalTallyRow[];
  /** Jumps to the Individual Results tab pre-filtered to this school. */
  onViewInstitution?: (school: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const visible = expanded ? rows : rows.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = rows.length - VISIBLE_DEFAULT;

  return (
    <section aria-label="Medal tally">
      <p className="eyebrow mb-4">🏅 Medal Tally</p>
      <div className="space-y-2">
        {visible.map((row, i) => (
          <div key={row.school} className="rounded-xl bg-white/[0.03] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-sand">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold uppercase text-cream">{row.school}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-sand/70">
                  <span>{row.participants} athlete{row.participants === 1 ? "" : "s"}</span>
                  <span>🥇 {row.gold}</span>
                  <span>🥈 {row.silver}</span>
                  <span>🥉 {row.bronze}</span>
                  <span>Total {row.total}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-xl leading-none text-ember">{row.points}</p>
                <p className="mt-0.5 text-[0.6rem] uppercase tracking-widest text-sand/50">pts</p>
              </div>
            </div>
            {onViewInstitution ? (
              <button
                type="button"
                onClick={() => onViewInstitution(row.school)}
                aria-label={`View ${row.school}'s individual results`}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-ember hover:text-ember-bright active:scale-95"
              >
                <Eye size={12} /> View results
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-semibold text-ember hover:text-ember-bright"
        >
          {expanded ? "Show top 10" : `Show all ${rows.length} teams`}
        </button>
      ) : null}
    </section>
  );
}
