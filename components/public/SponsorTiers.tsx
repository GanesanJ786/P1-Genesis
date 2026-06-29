import { SPONSOR_TIERS, SUPPORTER_TIERS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
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
                "grid grid-cols-1 gap-4 rounded-2xl border p-6 sm:grid-cols-[1.1fr_0.9fr_1.4fr] sm:items-center sm:gap-8",
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
                <p className="font-display text-3xl text-ember sm:text-4xl">
                  {formatINR(tier.amount)}
                </p>
                <p className="text-xs uppercase tracking-widest text-sand">
                  Investment
                </p>
              </div>
              <p className="text-sm text-sand">{tier.blurb}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div>
        <h3 className="eyebrow mb-4">For Individuals & Smaller Businesses</h3>
        <div className="overflow-hidden rounded-2xl border border-sand/15">
          <table className="w-full text-left">
            <thead className="bg-ink-soft text-xs uppercase tracking-widest text-sand">
              <tr>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Investment</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORTER_TIERS.map((t) => (
                <tr key={t.name} className="border-t border-sand/10">
                  <td className="px-6 py-4 text-cream">{t.name}</td>
                  <td className="px-6 py-4 font-semibold text-ember">
                    {t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ButtonLink href="/contact" size="lg">
        Discuss a Partnership
      </ButtonLink>
    </div>
  );
}
