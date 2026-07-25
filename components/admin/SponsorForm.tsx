"use client";

import { useActionState } from "react";
import { saveSponsor, type ActionResult } from "@/lib/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { TextField, TextArea, SelectField, CheckboxField, SubmitButton } from "./fields";
import type { Database } from "@/types/database.types";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];
type EventOption = { id: string; title: string; slug: string };

export function SponsorForm({
  sponsor,
  events,
  selectedEventIds = [],
}: {
  sponsor?: SponsorRow;
  events?: EventOption[];
  selectedEventIds?: string[];
}) {
  const action = saveSponsor.bind(null, sponsor?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const selectedEvents = new Set(selectedEventIds);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <TextField label="Sponsor name" name="name" required defaultValue={sponsor?.name} />
      <SelectField
        label="Tier"
        name="tier"
        defaultValue={sponsor?.tier ?? "gold"}
        options={[
          { value: "title", label: "Title Sponsor" },
          { value: "platinum", label: "Platinum" },
          { value: "gold", label: "Gold" },
          { value: "silver", label: "Silver" },
          { value: "bronze", label: "Bronze" },
          { value: "medical", label: "Medical Partner" },
          { value: "sound", label: "Radio Partner" },
          { value: "partner", label: "Event Partner" },
          { value: "supporter", label: "Event Supporter" },
        ]}
      />
      <TextArea
        label="Description (optional)"
        name="description"
        defaultValue={sponsor?.description ?? ""}
        maxLength={600}
        placeholder="A short line about the sponsor, shown beside their logo on the event page."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Logo</p>
          <ImageUploader field="logo_path" folder="sponsors" defaultPath={sponsor?.logo_path} />
          <p className="mt-1.5 text-xs text-sand/60">Shown on a light tile — a transparent PNG/SVG-style logo works best.</p>
        </div>
        <div>
          <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Banner (optional)</p>
          <ImageUploader field="banner_path" folder="sponsor-banners" defaultPath={sponsor?.banner_path} />
          <p className="mt-1.5 text-xs text-sand/60">Wide image featured for Title / Platinum / Gold sponsors.</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Amount (₹)" name="amount_inr" type="number" defaultValue={sponsor?.amount_inr ? String(sponsor.amount_inr) : ""} />
        <TextField label="Website URL" name="website_url" defaultValue={sponsor?.website_url ?? ""} placeholder="https://" />
      </div>
      <div className="grid items-center gap-5 sm:grid-cols-2">
        <TextField label="Sort order" name="sort_order" type="number" defaultValue={String(sponsor?.sort_order ?? 0)} />
        <div className="pt-5">
          <CheckboxField label="Active" name="is_active" defaultChecked={sponsor?.is_active ?? true} />
        </div>
      </div>

      {events ? (
        <div>
          <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
            Show on live events
          </p>
          <input type="hidden" name="event_ids_present" value="1" />
          {events.length > 0 ? (
            <>
              <div className="grid gap-2 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
                {events.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-cream"
                  >
                    <input
                      type="checkbox"
                      name="event_ids"
                      value={e.id}
                      defaultChecked={selectedEvents.has(e.id)}
                      className="h-4 w-4 rounded border-white/30 bg-ink accent-ember"
                    />
                    <span className="min-w-0 truncate">{e.title}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-sand/60">
                Tick the live events this sponsor should appear on. (Also editable
                from each event under Events.)
              </p>
            </>
          ) : (
            <p className="text-sm text-sand/70">
              No events are in the Live Hub yet — turn on “Show in Live Hub” for an
              event first, then it’ll appear here.
            </p>
          )}
        </div>
      ) : null}
      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{sponsor ? "Update sponsor" : "Create sponsor"}</SubmitButton>
    </form>
  );
}
