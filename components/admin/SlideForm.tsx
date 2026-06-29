"use client";

import { useActionState } from "react";
import { saveSlide, type ActionResult } from "@/lib/actions/admin";
import { ImageUploader } from "./ImageUploader";
import {
  TextField,
  TextArea,
  SelectField,
  CheckboxField,
  SubmitButton,
} from "./fields";
import type { Database } from "@/types/database.types";

type SlideRow = Database["public"]["Tables"]["slides"]["Row"];

export function SlideForm({ slide }: { slide?: SlideRow }) {
  const action = saveSlide.bind(null, slide?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <SelectField
        label="Carousel group"
        name="group_key"
        defaultValue={slide?.group_key ?? "home_hero"}
        options={[
          { value: "home_hero", label: "Home hero" },
          { value: "latest_events", label: "Latest events" },
        ]}
      />

      <div>
        <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
          Slide image
        </p>
        <ImageUploader field="image_path" folder="slides" defaultPath={slide?.image_path} />
      </div>

      <TextField label="Title" name="title" defaultValue={slide?.title ?? ""} />
      <TextArea label="Subtitle" name="subtitle" defaultValue={slide?.subtitle ?? ""} />
      <TextField
        label="Link URL (optional)"
        name="link_url"
        defaultValue={slide?.link_url ?? ""}
        placeholder="/events"
      />

      <div className="grid items-center gap-5 sm:grid-cols-2">
        <TextField label="Sort order" name="sort_order" type="number" defaultValue={String(slide?.sort_order ?? 0)} />
        <div className="pt-5">
          <CheckboxField label="Active (visible on site)" name="is_active" defaultChecked={slide?.is_active ?? true} />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{slide ? "Update slide" : "Create slide"}</SubmitButton>
    </form>
  );
}
