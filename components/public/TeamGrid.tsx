import Image from "next/image";
import { User } from "lucide-react";
import type { TeamMember } from "@/lib/seed-data";
import { mediaUrl } from "@/lib/storage";
import { Reveal } from "./Reveal";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m, i) => {
        const img = mediaUrl(m.photo_path);
        return (
          <Reveal key={m.id} delay={(i % 3) * 0.08}>
            <div className="group overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                {img ? (
                  <Image
                    src={img}
                    alt={m.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-soft to-black">
                    <User size={64} className="text-sand/30" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-widest text-ember">
                  {m.role_title}
                </p>
                <h3 className="mt-1 font-display text-xl uppercase text-cream">
                  {m.name}
                </h3>
                {m.bio ? (
                  <p className="mt-2 text-sm text-sand">{m.bio}</p>
                ) : null}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
