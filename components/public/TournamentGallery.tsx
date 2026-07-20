import { Camera } from "lucide-react";
import { liveItemMedia, type LiveRow } from "@/lib/live";
import { MediaGallery } from "@/components/public/MediaGallery";

/**
 * Every race's attached media (YouTube/Instagram links, set per-race in the
 * admin Live Hub — no image hosting, same free-tier-safe pattern as event
 * media) aggregated into one browsable wall. Deduped by URL since the same
 * highlight clip is sometimes attached to more than one round.
 */
export function TournamentGallery({ items }: { items: LiveRow[] }) {
  const seen = new Set<string>();
  const media = items.flatMap(liveItemMedia).filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  if (media.length === 0) {
    return (
      <div className="rounded-2xl border border-sand/10 bg-ink-soft px-6 py-16 text-center">
        <Camera size={28} className="mx-auto mb-3 text-sand/40" />
        <p className="text-sand">Photos &amp; videos will appear here as they&rsquo;re added.</p>
        <p className="mt-1 text-sm text-sand/60">
          Check back throughout the day for highlight clips and shots.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-4">
        📸 Tournament Gallery <span className="text-sand/50">· {media.length}</span>
      </p>
      <MediaGallery media={media} />
    </div>
  );
}
