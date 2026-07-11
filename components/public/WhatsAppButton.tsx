import { WhatsappIcon } from "./SocialIcons";
import { whatsappUrl } from "@/lib/constants";

/**
 * Site-wide floating WhatsApp click-to-chat — the fastest inbound channel for
 * parents/athletes. Fixed bottom-right, below the navbar (z-50) and the
 * registration modal (z-100). Renders as a plain anchor (no client JS). The
 * number + default message live in lib/constants (WHATSAPP).
 */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Genesis Sports Foundation on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-3 text-white shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:pr-5"
    >
      <WhatsappIcon size={26} />
      <span className="hidden text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  );
}
