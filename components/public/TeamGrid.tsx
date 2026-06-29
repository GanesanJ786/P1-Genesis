import Image from "next/image";
import { User } from "lucide-react";
import type { TeamMember } from "@/lib/seed-data";
import { mediaUrl } from "@/lib/storage";
import { Reveal } from "./Reveal";

/**
 * Leadership grid. Uses a centered flex-wrap so a partial final row stays
 * balanced (no left-aligned orphans), with equal-height cards and a uniform
 * 4:5 portrait frame for consistent alignment across all screen sizes.
 */
export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {members.map((m, i) => {
        const img = mediaUrl(m.photo_path);
        return (
          <Reveal
            key={m.id}
            delay={(i % 3) * 0.08}
            className="flex w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <div className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft transition-colors hover:border-ember/40">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                {img ? (
                  <Image
                    src={img}
                    alt={m.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-soft to-black">
                    <User size={64} className="text-sand/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs uppercase tracking-widest text-ember">
                  {m.role_title}
                </p>
                <h3 className="mt-1 font-display text-xl uppercase leading-tight text-cream">
                  {m.name}
                </h3>
                {m.bio ? (
                  <p className="mt-2 text-sm leading-relaxed text-sand">{m.bio}</p>
                ) : null}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
