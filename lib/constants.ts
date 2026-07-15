/** Static brand + site configuration. Editable copy lives in site_content (DB). */

export const SITE = {
  // Primary identity = the Foundation. Genesis Track Fest is one event it runs
  // (see about-event / live / sponsorship), not the site's headline brand.
  name: "Genesis Sports Foundation",
  shortName: "Genesis Sports Foundation",
  headline: "Athletics Coaching in Coimbatore",
  tagline: "Run · Jump · Throw · Grow",
  description:
    "Genesis Sports Foundation — accessible athletics coaching in Coimbatore, turning grassroots talent into national & international medal winners.",
  url: "https://gsfteams.com",
  organiser: "Genesis Sports Foundation",
  venue: "Nehru Stadium, Coimbatore",
  dates: "31 July & 1 Aug 2026",
} as const;

export const CONTACT = {
  emails: ["genesissportsfoundation@gmail.com", "gsfcbe15@gmail.com"],
  phones: ["93630 69793", "90428 89888", "93443 53468"],
  address:
    "D/No. 996–997, 3rd Floor, Gnanalakshmi Complex, Mettupalayam Road, RS Puram, Coimbatore – 2.",
} as const;

/**
 * Social + messaging channels. Single source of truth for the footer/menu links
 * AND the JSON-LD `sameAs` (only non-empty profile URLs are emitted — see
 * app/layout.tsx). Fill in `facebook` once the page is live and it appears
 * everywhere automatically; add more platforms as new keys.
 */
export const SOCIAL = {
  instagram: "https://www.instagram.com/gsfteams/",
  youtube: "https://www.youtube.com/channel/UCE290WpWD_QQIciL74Bk0vw",
  facebook: "", // TODO: add the Facebook page URL when it goes live
} as const;

/**
 * WhatsApp click-to-chat — the primary inbound channel for parents. `number` is
 * E.164 without the leading "+"; `message` is the default prefilled text.
 * Defaults to the foundation's first contact line (93630 69793) — swap here if a
 * dedicated WhatsApp Business line is set up.
 */
export const WHATSAPP = {
  number: "919363069793",
  message:
    "Hi Genesis Sports Foundation, I'd like to know more about joining the athletics academy.",
} as const;

/** Build a wa.me click-to-chat URL, optionally overriding the default message. */
export function whatsappUrl(message: string = WHATSAPP.message): string {
  return `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(message)}`;
}

/**
 * Enquiry categories for the contact form. The first is the default; the value
 * is carried into the notification email subject and prepended to the stored
 * message so the team can triage (join vs. sponsor vs. media) without a schema
 * change. Keys also match the `?intent=` param used to deep-link the form.
 */
export const ENQUIRY_TYPES = [
  { value: "join", label: "Joining the academy" },
  { value: "sponsor", label: "Sponsorship / partnership" },
  { value: "schools", label: "Schools / bulk registration" },
  { value: "media", label: "Media / press" },
  { value: "volunteer", label: "Volunteering" },
  { value: "other", label: "Something else" },
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number]["value"];

/**
 * Hero kinetic verbs ("Run · Jump · Throw · Grow"). `accent: true` renders in
 * the ember accent colour; all other styling is CSS-driven (see globals.css).
 * Edit/reorder freely — the hero re-renders responsively with no image assets.
 */
export const HERO_VERBS = [
  { word: "Run", accent: false },
  { word: "Jump", accent: false },
  { word: "Throw", accent: true },
  { word: "Grow", accent: false },
] as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Foundation", href: "/foundation" },
  { label: "Events", href: "/events" },
  { label: "Live", href: "/live" },
  { label: "Blog", href: "/blog" },
  { label: "Team", href: "/team" },
  { label: "Sponsorship", href: "/sponsorship" },
  { label: "Contact", href: "/contact" },
] as const;

export type SponsorTierKey =
  | "title"
  | "platinum"
  | "gold"
  | "silver"
  | "supporter";

/** Headline sponsorship tiers — drives the /sponsorship pricing table. */
export const SPONSOR_TIERS = [
  {
    key: "title" as const,
    rank: "Tier 01 · Flagship",
    name: "Title Sponsor",
    amount: 500000,
    blurb:
      "The event carries your name. Maximum visibility across every touchpoint of Genesis Track Fest 2026.",
    flagship: true,
  },
  {
    key: "platinum" as const,
    rank: "Tier 02",
    name: "Platinum Sponsor",
    amount: 300000,
    blurb:
      "Premium branding presence across stadium signage, ceremonies, and digital coverage.",
    flagship: false,
  },
  {
    key: "gold" as const,
    rank: "Tier 03",
    name: "Gold Sponsor",
    amount: 200000,
    blurb:
      "Strong on-ground and digital visibility, suited to regional and growing brands.",
    flagship: false,
  },
  {
    key: "silver" as const,
    rank: "Tier 04",
    name: "Silver Sponsor",
    amount: 100000,
    blurb: "An accessible entry point into the Genesis Track Fest partner family.",
    flagship: false,
  },
] as const;

export const SUPPORTER_TIERS = [
  { name: "Gold Supporter", amount: "₹50,000 and above" },
  { name: "Silver Supporter", amount: "₹25,000 and above" },
  { name: "Bronze Supporter", amount: "₹15,000 and above" },
] as const;

/** The 11 branding/visibility touchpoints offered to partners. */
export const BRANDING_TOUCHPOINTS = [
  "Main Stage Backdrop",
  "Entry Arch",
  "Track-side Banners",
  "Medal Ceremony Backdrop",
  "Event Certificates",
  "Event T-Shirts",
  "Social Media Posters",
  "Reels & Videos",
  "Announcement Mentions",
  "Stall / Display Booth",
  "Press Note",
] as const;

/** Audiences a sponsor reaches across the two days. */
export const SPONSOR_AUDIENCES = [
  "Young Athletes",
  "Parents",
  "Schools",
  "Coaches",
  "Fitness Community",
  "Sports Lovers",
  "Local Coimbatore Audience",
  "Media & Community Network",
] as const;

export const STORAGE_BUCKET = "public-media";
