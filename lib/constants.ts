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
  url: "https://gsfcbe.com",
  organiser: "Genesis Sports Foundation",
  venue: "Nehru Stadium, Coimbatore",
  dates: "31 July & 1 Aug 2026",
  prospectusPath: "/genesis-trackfest-2026-prospectus.pdf",
} as const;

export const CONTACT = {
  emails: ["genesissportsfoundation@gmail.com", "gsfcbe15@gmail.com"],
  phones: ["93630 69793", "90428 89888", "93443 53468"],
  address:
    "D/No. 996–997, 3rd Floor, Gnanalakshmi Complex, Mettupalayam Road, RS Puram, Coimbatore – 2.",
} as const;

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
