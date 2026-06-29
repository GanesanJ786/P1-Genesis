import Link from "next/link";
import { Plus } from "lucide-react";

/** Page header for admin screens with an optional primary action. */
export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <h1 className="font-display text-3xl uppercase text-cream">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-sand">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ember-bright"
        >
          <Plus size={16} /> {action.label}
        </Link>
      ) : null}
    </div>
  );
}
