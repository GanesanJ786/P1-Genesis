/**
 * Seed content extracted from the official sponsorship prospectus.
 * The public site renders from this when Supabase is not configured, and the
 * same shapes mirror the DB rows so queries can swap to live data seamlessly.
 */

export type Stat = { value: string; label: string };
/** External media reference (no images stored in Supabase). */
export type MediaItem = {
  type: "youtube" | "instagram";
  url: string;
  caption?: string;
};
export type EventItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
  registration_url: string | null;
  media: MediaItem[];
  /** Shown in the public Live Hub (/live) with realtime tracking. */
  live_tracking: boolean;
  /** Whether the /live/[slug] "Schedule" timetable section is shown. */
  show_schedule: boolean;
};
export type Slide = {
  id: string;
  group_key: string;
  title: string | null;
  subtitle: string | null;
  image_path: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};
export type TeamMember = {
  id: string;
  name: string;
  role_title: string;
  bio: string | null;
  photo_path: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Expected-reach metrics ("By the numbers"). */
export const REACH_STATS: Stat[] = [
  { value: "3,000+", label: "Expected Reach" },
  { value: "50+", label: "Expected Athletes" },
  { value: "2,000+", label: "Schools & Clubs" },
  { value: "300+", label: "Parents & Spectators" },
  { value: "50,000+", label: "Coaches, Officials & Volunteers" },
  { value: "500+", label: "Photos, Videos & Reels" },
];

/** Foundation credibility metrics. */
export const FOUNDATION_STATS: Stat[] = [
  { value: "2015", label: "Founded with just 2 students" },
  { value: "500+", label: "Athletes currently training" },
  { value: "25", label: "Qualified coaches on staff" },
  { value: "5", label: "Academy locations" },
];

export const ACADEMY_LOCATIONS = [
  "Nehru Stadium",
  "Saravanampatti",
  "Decathlon",
  "Kovaipudur",
  "Tirupur",
];

export const FOUNDATION_ACHIEVEMENTS = [
  "Tamil Nadu Overall Championship Winner for the past 4 consecutive years",
  "Coimbatore District Overall Championship Winner",
  "Winners of Cross Country Championships",
  "Produced a Youth Asian Championship Medalist",
  "Consistently producing medal winners at the National, State, District, and University levels",
  "Every year, 20+ athletes from our academy secure jobs in central & state government sectors (Army, Police, Income Tax, Customs, etc.)",
];

export const IMPACT_USES = [
  "Flight tickets for State & National Championships",
  "Transportation, food & accommodation",
  "Sports equipment (spikes, shoes, training gear)",
  "Free training & education for deserving athletes",
  "International exposure camps, including elite training in Kenya",
];

export const SOCIAL_RESPONSIBILITY = [
  "Offering free training to deserving and underprivileged government school students",
  "Facilitating free education for athletes through sports quota admissions in reputed institutions like Loyola College, PSG Arts, etc.",
];

export const EVENT_CATEGORIES = ["8–10 yrs", "U12", "U14", "U17", "U19", "Open"];

export const SEED_TEAM: TeamMember[] = [
  {
    id: "t1",
    name: "K. Mohanraj",
    role_title: "President",
    bio: "Chairman, Creator Construction · International Athlete",
    photo_path: "/team/mohanraj.webp",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "t2",
    name: "Sivakumar S",
    role_title: "Vice President",
    bio: "VS. Foundation",
    photo_path: "/team/sivakumar.webp",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "t3",
    name: "Vairavanathan S",
    role_title: "Secretary",
    bio: "Chief Coach & Founder, Genesis Sports Foundation. World Athletics Level 2 certified, 10+ years building Coimbatore's athletics pipeline.",
    photo_path: "/team/vairavanathan.webp",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "t4",
    name: "Dr. Madhu Shankar",
    role_title: "Joint Secretary",
    bio: null,
    photo_path: "/team/madhu-shankar.webp",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "t5",
    name: "Maria Catherine D",
    role_title: "Treasurer",
    bio: null,
    photo_path: "/team/maria-catherine.webp",
    sort_order: 5,
    is_active: true,
  },
];

export const FOUNDER = {
  name: "Vairavanathan S",
  title: "Chief Coach & Founder",
  bio: "Coach Vairavanathan S founded Genesis Sports Foundation in 2015 and has guided it from two students to a 500-athlete academy with a decade-long track record of state and national medal winners. He leads coaching standards across all five Genesis academy locations.",
  philosophy:
    "Genesis athletes are trained on World Athletics–certified coaching standards — the same curriculum that underpins national and international programmes, brought directly to Coimbatore's grassroots.",
  qualifications: [
    { year: "2019", title: "World Athletics Level 1 Coaching Course", org: "SAI, Thiruvananthapuram" },
    { year: "2022", title: "World Athletics Level 2 Coaching Course", org: "SAI, Patiala" },
    { year: "2025", title: "Coaches' Refresher Course", org: "SAI, Bangalore" },
  ],
  stats: [
    { value: "10+ yrs", label: "Coaching Experience" },
    { value: "500+", label: "Athletes Guided" },
    { value: "5", label: "Academy Locations Led" },
  ],
};

/** Homepage hero slides (group_key = home_hero). image_path null -> gradient fallback. */
export const SEED_SLIDES: Slide[] = [
  {
    id: "s1",
    group_key: "home_hero",
    title: "Run. Jump. Throw. Grow.",
    subtitle: "Coimbatore's 1st Junior & Senior Athletic Championship",
    image_path: null,
    link_url: "/about-event",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "s2",
    group_key: "latest_events",
    title: "Two Days at Nehru Stadium",
    subtitle: "31 July & 1 August 2026 — six age categories, certified officials.",
    image_path: null,
    link_url: "/events",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "s3",
    group_key: "latest_events",
    title: "Become a Partner",
    subtitle: "Put your brand in front of an engaged, family-oriented audience.",
    image_path: null,
    link_url: "/sponsorship",
    sort_order: 2,
    is_active: true,
  },
];

export const SEED_EVENTS: EventItem[] = [
  {
    id: "e1",
    slug: "genesis-track-fest-2026",
    title: "Genesis Track Fest 2026",
    summary:
      "The flagship two-day Junior & Senior Athletic Championship at Nehru Stadium, Coimbatore.",
    body: "Genesis Track Fest is a professional athletics competition created to encourage school, club, and academy athletes. The event gives young athletes a platform to compete, perform, and grow with confidence — turning Nehru Stadium into a stage for Coimbatore's next generation of track and field talent. Now in its first edition as a Junior & Senior Athletic Championship, the Fest brings together athletes across six age categories, supported by certified officials, structured medal ceremonies, and a full programme of media coverage.",
    cover_image: null,
    start_date: "2026-07-31",
    end_date: "2026-08-01",
    location: "Nehru Stadium, Coimbatore",
    status: "published",
    sort_order: 1,
    live_tracking: false,
    show_schedule: true,
    registration_url: "https://forms.gle/your-registration-form",
    media: [],
  },
  {
    id: "e2",
    slug: "junior-championship-day-1",
    title: "Junior Championship — Day 1",
    summary: "U12, U14 & U17 track and field finals across the morning and afternoon sessions.",
    body: "Day one of the championship focuses on the junior age categories with heats, semi-finals, and finals across sprints, middle distance, jumps and throws, capped by a structured medal ceremony.",
    cover_image: null,
    start_date: "2026-07-31",
    end_date: "2026-07-31",
    location: "Nehru Stadium, Coimbatore",
    status: "published",
    sort_order: 2,
    live_tracking: false,
    show_schedule: true,
    registration_url: "https://forms.gle/your-registration-form",
    media: [],
  },
  {
    id: "e3",
    slug: "senior-open-championship-day-2",
    title: "Senior & Open Championship — Day 2",
    summary: "U19 and Open category finals, relays, and the closing medal ceremony.",
    body: "The second day brings the senior and open categories to the track, featuring marquee sprint finals, relays, and the grand closing ceremony celebrating the meet's champions.",
    cover_image: null,
    start_date: "2026-08-01",
    end_date: "2026-08-01",
    location: "Nehru Stadium, Coimbatore",
    status: "published",
    sort_order: 3,
    live_tracking: false,
    show_schedule: true,
    registration_url: "https://forms.gle/your-registration-form",
    media: [],
  },
  {
    id: "e4",
    slug: "genesis-state-meet-2025",
    title: "Genesis State Athletics Meet 2025",
    summary:
      "A landmark meet that crowned Genesis the Tamil Nadu overall champions for a fourth straight year.",
    body: "Held in early 2025, the State Athletics Meet brought together athletes from across Tamil Nadu. Genesis athletes delivered a standout campaign — multiple gold medals across sprints and distance events — sealing the overall state championship for the fourth consecutive year. The meet showcased the depth of the Genesis pipeline, from first-year juniors to national-level seniors.",
    cover_image: null,
    start_date: "2025-02-15",
    end_date: "2025-02-16",
    location: "Chennai, Tamil Nadu",
    status: "published",
    sort_order: 4,
    live_tracking: false,
    show_schedule: true,
    registration_url: null,
    media: [
      {
        type: "youtube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "State Meet 2025 — highlights reel",
      },
      {
        type: "instagram",
        url: "https://www.instagram.com/genesissportsfoundation/",
        caption: "Podium moments on our Instagram",
      },
    ],
  },
];

/** Forward-looking vision / future-plans points. */
export const FUTURE_PLANS = [
  {
    title: "A Genesis High-Performance Centre",
    detail:
      "A dedicated training base with modern track, recovery, and strength facilities so Coimbatore athletes train to international standards at home.",
  },
  {
    title: "More academy locations",
    detail:
      "Expanding beyond our current five centres to reach more schools and underprivileged communities across Tamil Nadu.",
  },
  {
    title: "An annual Genesis Track Fest",
    detail:
      "Growing the Track Fest into a fixture on the regional calendar — bigger fields, more categories, and live media every year.",
  },
  {
    title: "The road to an Olympic medal",
    detail:
      "Identifying and backing exceptional talent early, with the coaching, exposure, and support to compete on the world stage for India.",
  },
];

/** Editable site copy keyed like the site_content table. */
export const SITE_CONTENT: Record<string, string> = {
  "hero.eyebrow": "Genesis Sports Foundation · Coimbatore",
  "hero.title": "The Beginning of Sports",
  "hero.tagline":
    "A decade building champions — free and accessible athletics coaching that turns grassroots talent into national and international medal winners.",
  "foundation.purpose":
    "Genesis Sports Foundation exists to give every young athlete in Coimbatore a genuine path to excel — regardless of background. We provide world-class coaching, competition, and support so talent is discovered early and nurtured all the way to the national and international stage.",
  "event.oneliner": "Built to feel like a national-level meet from the very first year.",
  "foundation.quote": "From two students to five academies and four straight state titles — this is where that story opens to the public.",
  "future.intro": "We are only getting started. Here is where Genesis is headed.",
  "impact.commitment": "Every supporter is not just backing an event — they are investing in the future of Indian athletics. Together, we will build champions and win Olympic medals for India.",
  "hero.mode": "default",
  "hero.results_eyebrow": "Thank You, Coimbatore",
  "hero.results_title": "Genesis Track Fest 2026 — Complete",
  "hero.results_body":
    "A landmark two days at Nehru Stadium. Thank you to every athlete, coach, official, sponsor, and supporter who made the inaugural Genesis Track Fest possible. Results and highlights are below.",
  "hero.results_cta_label": "View Results",
  "hero.results_cta_href": "/blog",
};
