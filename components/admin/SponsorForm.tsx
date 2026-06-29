"use client";

import { useActionState } from "react";
import { saveSponsor, type ActionResult } from "@/lib/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { TextField, SelectField, CheckboxField, SubmitButton } from "./fields";
import type { Database } from "@/types/database.types";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];

export function SponsorForm({ sponsor }: { sponsor?: SponsorRow }) {
  const action = saveSponsor.bind(null, sponsor?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <TextField label="Sponsor name" name="name" required defaultValue={sponsor?.name} />
      <SelectField
        label="Tier"
        name="tier"
        defaultValue={sponsor?.tier ?? "gold"}
        options={[
          { value: "title", label: "Title" },
          { value: "platinum", label: "Platinum" },
          { value: "gold", label: "Gold" },
          { value: "silver", label: "Silver" },
          { value: "supporter", label: "Supporter" },
        ]}
      />
      <div>
        <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">Logo</p>
        <ImageUploader field="logo_path" folder="sponsors" defaultPath={sponsor?.logo_path} />
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
      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{sponsor ? "Update sponsor" : "Create sponsor"}</SubmitButton>
    </form>
  );
}
