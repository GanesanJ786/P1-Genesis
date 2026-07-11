import { ArrowRight } from "lucide-react";
import { SPONSOR_TIERS, SUPPORTER_TIERS, SITE } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

export function SponsorTiers() {
  return (
    <div className="space-y-12">
      <div className="grid gap-5">
        {SPONSOR_TIERS.map((tier, i) => (
          <Reveal key={tier.key} delay={i * 0.05}>
            <div
              className={cn(
                "grid grid-cols-1 gap-4 rounded-2xl border p-6 sm:grid-cols-[1fr_1.6fr] sm:items-center sm:gap-8",
                tier.flagship
                  ? "border-ember bg-ember/5"
                  : "border-sand/15 bg-ink-soft",
              )}
            >
              <div>
                <p className="eyebrow mb-1">{tier.rank}</p>
                <h3 className="font-display text-2xl uppercase text-cream sm:text-3xl">
                  {tier.name}
                </h3>
              </div>
              <div>
                <p className="text-sm text-sand">{tier.blurb}</p>
                <ButtonLink
                  href={`/contact?intent=sponsor&tier=${tier.key}`}
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0"
                >
                  Enquire about this tier <ArrowRight size={14} />
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div>
        <h3 className="eyebrow mb-4">For Individuals & Smaller Businesses</h3>
        <div className="flex flex-wrap gap-3">
          {SUPPORTER_TIERS.map((t) => (
            <span
              key={t.name}
              className="rounded-full border border-sand/15 bg-ink-soft px-5 py-2.5 text-sm text-cream"
            >
              {t.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <ButtonLink href="/contact?intent=sponsor" size="lg">
          Discuss a Partnership
        </ButtonLink>
        <ButtonLink
          href={SITE.prospectusPath}
          external
          target="_blank"
          variant="outline"
          size="lg"
        >
          Download Prospectus
        </ButtonLink>
      </div>
    </div>
  );
}
