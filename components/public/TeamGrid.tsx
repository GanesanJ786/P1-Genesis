import Image from "next/image";
import { User } from "lucide-react";
import type { TeamMember } from "@/lib/seed-data";
import { mediaUrl } from "@/lib/storage";
import { Reveal } from "./Reveal";

/** One person's card — portrait photo (or fallback icon), role, name, bio.
 *  Shared by both the Leadership and Coaches sections so they read as one
 *  visual family, not two differently-styled lists. */
function TeamMemberCard({ member, delay }: { member: TeamMember; delay: number }) {
  const img = mediaUrl(member.photo_path);
  return (
    <Reveal
      delay={delay}
      className="flex w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
    >
      <div className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft transition-colors hover:border-ember/40">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink">
          {img ? (
            <Image
              src={img}
              alt={member.name}
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
          <h3 className="font-display text-xl uppercase leading-tight text-cream">
            {member.name}
          </h3>
          {member.role_title ? (
            <p className="mt-1 text-xs uppercase tracking-widest text-ember">
              {member.role_title}
            </p>
          ) : null}
          {member.bio ? (
            <p className="mt-2 text-sm leading-relaxed text-sand">{member.bio}</p>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}

/** Centered flex-wrap grid so a partial final row stays balanced (no
 *  left-aligned orphans), equal-height cards, uniform 4:5 portrait frame. */
function TeamSection({ label, members }: { label: string; members: TeamMember[] }) {
  if (members.length === 0) return null;
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span aria-hidden className="h-4 w-1 rounded-full bg-ember/70" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand/70">
          {label}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {members.map((m, i) => (
          <TeamMemberCard key={m.id} member={m} delay={(i % 3) * 0.08} />
        ))}
      </div>
    </div>
  );
}

/**
 * Leadership + Coaches, grouped into two labelled sections from one flat
 * list (member_type distinguishes them) — an event/site with only leadership
 * (or only coaches) on file just shows the one section that has members.
 */
export function TeamGrid({ members }: { members: TeamMember[] }) {
  const leadership = members.filter((m) => m.member_type !== "coach");
  const coaches = members.filter((m) => m.member_type === "coach");

  return (
    <div className="space-y-16">
      <TeamSection label="Leadership" members={leadership} />
      <TeamSection label="Our Coaches" members={coaches} />
    </div>
  );
}
