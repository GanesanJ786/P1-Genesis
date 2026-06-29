"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { getYouTubeId } from "@/lib/events";

/**
 * Lightweight, responsive YouTube player. Renders only the poster image until
 * the user clicks — the actual iframe (and YouTube's JS) loads on demand. This
 * keeps pages fast and avoids any image storage (poster is served by YouTube).
 */
export function YouTubeEmbed({
  url,
  title = "Video",
}: {
  url: string;
  title?: string;
}) {
  const [active, setActive] = useState(false);
  const id = getYouTubeId(url);
  if (!id) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-sand/15 bg-ink-soft">
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-ink/30 transition-colors group-hover:bg-ink/15" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ember text-white shadow-lg shadow-ember/40 transition-transform group-hover:scale-110">
            <Play size={26} className="ml-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
