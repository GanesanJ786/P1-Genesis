import {
  HeartHandshake,
  MapPin,
  Plane,
  Trophy,
  GraduationCap,
  Flag,
} from "lucide-react";
import { ACADEMY_LOCATIONS } from "@/lib/seed-data";

/**
 * "Ongoing Initiatives" — the foundation's active programmes. Content is drawn
 * from the foundation's real work (free coaching, academies, athlete support,
 * competitive pathway, education, and the Track Fest platform).
 */
const INITIATIVES = [
  {
    icon: HeartHandshake,
    title: "Free & Subsidised Coaching",
    detail:
      "Professional athletics coaching for deserving and underprivileged government-school students — talent, not income, decides who trains.",
  },
  {
    icon: MapPin,
    title: "Five Academy Locations",
    detail: `Daily training across ${ACADEMY_LOCATIONS.length} centres in and around Coimbatore — ${ACADEMY_LOCATIONS.join(", ")}.`,
  },
  {
    icon: Plane,
    title: "Athlete Support",
    detail:
      "Spikes, gear, travel, food and accommodation for State & National meets — plus international exposure camps, including elite training in Kenya.",
  },
  {
    icon: Trophy,
    title: "Competitive Pathway",
    detail:
      "A structured route from district to national level — four straight Tamil Nadu overall titles and a Youth Asian Championship medalist.",
  },
  {
    icon: GraduationCap,
    title: "Education Through Sport",
    detail:
      "Sports-quota admissions into reputed institutions like Loyola College and PSG Arts — and 20+ athletes placed in government jobs each year.",
  },
  {
    icon: Flag,
    title: "Genesis Track Fest",
    detail:
      "Our own championship platform that gives school, club and academy athletes a professional stage to compete and be discovered.",
  },
];

export function Initiatives() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {INITIATIVES.map((it) => (
        <div
          key={it.title}
          className="flex h-full flex-col rounded-2xl border border-sand/15 bg-ink-soft p-6 transition-colors hover:border-ember/40"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember/15 text-ember">
            <it.icon size={22} />
          </span>
          <h3 className="mt-4 font-display text-lg uppercase text-cream">
            {it.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-sand">{it.detail}</p>
        </div>
      ))}
    </div>
  );
}
