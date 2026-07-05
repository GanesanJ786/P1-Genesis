import type { Database } from "@/types/database.types";
import type { Json } from "@/types/database.types";

type LiveResult = Database["public"]["Tables"]["live_results"]["Row"];

type PodiumEntry = { rank: number; name: string; school: string; result: string };

const MEDALS = ["🥇", "🥈", "🥉"];

const STATUS_STYLES = {
  in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  completed: "bg-green-500/15 text-green-400",
  upcoming: "bg-white/10 text-sand",
};

function parsePodium(raw: Json): PodiumEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as PodiumEntry[]).filter((r) => r?.name);
}

function relativeTime(isoStr: string) {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ResultCard({ result }: { result: LiveResult }) {
  const podium = parsePodium(result.results);
  const statusStyle = STATUS_STYLES[result.status] ?? STATUS_STYLES.upcoming;

  return (
    <div
      className={`rounded-2xl border border-sand/10 bg-ink-soft p-5 ${
        result.status === "in_progress" ? "ring-2 ring-amber-500/40" : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle}`}>
          {result.status === "in_progress" ? "● Live" : result.status}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg uppercase text-cream">
        {result.event_name}
      </h3>

      {/* Podium */}
      {podium.length > 0 ? (
        <div className="mt-4 space-y-2">
          {podium.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-3 rounded-xl bg-ink/60 px-3 py-2"
            >
              <span className="text-lg leading-none">{MEDALS[entry.rank - 1] ?? `#${entry.rank}`}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-cream">{entry.name}</p>
                {entry.school ? (
                  <p className="truncate text-xs text-sand">{entry.school}</p>
                ) : null}
              </div>
              {entry.result ? (
                <span className="shrink-0 text-sm font-semibold text-ember">{entry.result}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-sand/60 italic">Results pending…</p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-sand/50">
        {result.notes ? <span>{result.notes}</span> : <span />}
        <span>Updated {relativeTime(result.updated_at)}</span>
      </div>
    </div>
  );
}
