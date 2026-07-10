"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setLiveItemStatus } from "@/lib/actions/admin";
import type { LiveStatus } from "@/types/database.types";

const OPTIONS: { value: LiveStatus; label: string; activeStyle: string }[] = [
  { value: "upcoming", label: "Upcoming", activeStyle: "bg-white/15 text-cream" },
  { value: "in_progress", label: "LIVE", activeStyle: "bg-amber-500/25 text-amber-400" },
  { value: "paused", label: "Paused", activeStyle: "bg-sky-500/25 text-sky-400" },
  { value: "completed", label: "Done", activeStyle: "bg-green-500/20 text-green-400" },
];

/**
 * One-tap status pills for a schedule item — the primary in-stadium control
 * (announcer flips a race to LIVE seconds before the gun).
 */
export function LiveStatusButtons({
  id,
  current,
}: {
  id: string;
  current: LiveStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={pending || active}
            onClick={() =>
              startTransition(async () => {
                await setLiveItemStatus(id, o.value);
              })
            }
            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition-colors disabled:cursor-default ${
              active
                ? o.activeStyle
                : "bg-ink text-sand/60 hover:text-cream disabled:opacity-40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
      {pending ? <Loader2 size={13} className="animate-spin text-sand" /> : null}
    </div>
  );
}
