"use client";

import { useState } from "react";
import type { MedalTallyRow } from "@/lib/live";

const VISIBLE_DEFAULT = 10;

/**
 * Running medal count by school/club, computed from completed finals.
 * Fuels the team rivalry — top 10 with an expander for the full table.
 */
export function MedalTally({ rows }: { rows: MedalTallyRow[] }) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const visible = expanded ? rows : rows.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = rows.length - VISIBLE_DEFAULT;

  return (
    <section aria-label="Medal tally">
      <p className="eyebrow mb-4">🏅 Medal Tally</p>
      <div className="overflow-x-auto rounded-2xl border border-sand/10 bg-ink-soft">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-sand/10 text-left text-[0.65rem] uppercase tracking-widest text-sand/60">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">School / Club</th>
              <th className="px-3 py-3 text-center font-medium">🥇</th>
              <th className="px-3 py-3 text-center font-medium">🥈</th>
              <th className="px-3 py-3 text-center font-medium">🥉</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={row.school} className="border-b border-sand/5 last:border-0">
                <td className="px-4 py-2.5 text-sand/60">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-cream">{row.school}</td>
                <td className="px-3 py-2.5 text-center text-cream">{row.gold}</td>
                <td className="px-3 py-2.5 text-center text-cream">{row.silver}</td>
                <td className="px-3 py-2.5 text-center text-cream">{row.bronze}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-ember">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
