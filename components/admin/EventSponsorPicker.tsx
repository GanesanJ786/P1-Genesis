import type { Database } from "@/types/database.types";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];

/**
 * Per-event sponsor assignment inside the EventForm: checked sponsors appear
 * on the event's live page. The hidden marker field tells saveEvent that the
 * picker was rendered, so unchecking everything really clears the list.
 */
export function EventSponsorPicker({
  sponsors,
  selectedIds,
}: {
  sponsors: SponsorRow[];
  selectedIds: string[];
}) {
  const selected = new Set(selectedIds);
  return (
    <div>
      <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
        Event sponsors (shown on the live page)
      </p>
      <input type="hidden" name="sponsor_ids_present" value="1" />
      {sponsors.length === 0 ? (
        <p className="text-sm text-sand/70">
          No active sponsors yet — add them under Sponsors first.
        </p>
      ) : (
        <div className="grid gap-2 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
          {sponsors.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-3 text-sm text-cream"
            >
              <input
                type="checkbox"
                name="sponsor_ids"
                value={s.id}
                defaultChecked={selected.has(s.id)}
                className="h-4 w-4 rounded border-white/30 bg-ink accent-ember"
              />
              <span className="min-w-0 truncate">
                {s.name}
                <span className="ml-1.5 text-xs uppercase text-sand/60">{s.tier}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
