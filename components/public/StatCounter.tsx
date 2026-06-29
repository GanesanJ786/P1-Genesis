"use client";

import CountUp from "react-countup";
import { Reveal } from "./Reveal";

/** Parses "3,000+" -> { num: 3000, prefix:"", suffix:"+" } for CountUp. */
function parse(value: string) {
  const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!match) return { num: null as number | null, raw: value };
  const num = Number(match[2].replace(/,/g, ""));
  return { num, prefix: match[1], suffix: match[3] };
}

export function StatCounter({
  value,
  label,
  delay = 0,
}: {
  value: string;
  label: string;
  delay?: number;
}) {
  const parsed = parse(value);

  return (
    <Reveal delay={delay} className="border-t-2 border-ember pt-4">
      <div className="font-display text-4xl text-cream sm:text-5xl">
        {parsed.num !== null ? (
          <CountUp
            end={parsed.num}
            duration={2}
            separator=","
            prefix={parsed.prefix}
            suffix={parsed.suffix}
            enableScrollSpy
            scrollSpyOnce
          />
        ) : (
          value
        )}
      </div>
      <div className="mt-2 text-xs uppercase tracking-widest text-sand">
        {label}
      </div>
    </Reveal>
  );
}
