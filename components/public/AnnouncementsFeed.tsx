"use client";

import { useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { ANNOUNCEMENT_TYPES, relativeTime, type AnnouncementRow } from "@/lib/live";

const VISIBLE_DEFAULT = 3;

/**
 * Organiser announcements (delays, lunch break, venue changes, safety notes).
 * Pinned messages stay on top; the rest show newest-first with an expander.
 */
export function AnnouncementsFeed({ announcements }: { announcements: AnnouncementRow[] }) {
  const [expanded, setExpanded] = useState(false);

  if (announcements.length === 0) return null;

  const sorted = [...announcements].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = sorted.length - VISIBLE_DEFAULT;

  return (
    <section aria-label="Announcements" className="space-y-2">
      <p className="eyebrow flex items-center gap-2">
        <Megaphone size={14} /> Announcements
      </p>
      {visible.map((a) => {
        const type = ANNOUNCEMENT_TYPES[a.type] ?? ANNOUNCEMENT_TYPES.info;
        return (
          <div
            key={a.id}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
              a.is_pinned
                ? "border-ember/30 bg-ember/5"
                : "border-sand/10 bg-ink-soft"
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${type.style}`}
            >
              {type.label}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-cream">{a.message}</p>
            <span
              className="flex shrink-0 items-center gap-1.5 text-[0.65rem] text-sand/60"
              suppressHydrationWarning
            >
              {a.is_pinned ? <Pin size={11} className="text-ember" /> : null}
              {relativeTime(a.created_at)}
            </span>
          </div>
        );
      })}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-ember hover:text-ember-bright"
        >
          {expanded ? "Show fewer" : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </section>
  );
}
