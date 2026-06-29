"use client";

import { useFormStatus } from "react-dom";
import { Trash2, Loader2 } from "lucide-react";

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand transition-colors hover:border-ember/50 hover:text-ember-bright disabled:opacity-50"
      onClick={(e) => {
        if (!confirm("Delete this item? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  );
}

/** Wrap a bound server action (no args expected) in a confirm-guarded form. */
export function DeleteButton({
  action,
  label = "Delete",
}: {
  action: () => void | Promise<void>;
  label?: string;
}) {
  return (
    <form action={action}>
      <Inner label={label} />
    </form>
  );
}
