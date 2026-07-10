"use client";

import { useActionState } from "react";
import { saveLiveItem, type ActionResult } from "@/lib/actions/admin";
import { mediaToText, normalizeMedia } from "@/lib/events";
import { parseFinishers, type LiveRow } from "@/lib/live";
import { TextField, TextArea, SelectField, SubmitButton, Label } from "./fields";
import type { Database } from "@/types/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

/** Stored UTC timestamp → datetime-local value in stadium time (IST). */
function isoToIstLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}T${time}`;
}

const inputBase =
  "w-full rounded-lg border border-white/15 bg-ink px-2.5 py-2 text-sm text-cream placeholder:text-sand/40 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember";

export function LiveItemForm({
  item,
  events,
  defaultEventId,
}: {
  item?: LiveRow;
  events: EventRow[];
  defaultEventId?: string;
}) {
  const action = saveLiveItem.bind(null, item?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const finishers = parseFinishers(item?.results ?? []);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <SelectField
        label="Live event"
        name="event_id"
        defaultValue={item?.event_id ?? defaultEventId ?? events[0]?.id}
        options={events.map((e) => ({ value: e.id, label: e.title }))}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Event name"
          name="event_name"
          required
          defaultValue={item?.event_name}
          placeholder="100m Sprint"
        />
        <TextField
          label="Event key (leave blank to auto-generate)"
          name="event_key"
          defaultValue={item?.event_key}
          placeholder="100m-u14-boys-d1-final"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Age group"
          name="category"
          required
          defaultValue={item?.category}
          placeholder="U-14"
        />
        <SelectField
          label="Gender"
          name="gender"
          defaultValue={item?.gender ?? ""}
          options={[
            { value: "", label: "—" },
            { value: "Boys", label: "Boys" },
            { value: "Girls", label: "Girls" },
            { value: "Mixed", label: "Mixed" },
          ]}
        />
        <TextField
          label="Discipline"
          name="event_type"
          defaultValue={item?.event_type ?? ""}
          placeholder="Track / Long Jump…"
        />
        <TextField
          label="Heat / Round"
          name="heat_label"
          defaultValue={item?.heat_label ?? ""}
          placeholder="Final, Heat 1, Semi…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Day"
          name="day"
          type="number"
          min={1}
          defaultValue={String(item?.day ?? 1)}
        />
        <TextField
          label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={String(item?.sort_order ?? 0)}
        />
        <TextField
          label="Scheduled time (IST)"
          name="scheduled_at"
          type="datetime-local"
          defaultValue={isoToIstLocal(item?.scheduled_at ?? null)}
        />
        <TextField
          label="Venue / Track"
          name="venue"
          defaultValue={item?.venue ?? ""}
          placeholder="Main Track"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Status"
          name="status"
          defaultValue={item?.status ?? "upcoming"}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "in_progress", label: "Live" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
          ]}
        />
        <TextField
          label="Wind"
          name="wind"
          defaultValue={item?.wind ?? ""}
          placeholder="+1.2 m/s"
        />
        <TextField
          label="Participants"
          name="participants_count"
          type="number"
          min={0}
          defaultValue={
            item?.participants_count != null ? String(item.participants_count) : ""
          }
        />
        <TextField
          label="Notes"
          name="notes"
          defaultValue={item?.notes ?? ""}
          placeholder="Photo finish…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Point of contact — name"
          name="poc_name"
          defaultValue={item?.poc_name ?? ""}
          placeholder="Coach Kumar"
        />
        <TextField
          label="Point of contact — phone"
          name="poc_phone"
          defaultValue={item?.poc_phone ?? ""}
          placeholder="93630 69793"
        />
      </div>

      {/* Results editor — top 6 finishers */}
      <div>
        <Label>Results (top 6 — rows with an empty name are skipped)</Label>
        <div className="overflow-x-auto rounded-xl border border-white/10 p-3">
          <div className="min-w-[540px] space-y-2">
            <div className="grid grid-cols-[2.5rem_5rem_1fr_1fr_6rem_5rem] items-center gap-2 text-[0.65rem] uppercase tracking-widest text-sand/60">
              <span>Rank</span>
              <span>Bib</span>
              <span>Name</span>
              <span>School / Club</span>
              <span>Mark</span>
              <span>Record</span>
            </div>
            {[1, 2, 3, 4, 5, 6].map((rank) => {
              const f = finishers.find((x) => x.rank === rank);
              return (
                <div
                  key={rank}
                  className="grid grid-cols-[2.5rem_5rem_1fr_1fr_6rem_5rem] items-center gap-2"
                >
                  <span className="text-center text-sm font-semibold text-sand">
                    {rank}
                  </span>
                  <input
                    name={`bib_${rank}`}
                    defaultValue={f?.bib ?? ""}
                    placeholder="104"
                    className={inputBase}
                  />
                  <input
                    name={`name_${rank}`}
                    defaultValue={f?.name ?? ""}
                    placeholder="Athlete name"
                    className={inputBase}
                  />
                  <input
                    name={`school_${rank}`}
                    defaultValue={f?.school ?? ""}
                    placeholder="School / club"
                    className={inputBase}
                  />
                  <input
                    name={`mark_${rank}`}
                    defaultValue={f?.result ?? ""}
                    placeholder="12.4s / 5.6m"
                    className={inputBase}
                  />
                  <select
                    name={`record_${rank}`}
                    defaultValue={f?.record ?? ""}
                    className={inputBase}
                  >
                    <option value="">—</option>
                    <option value="MR">MR</option>
                    <option value="NR">NR</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-1.5 text-xs text-amber-400/90">
          ⚠ If this row also lives in the Google Sheet (same event key), the sheet
          overwrites status &amp; results on its next edit — fix the sheet too.
        </p>
      </div>

      <div>
        <TextArea
          label="Highlights — one link per line (YouTube or Instagram)"
          name="media_links"
          defaultValue={mediaToText(normalizeMedia(item?.media))}
          placeholder={"https://youtu.be/abc123 | Finish-line video"}
        />
      </div>

      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{item ? "Update schedule item" : "Create schedule item"}</SubmitButton>
    </form>
  );
}
