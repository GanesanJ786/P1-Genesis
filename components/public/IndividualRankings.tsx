"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { IndividualRankingRow } from "@/lib/live";

const VISIBLE_DEFAULT = 10;

/**
 * Top athletes by their own scoring points, summed across every completed
 * final — the individual counterpart to MedalTally's school-level standings.
 * Same card layout/conventions as MedalTally (mobile-first, Points the
 * primary ranking metric) so the two leaderboards read as one family.
 */
export function IndividualRankings({
  rows,
  onViewAthlete,
}: {
  rows: IndividualRankingRow[];
  /** Jumps to the athlete's races via the page-level search. */
  onViewAthlete?: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const visible = expanded ? rows : rows.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = rows.length - VISIBLE_DEFAULT;

  return (
    <section aria-label="Individual rankings">
      <p className="eyebrow mb-4">🏆 Individual Rankings</p>
      <div className="space-y-2">
        {visible.map((row, i) => (
          <div key={`${row.bib ?? row.name}-${row.school}`} className="rounded-xl bg-white/[0.03] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-sand">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-cream">
                  {row.bib ? (
                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-sand">
                      {row.bib}
                    </span>
                  ) : null}
                  <span className="truncate">{row.name}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-sand/70">
                  <span className="truncate">{row.school}</span>
                  {row.gold ? <span>🥇 {row.gold}</span> : null}
                  {row.silver ? <span>🥈 {row.silver}</span> : null}
                  {row.bronze ? <span>🥉 {row.bronze}</span> : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-xl leading-none text-ember">{row.points}</p>
                <p className="mt-0.5 text-[0.6rem] uppercase tracking-widest text-sand/50">pts</p>
              </div>
            </div>
            {onViewAthlete ? (
              <button
                type="button"
                onClick={() => onViewAthlete(row.name)}
                aria-label={`View ${row.name}'s results`}
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
          {expanded ? "Show top 10" : `Show all ${rows.length} athletes`}
        </button>
      ) : null}
    </section>
  );
}
