"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitContact, type ContactResult } from "@/lib/actions/contact";
import { Button } from "@/components/ui/Button";
import { ENQUIRY_TYPES } from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-sand/20 bg-ink px-4 py-3 text-cream placeholder:text-sand/50 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember";

export function ContactForm({
  defaultEnquiry,
  defaultMessage,
}: {
  defaultEnquiry?: string;
  defaultMessage?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ContactResult | null,
    FormData
  >(submitContact, null);

  const initialEnquiry =
    ENQUIRY_TYPES.find((t) => t.value === defaultEnquiry)?.value ??
    ENQUIRY_TYPES[0].value;

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-ember/30 bg-ember/5 p-10 text-center">
        <CheckCircle2 className="text-ember" size={40} />
        <h3 className="font-display text-2xl uppercase text-cream">
          Message Received
        </h3>
        <p className="text-sm text-sand">
          Thank you for reaching out. The Genesis team will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="enquiryType" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
          I&apos;m reaching out about
        </label>
        <select
          id="enquiryType"
          name="enquiryType"
          defaultValue={initialEnquiry}
          className={inputClass}
        >
          {ENQUIRY_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="bg-ink text-cream">
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
            Name
          </label>
          <input id="name" name="name" required className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
          Phone <span className="text-sand/50">(optional)</span>
        </label>
        <input id="phone" name="phone" className={inputClass} placeholder="+91 ..." />
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs uppercase tracking-widest text-sand">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          defaultValue={defaultMessage}
          className={inputClass}
          placeholder="Tell us how you'd like to be involved with Genesis Sports Foundation..."
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-ember-bright">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
