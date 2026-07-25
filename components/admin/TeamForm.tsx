"use client";

import { useActionState } from "react";
import { saveTeamMember, type ActionResult } from "@/lib/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { TextField, TextArea, SelectField, CheckboxField, SubmitButton } from "./fields";
import type { Database } from "@/types/database.types";

type TeamRow = Database["public"]["Tables"]["team_members"]["Row"];

export function TeamForm({ member }: { member?: TeamRow }) {
  const action = saveTeamMember.bind(null, member?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <TextField label="Name" name="name" required defaultValue={member?.name} />
      <SelectField
        label="Type"
        name="member_type"
        defaultValue={member?.member_type ?? "leadership"}
        options={[
          { value: "leadership", label: "Leadership" },
          { value: "coach", label: "Coach" },
        ]}
      />
      <TextField label="Role / title" name="role_title" defaultValue={member?.role_title ?? ""} />
      <TextArea label="Bio" name="bio" defaultValue={member?.bio ?? ""} />
      <div>
        <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Photo</p>
        <ImageUploader field="photo_path" folder="team" defaultPath={member?.photo_path} />
      </div>
      <div className="grid items-center gap-5 sm:grid-cols-2">
        <TextField label="Sort order" name="sort_order" type="number" defaultValue={String(member?.sort_order ?? 0)} />
        <div className="pt-5">
          <CheckboxField label="Active" name="is_active" defaultChecked={member?.is_active ?? true} />
        </div>
      </div>
      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{member ? "Update member" : "Add member"}</SubmitButton>
    </form>
  );
}
