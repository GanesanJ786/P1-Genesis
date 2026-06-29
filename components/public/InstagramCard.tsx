import { Camera, ArrowUpRight } from "lucide-react";

/**
 * Instagram link card — a reliable, zero-JS alternative to embedding posts/reels
 * (which now require a Facebook app token). Opens the post/reel on Instagram in
 * a new tab. No images are stored or proxied.
 */
export function InstagramCard({
  url,
  caption,
}: {
  url: string;
  caption?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex aspect-video w-full flex-col justify-between overflow-hidden rounded-xl border border-sand/15 bg-gradient-to-br from-ember/15 via-ink-soft to-ink p-5 transition-colors hover:border-ember/50"
    >
      <div className="flex items-center justify-between">
        <Camera className="text-ember" size={26} />
        <ArrowUpRight
          size={18}
          className="text-sand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-cream">
          {caption || "View on Instagram"}
        </p>
        <p className="mt-1 text-xs uppercase tracking-widest text-sand">
          Instagram
        </p>
      </div>
    </a>
  );
}
