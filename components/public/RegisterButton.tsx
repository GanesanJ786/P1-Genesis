"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Ticket360 event pages include their own site header (logo/search/menu)
// that isn't relevant inside our modal. We can't reach into their DOM
// (cross-origin), so instead we shift their page up and clip the header out
// of view. This offset is tuned to Ticket360's header height, which measured
// identically (~82px) at every width from 320px up to 1280px, so it's safe
// as one constant for any ticket360.co.in URL/screen size.
const TICKET360_HEADER_CROP_PX = 92;

// Ticket360's own marketing footer (branding/quick links/socials) sits below
// the registration form. Unlike the header, its position depends on how much
// content THAT SPECIFIC event page renders, which reflows (and therefore
// changes height) with the iframe's width — so a single pixel cutoff only
// holds at one screen size. Our modal itself never renders wider than 672px
// (capped by `max-w-2xl`), so we only ever need widths in the 320-672px
// range; below is a table measured every 16px across exactly that range
// (each value floored with a 1px safety margin so a cutoff is never larger
// than the true footer offset at that width — i.e. we may leave a sliver of
// extra Ticket360 whitespace before the true footer, but never reveal the
// footer itself). At runtime we measure the iframe wrapper's actual width
// and pick the smallest table width >= it (the "ceiling" bucket), which
// trends toward smaller footer offsets as width grows, keeping the lookup
// conservative for any width that falls between two sampled points.
// Re-measure (open the URL at each width, find <footer>'s offsetTop) if the
// event's own content changes materially, or add a table for a new event.
const TICKET360_FOOTER_CUTOFF_TABLE: [width: number, cutoffPx: number][] = [
  [320, 4881], [336, 4750], [352, 4576], [368, 4556], [384, 4557],
  [400, 4414], [416, 4367], [432, 4285], [448, 4286], [464, 4264],
  [480, 4264], [496, 4240], [512, 4241], [528, 4106], [544, 4082],
  [560, 4083], [576, 4083], [592, 4153], [608, 4153], [624, 4154],
  [640, 4154], [656, 4155], [672, 4155],
];

const TICKET360_FOOTER_CUTOFF_PX: Record<string, [number, number][]> = {
  "https://ticket360.co.in/event-details?event=ODUwfF58": TICKET360_FOOTER_CUTOFF_TABLE,
};

function lookupFooterCutoff(table: [number, number][], widthPx: number): number {
  for (const [w, cutoff] of table) {
    if (widthPx <= w) return cutoff;
  }
  return table[table.length - 1][1];
}

function getTicket360Crop(
  url: string,
): { headerCropPx: number; footerCutoffTable: [number, number][] | null } | null {
  try {
    const host = new URL(url).hostname;
    if (host === "ticket360.co.in" || host.endsWith(".ticket360.co.in")) {
      return {
        headerCropPx: TICKET360_HEADER_CROP_PX,
        footerCutoffTable: TICKET360_FOOTER_CUTOFF_PX[url] ?? null,
      };
    }
  } catch {
    // Malformed URL — no crop, let the iframe/browser handle the error.
  }
  return null;
}

/**
 * Register CTA that opens the event's external registration form (Google
 * Form) in an in-site modal instead of navigating away, so visitors don't
 * leave gsfcbe.com.
 */
export function RegisterButton({
  url,
  size = "md",
  label = "Register",
}: {
  url: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  // The footer-cutoff trick disables the iframe's own scrolling and relies on
  // the browser "chaining" the scroll gesture up to our wrapper instead.
  // That chaining is reliable for desktop mouse-wheel input, but touchscreens
  // don't reliably chain a touch-scroll gesture across a cross-origin iframe
  // boundary the same way — on a real phone this left the modal frozen
  // (nothing scrolled at all). So the cutoff only applies for non-touch
  // (mouse/trackpad) input; touch devices get the plain, fully-scrollable
  // iframe instead (footer becomes reachable again if scrolled all the way
  // down, but the form itself is actually usable).
  const [isCoarsePointer, setIsCoarsePointer] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const crop = getTicket360Crop(url);
  const headerCrop = crop?.headerCropPx ?? 0;
  const footerCutoff =
    crop?.footerCutoffTable && containerWidth && !isCoarsePointer
      ? lookupFooterCutoff(crop.footerCutoffTable, containerWidth)
      : null;

  useEffect(() => {
    if (!open) return;
    setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !crop?.footerCutoffTable) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button type="button" size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            >
              <div
                className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-sand/15 px-5 py-3">
                  <p className="font-display text-sm uppercase tracking-wide text-cream">
                    Register
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="text-sand hover:text-ember"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div
                  ref={containerRef}
                  className={cn(
                    "relative flex-1 bg-white",
                    footerCutoff
                      ? "overflow-y-auto overflow-x-hidden"
                      : "overflow-hidden",
                  )}
                >
                  <iframe
                    src={url}
                    title="Event registration form"
                    scrolling={footerCutoff ? "no" : undefined}
                    className="absolute inset-x-0 w-full border-0"
                    style={{
                      top: -headerCrop,
                      height: footerCutoff
                        ? footerCutoff
                        : `calc(100% + ${headerCrop}px)`,
                    }}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
