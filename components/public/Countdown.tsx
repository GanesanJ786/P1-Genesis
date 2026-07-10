"use client";

import { useEffect, useState } from "react";

/**
 * "Starts in 1h 23m" ticker for an upcoming schedule item.
 * Self-contained interval so the ticking never re-renders the whole board;
 * renders nothing until mounted to avoid a server/client hydration mismatch.
 */
export function Countdown({ iso, className }: { iso: string; className?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const target = new Date(iso).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => {
      const diff = Math.floor((target - Date.now()) / 1000);
      if (diff <= 0) {
        setLabel("Starting soon");
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      if (h > 0) setLabel(`Starts in ${h}h ${m}m`);
      else if (m > 0) setLabel(`Starts in ${m}m`);
      else setLabel("Starting now");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);

  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-ember ${className ?? ""}`}
    >
      <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
      {label}
    </span>
  );
}
