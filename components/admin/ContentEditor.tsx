"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { saveContent, type ActionResult } from "@/lib/actions/admin";
import { SubmitButton } from "./fields";

type FieldDef = {
  label: string;
  type: "textarea" | "select";
  options?: { value: string; label: string }[];
};

const CONTENT_FIELDS: Record<string, FieldDef> = {
  "hero.mode": {
    label: "Hero mode",
    type: "select",
    options: [
      { value: "default", label: "Default — kinetic text hero (pre-event)" },
      { value: "post_event", label: "Post-event — results / thank-you banner" },
      { value: "hidden", label: "Hidden — no hero section" },
    ],
  },
  "hero.eyebrow": { label: "Hero eyebrow", type: "textarea" },
  "hero.title": { label: "Hero title", type: "textarea" },
  "hero.tagline": { label: "Hero tagline", type: "textarea" },
  "hero.results_eyebrow": { label: "Results banner — eyebrow", type: "textarea" },
  "hero.results_title": { label: "Results banner — title", type: "textarea" },
  "hero.results_body": { label: "Results banner — body text", type: "textarea" },
  "hero.results_cta_label": { label: "Results banner — button label", type: "textarea" },
  "hero.results_cta_href": { label: "Results banner — button URL", type: "textarea" },
  "event.oneliner": { label: "Event one-liner", type: "textarea" },
  "foundation.quote": { label: "Foundation quote", type: "textarea" },
  "impact.commitment": { label: "Commitment statement", type: "textarea" },
};

function ContentRow({ contentKey, value }: { contentKey: string; value: string }) {
  const field = CONTENT_FIELDS[contentKey] ?? { label: contentKey, type: "textarea" as const };
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveContent, null);

  return (
    <form action={formAction} className="rounded-xl border border-white/10 bg-ink-soft p-5">
      <input type="hidden" name="key" value={contentKey} />
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-widest text-sand">
          {field.label}
        </label>
        <code className="text-[0.65rem] text-sand/50">{contentKey}</code>
      </div>

      {field.type === "select" ? (
        <select
          name="value"
          defaultValue={value}
          className="w-full rounded-lg border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-cream focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember"
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <textarea
          name="value"
          defaultValue={value}
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-cream focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember"
        />
      )}

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

const HERO_MODE_KEYS = [
  "hero.mode",
  "hero.eyebrow",
  "hero.title",
  "hero.tagline",
  "hero.results_eyebrow",
  "hero.results_title",
  "hero.results_body",
  "hero.results_cta_label",
  "hero.results_cta_href",
];

const OTHER_KEYS = ["event.oneliner", "foundation.quote", "impact.commitment"];

export function ContentEditor({ values }: { values: Record<string, string> }) {
  const heroKeys = HERO_MODE_KEYS.filter((k) => k in values);
  const otherKeys = OTHER_KEYS.filter((k) => k in values);
  const remainingKeys = Object.keys(values).filter(
    (k) => !HERO_MODE_KEYS.includes(k) && !OTHER_KEYS.includes(k),
  );

  return (
    <div className="max-w-3xl space-y-8">
      {/* Hero section */}
      <div>
        <div className="mb-4 rounded-xl border border-ember/30 bg-ember/5 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">
            Homepage Hero
          </p>
          <p className="mt-0.5 text-xs text-sand">
            Use <strong className="text-cream">Hero mode</strong> to switch between the pre-event
            kinetic hero, a post-event results banner, or no hero. Edit the banner copy below before
            switching.
          </p>
        </div>
        <div className="grid gap-4">
          {heroKeys.map((k) => (
            <ContentRow key={k} contentKey={k} value={values[k] ?? ""} />
          ))}
        </div>
      </div>

      {/* Other editable copy */}
      {(otherKeys.length > 0 || remainingKeys.length > 0) && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-sand">
            Other copy
          </p>
          <div className="grid gap-4">
            {[...otherKeys, ...remainingKeys].map((k) => (
              <ContentRow key={k} contentKey={k} value={values[k] ?? ""} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
