import { QrCode, Download } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/constants";

/**
 * Registration call-to-action. Drop a real QR at /public/brand/registration-qr.png
 * (e.g. linking to the registration form) and it renders automatically.
 */
export function RegistrationQR() {
  return (
    <div className="rounded-2xl border border-sand/15 bg-ink-soft p-8 text-center">
      <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl bg-cream">
        {/* Replace with <Image src="/brand/registration-qr.png" .../> once available */}
        <QrCode size={120} className="text-ink" strokeWidth={1.2} />
      </div>
      <h3 className="mt-5 font-display text-xl uppercase text-cream">
        Register to Compete
      </h3>
      <p className="mt-1 text-sm text-sand">
        Entry ₹300 · Free for government & corporation school teams
      </p>
      <div className="mt-5 flex flex-col items-center gap-3">
        <ButtonLink href="/contact" size="sm">
          Register Now
        </ButtonLink>
        <ButtonLink
          href={SITE.prospectusPath}
          external
          variant="ghost"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={15} /> Download Prospectus
        </ButtonLink>
      </div>
    </div>
  );
}
