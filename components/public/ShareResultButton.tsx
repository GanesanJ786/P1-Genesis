"use client";

import { Share2 } from "lucide-react";
import { buildShareText, type LiveRow } from "@/lib/live";

/**
 * Lets a participant/parent share a podium straight from the results card —
 * native share sheet where available (mobile), WhatsApp web link otherwise.
 */
export function ShareResultButton({ result }: { result: LiveRow }) {
  const share = async () => {
    const text = buildShareText(result, window.location.href);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User dismissed the sheet — nothing to do.
        return;
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this result"
      className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-sand transition-colors hover:bg-white/10 hover:text-cream"
    >
      <Share2 size={12} /> Share
    </button>
  );
}
