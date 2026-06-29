"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-cream placeholder:text-sand/50 focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember";

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
      {children}
    </label>
  );
}

export function TextField({
  label,
  name,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input id={name} name={name} className={base} {...props} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <textarea id={name} name={name} className={cn(base, "min-h-[110px]")} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className={base}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-cream">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/30 bg-ink accent-ember"
      />
      {label}
    </label>
  );
}

export function SubmitButton({ children = "Save" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ember-bright disabled:opacity-50"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
