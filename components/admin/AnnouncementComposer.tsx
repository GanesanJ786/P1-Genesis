"use client";

import { useActionState, useEffect, useRef } from "react";
import { postAnnouncement, type ActionResult } from "@/lib/actions/admin";
import { TextArea, SelectField, CheckboxField, SubmitButton } from "./fields";

/**
 * Inline quick-post for event announcements (delays, lunch break, venue
 * changes). Viewers see the message in realtime — no page refresh anywhere.
 */
export function AnnouncementComposer({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    postAnnouncement,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <TextArea
        label="Announcement"
        name="message"
        required
        rows={3}
        placeholder="e.g. Lunch break — track events resume at 2:15 PM"
      />
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <SelectField
            label="Type"
            name="type"
            defaultValue="info"
            options={[
              { value: "info", label: "Info" },
              { value: "delay", label: "Delay" },
              { value: "venue", label: "Venue change" },
              { value: "safety", label: "Safety" },
              { value: "results", label: "Results" },
            ]}
          />
        </div>
        <CheckboxField label="Pin to top" name="is_pinned" />
        <SubmitButton>Post</SubmitButton>
      </div>
      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
    </form>
  );
}
