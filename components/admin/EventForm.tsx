"use client";

import { useActionState } from "react";
import { saveEvent, type ActionResult } from "@/lib/actions/admin";
import { mediaToText, normalizeMedia } from "@/lib/events";
import { ImageUploader } from "./ImageUploader";
import {
  TextField,
  TextArea,
  SelectField,
  SubmitButton,
} from "./fields";
import type { Database } from "@/types/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function EventForm({ event }: { event?: EventRow }) {
  const action = saveEvent.bind(null, event?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <TextField label="Title" name="title" required defaultValue={event?.title} />
      <TextField
        label="Slug (leave blank to auto-generate)"
        name="slug"
        defaultValue={event?.slug}
        placeholder="genesis-track-fest-2026"
      />
      <TextArea label="Summary" name="summary" defaultValue={event?.summary ?? ""} />
      <TextArea label="Body" name="body" defaultValue={event?.body ?? ""} />

      <div>
        <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
          Cover image
        </p>
        <ImageUploader field="cover_image" folder="events" defaultPath={event?.cover_image} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Start date" name="start_date" type="date" defaultValue={event?.start_date ?? ""} />
        <TextField label="End date" name="end_date" type="date" defaultValue={event?.end_date ?? ""} />
      </div>
      <TextField label="Location" name="location" defaultValue={event?.location ?? ""} />

      <TextField
        label="Registration URL (Google Form — shown as Register button)"
        name="registration_url"
        type="url"
        defaultValue={event?.registration_url ?? ""}
        placeholder="https://forms.gle/…"
      />

      <div>
        <TextArea
          label="Media links — one per line (YouTube or Instagram)"
          name="media_links"
          defaultValue={mediaToText(normalizeMedia(event?.media))}
          placeholder={"https://youtu.be/abc123 | Finals highlights\nhttps://www.instagram.com/p/xyz/ | Podium moments"}
        />
        <p className="mt-1.5 text-xs text-sand">
          Paste YouTube or Instagram links (add an optional <code>| caption</code>).
          No images are uploaded — media is embedded from the source.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Status"
          name="status"
          defaultValue={event?.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived (force into Successful Events)" },
          ]}
        />
        <TextField label="Sort order" name="sort_order" type="number" defaultValue={String(event?.sort_order ?? 0)} />
      </div>
      <p className="-mt-2 text-xs text-sand">
        Past-dated published events move to “Successful Events” automatically.
      </p>

      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{event ? "Update event" : "Create event"}</SubmitButton>
    </form>
  );
}
