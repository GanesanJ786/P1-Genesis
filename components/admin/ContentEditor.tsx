"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { saveContent, type ActionResult } from "@/lib/actions/admin";
import { SubmitButton } from "./fields";

const LABELS: Record<string, string> = {
  "hero.eyebrow": "Hero eyebrow",
  "hero.title": "Hero title",
  "hero.tagline": "Hero tagline",
  "event.oneliner": "Event one-liner",
  "foundation.quote": "Foundation quote",
  "impact.commitment": "Commitment statement",
};

function ContentRow({ contentKey, value }: { contentKey: string; value: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    saveContent,
    null,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-white/10 bg-ink-soft p-5"
    >
      <input type="hidden" name="key" value={contentKey} />
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-widest text-sand">
          {LABELS[contentKey] ?? contentKey}
        </label>
        <code className="text-[0.65rem] text-sand/50">{contentKey}</code>
      </div>
      <textarea
        name="value"
        defaultValue={value}
        rows={2}
        className="w-full rounded-lg border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-cream focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember"
      />
      <div className="mt-3 flex items-center gap-3">
        <SubmitButton>Save</SubmitButton>
        {state?.ok ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-400">
            <CheckCircle2 size={15} /> Saved
          </span>
        ) : null}
        {state?.error ? (
          <span className="text-sm text-ember-bright">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}

export function ContentEditor({ values }: { values: Record<string, string> }) {
  return (
    <div className="grid max-w-3xl gap-4">
      {Object.entries(values).map(([key, value]) => (
        <ContentRow key={key} contentKey={key} value={value} />
      ))}
    </div>
  );
}
