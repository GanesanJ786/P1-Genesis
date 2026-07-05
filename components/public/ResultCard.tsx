import type { Database, Json } from "@/types/database.types";

type LiveResult = Database["public"]["Tables"]["live_results"]["Row"];

type FinisherEntry = { rank: number; name: string; school: string; result: string };

const MEDALS = ["🥇", "🥈", "🥉"];

const STATUS_STYLES = {
  in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  completed: "bg-green-500/15 text-green-400",
  upcoming: "bg-white/10 text-sand",
};

function parseFinishers(raw: Json): FinisherEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as FinisherEntry[]).filter((r) => r?.name);
}

function relativeTime(isoStr: string) {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ResultCard({ result }: { result: LiveResult }) {
  const finishers = parseFinishers(result.results);
  const statusStyle = STATUS_STYLES[result.status] ?? STATUS_STYLES.upcoming;
  const heatLabel = result.heat_label;
  // Medals shown only in finals (null / empty / "Final" heat)
  const isFinal = !heatLabel || heatLabel.trim().toLowerCase() === "final";

  return (
    <div
      className={`flex flex-col rounded-2xl border border-sand/10 bg-ink-soft p-5 ${
        result.status === "in_progress" ? "ring-2 ring-amber-500/40" : ""
      }`}
    >
      {/* Header badges */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-ember/15 px-2.5 py-0.5 text-xs font-semibold text-ember">
            {result.category}
          </span>
          {result.gender ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-sand">
              {result.gender}
            </span>
          ) : null}
          {result.event_type ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-sand">
              {result.event_type}
            </span>
          ) : null}
          {heatLabel ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isFinal
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-sky-500/15 text-sky-400"
              }`}
            >
              {heatLabel}
            </span>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle}`}
        >
          {result.status === "in_progress" ? "● Live" : result.status}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg uppercase text-cream">
        {result.event_name}
      </h3>

      {/* Finishers list */}
      {finishers.length > 0 ? (
        <div className="mt-4 flex-1 space-y-1.5">
          {finishers.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                isFinal && entry.rank === 1 ? "bg-amber-500/10" : "bg-ink/60"
              }`}
            >
              {/* Rank indicator */}
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
                <p className="truncate text-sm font-medium text-cream">{entry.name}</p>
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
          ))}
        </div>
      ) : (
        <p className="mt-4 flex-1 text-sm italic text-sand/60">Results pending…</p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-sand/50">
        {result.notes ? <span className="truncate">{result.notes}</span> : <span />}
        <span className="shrink-0">Updated {relativeTime(result.updated_at)}</span>
      </div>
    </div>
  );
}
