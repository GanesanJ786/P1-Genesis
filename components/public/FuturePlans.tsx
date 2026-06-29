import { FUTURE_PLANS } from "@/lib/seed-data";

/**
 * "Future Plans / Vision" — forward-looking roadmap, rendered as a numbered
 * progression. Copy lives in lib/seed-data (FUTURE_PLANS).
 */
export function FuturePlans() {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-sand/15 bg-sand/15 sm:grid-cols-2">
      {FUTURE_PLANS.map((plan, i) => (
        <div key={plan.title} className="bg-ink p-6 sm:p-8">
          <span className="font-display text-3xl text-ember/70">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 font-display text-xl uppercase text-cream">
            {plan.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-sand">
            {plan.detail}
          </p>
        </div>
      ))}
    </div>
  );
}
