import type { MediaItem } from "@/lib/seed-data";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { InstagramCard } from "./InstagramCard";

/**
 * Responsive grid of external media (YouTube videos + Instagram link cards).
 * No Supabase image storage is used — everything is sourced from external URLs.
 */
export function MediaGallery({
  media,
  className,
}: {
  media: MediaItem[];
  className?: string;
}) {
  if (!media?.length) return null;

  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${className ?? ""}`}
    >
      {media.map((m, i) =>
        m.type === "youtube" ? (
          <YouTubeEmbed key={`${m.url}-${i}`} url={m.url} title={m.caption ?? "Video"} />
        ) : (
          <InstagramCard key={`${m.url}-${i}`} url={m.url} caption={m.caption} />
        ),
      )}
    </div>
  );
}
