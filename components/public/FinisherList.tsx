import type { Finisher } from "@/lib/live";

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
        return (
          <div
            // rank alone isn't guaranteed unique — tied placings (a dead
            // heat) legitimately share a rank — so fall back to bib, then
            // array position, rather than assuming rank never repeats.
            key={entry.bib ? `${entry.rank}-${entry.bib}` : `${entry.rank}-${i}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              isMatch
                ? "bg-ember/15 ring-1 ring-ember/40"
                : isFinal && entry.rank === 1
                  ? "bg-amber-500/10"
                  : "bg-ink/60"
            }`}
          >
            {isFinal && entry.rank <= 3 ? (
              <span className="w-6 shrink-0 text-center text-lg leading-none">
                {MEDALS[entry.rank - 1]}
              </span>
            ) : (
              <span className="w-6 shrink-0 text-center text-xs font-bold text-sand/50">
                #{entry.rank}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cream">
                {entry.bib ? (
                  <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-sand">
                    {entry.bib}
                  </span>
                ) : null}
                {entry.name}
                {entry.record ? (
                  <span
                    className={`ml-1.5 rounded px-1.5 py-0.5 text-[0.65rem] font-bold ${
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
              </p>
              {entry.school ? (
                <p className="truncate text-xs text-sand">{entry.school}</p>
              ) : null}
            </div>

            {entry.result ? (
              <span className="shrink-0 text-sm font-semibold text-ember">
                {entry.result}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
