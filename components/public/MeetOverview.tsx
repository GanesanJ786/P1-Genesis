"use client";

import { useState } from "react";
import type { MeetStats, MedalTallyRow, IndividualRankingRow } from "@/lib/live";
import { MedalTally } from "@/components/public/MedalTally";
import { IndividualRankings } from "@/components/public/IndividualRankings";

const GENDER_COLORS: Record<string, string> = {
  Boys: "bg-sky-400",
  Girls: "bg-pink-400",
  Men: "bg-indigo-400",
  Women: "bg-rose-400",
};

const STANDINGS_TABS = [
  { key: "institutions", label: "Institutions" },
  { key: "medals", label: "Medal Tally" },
  { key: "individual", label: "Individual Ranking" },
] as const;
type StandingsTab = (typeof STANDINGS_TABS)[number]["key"];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-sand/10 bg-ink-soft/60 p-4 text-center">
      <p className="font-display text-3xl text-cream">{value}</p>
      <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-sand/60">{label}</p>
    </div>
  );
}

function ShareBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className={`h-full rounded-full transition-[width] ${className ?? "bg-ember"}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

/**
 * Meet-wide snapshot: stat cards, medal distribution, gender split, and top
 * institutions by participation — a summary/standings view, distinct from
 * the Live tab's real-time race tracking. All figures reflect results
 * posted so far (not the full pre-registered Roster, which lives in Google
 * Sheets and isn't visible to the site), so they grow through the day.
 */
export function MeetOverview({
  stats,
  medalRows,
  individualRows,
  onViewInstitution,
  onViewAthlete,
}: {
  stats: MeetStats;
  medalRows: MedalTallyRow[];
  individualRows: IndividualRankingRow[];
  onViewInstitution?: (school: string) => void;
  onViewAthlete?: (name: string) => void;
}) {
  const medalPct = (n: number) =>
    stats.medalTotals.total > 0 ? Math.round((n / stats.medalTotals.total) * 100) : 0;

  const [standingsTab, setStandingsTab] = useState<StandingsTab>("medals");

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">So Far</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Athletes" value={stats.totalAthletes} />
          <StatCard label="Categories" value={stats.totalCategories} />
          <StatCard label="Events" value={stats.totalEvents} />
          <StatCard label="Results" value={stats.totalResults} />
        </div>
        <p className="mt-2.5 text-xs text-sand/50">
          Reflects results posted so far — updates live as the meet progresses.
        </p>
      </div>

      {stats.medalTotals.total > 0 ? (
        <section>
          <p className="eyebrow mb-4">🏅 Medal Distribution</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-cream">🥇 Gold</span>
                <span className="font-display text-2xl text-amber-400">
                  {stats.medalTotals.gold}
                </span>
              </div>
              <ShareBar pct={medalPct(stats.medalTotals.gold)} className="mt-2.5 bg-amber-400" />
            </div>
            <div className="rounded-2xl border border-slate-400/20 bg-slate-400/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-cream">🥈 Silver</span>
                <span className="font-display text-2xl text-slate-300">
                  {stats.medalTotals.silver}
                </span>
              </div>
              <ShareBar pct={medalPct(stats.medalTotals.silver)} className="mt-2.5 bg-slate-300" />
            </div>
            <div className="rounded-2xl border border-orange-700/20 bg-orange-700/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-cream">🥉 Bronze</span>
                <span className="font-display text-2xl text-orange-400">
                  {stats.medalTotals.bronze}
                </span>
              </div>
              <ShareBar pct={medalPct(stats.medalTotals.bronze)} className="mt-2.5 bg-orange-400" />
            </div>
          </div>
        </section>
      ) : null}

      {stats.genderDistribution.length > 0 ? (
        <section>
          <p className="eyebrow mb-4">Gender Distribution</p>
          <div className="space-y-4 rounded-2xl border border-sand/10 bg-ink-soft/40 p-5">
            {stats.genderDistribution.map((g) => (
              <div key={g.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-cream">{g.label}</span>
                  <span className="text-sand">
                    {g.count} athlete{g.count === 1 ? "" : "s"} · {g.pct}%
                  </span>
                </div>
                <ShareBar pct={g.pct} className={GENDER_COLORS[g.label] ?? "bg-ember"} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div>
        <div className="snap-rail -mx-1 mb-5 flex gap-2 overflow-x-auto px-1">
          {STANDINGS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStandingsTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                standingsTab === t.key
                  ? "bg-ember text-white shadow-sm shadow-ember/30"
                  : "bg-ink-soft text-sand hover:text-cream"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {standingsTab === "institutions" ? (
          stats.topInstitutions.length > 0 ? (
            <section>
              <p className="eyebrow mb-4">Top Institutions by Participation</p>
              <div className="space-y-3 rounded-2xl border border-sand/10 bg-ink-soft/40 p-5">
                {stats.topInstitutions.slice(0, 10).map((s, i) => (
                  <div key={s.school} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-sand">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm uppercase text-cream">{s.school}</span>
                    <span className="shrink-0 text-sm font-semibold text-ember">{s.count}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <p className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-10 text-center text-sm text-sand">
              No institutions yet.
            </p>
          )
        ) : standingsTab === "medals" ? (
          medalRows.length > 0 ? (
            <MedalTally rows={medalRows} onViewInstitution={onViewInstitution} />
          ) : (
            <p className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-10 text-center text-sm text-sand">
              No medals awarded yet.
            </p>
          )
        ) : individualRows.length > 0 ? (
          <IndividualRankings rows={individualRows} onViewAthlete={onViewAthlete} />
        ) : (
          <p className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-10 text-center text-sm text-sand">
            No scoring results yet.
          </p>
        )}
      </div>
    </div>
  );
}
