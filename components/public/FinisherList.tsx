import { dqFullReason, displayResult, isDisqualified, isExcludedFromScoring, type Finisher } from "@/lib/live";

/** Podium/finisher rows shared by the hero card and the compact round row. */

const MEDALS = ["🥇", "🥈", "🥉"];

const RECORD_STYLES: Record<string, string> = {
  MR: "bg-amber-500/20 text-amber-400",
  NR: "bg-purple-500/20 text-purple-400",
};

export function FinisherList({
  finishers,
  isFinal,
  highlight,
}: {
  finishers: Finisher[];
  isFinal: boolean;
  /** Lower-cased search term — matching finishers get a subtle ring. */
  highlight?: string;
}) {
  if (finishers.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {finishers.map((entry, i) => {
        const isMatch =
          highlight &&
          (entry.name.toLowerCase().includes(highlight) ||
            entry.school.toLowerCase().includes(highlight) ||
            (entry.bib ?? "").toLowerCase().includes(highlight));
        const excluded = isExcludedFromScoring(entry);
        return (
          <div
            // rank alone isn't guaranteed unique — tied placings (a dead
            // heat) legitimately share a rank — so fall back to bib, then
            // array position, rather than assuming rank never repeats.
            key={entry.bib ? `${entry.rank}-${entry.bib}` : `${entry.rank}-${i}`}
            className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors ${
              isMatch
                ? "bg-ember/15 ring-1 ring-ember/40"
                : isFinal && entry.rank === 1 && !excluded
                  ? "bg-amber-500/10"
                  : "bg-white/[0.03]"
            }`}
          >
            {/* Rank: medal for a finals podium, otherwise a consistent
                circular number badge — reads as a clean native list, and
                the podium tiers (gold/silver/bronze) stay colour-coded. A
                disqualified finisher never gets a medal even if their rank
                looks like a podium finish. */}
            {isFinal && entry.rank <= 3 && !excluded ? (
              <span className="w-7 shrink-0 text-center text-xl leading-none">
                {MEDALS[entry.rank - 1]}
              </span>
            ) : (
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                  entry.rank === 1 && !excluded
                    ? "bg-ember/20 text-ember"
                    : "bg-white/[0.06] text-sand"
                }`}
              >
                {entry.rank}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-cream">
                {entry.bib ? (
                  <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-sand">
                    {entry.bib}
                  </span>
                ) : null}
                <span className="truncate">{entry.name}</span>
                {entry.record ? (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-bold ${
                      RECORD_STYLES[entry.record] ?? "bg-white/10 text-cream"
                    }`}
                    title={
                      entry.record === "MR"
                        ? "Meet record"
                        : entry.record === "NR"
                          ? "National record"
                          : "Record"
                    }
                  >
                    {entry.record}
                  </span>
                ) : null}
                {isDisqualified(entry) ? (
                  <span
                    className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[0.65rem] font-bold text-rose-400"
                    title={dqFullReason(entry) ?? "Disqualified"}
                  >
                    DQ
                  </span>
                ) : null}
              </p>
              {entry.school ? (
                <p className="truncate text-xs text-sand/80">{entry.school}</p>
              ) : null}
            </div>

            {displayResult(entry) ? (
              <span
                className={`shrink-0 text-sm font-bold tabular-nums ${
                  excluded ? "text-rose-400" : "text-ember"
                }`}
              >
                {displayResult(entry)}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
