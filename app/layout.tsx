import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { SITE, CONTACT } from "@/lib/constants";
import { JsonLd } from "@/components/ui/JsonLd";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.headline}`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  keywords: [
    "Genesis Sports Foundation",
    "Genesis Sports Foundation Coimbatore",
    "athletics coaching Coimbatore",
    "athletics academy Coimbatore",
    "junior athletics Tamil Nadu",
    "track and field Coimbatore",
    "youth athletics India",
    "sports foundation Coimbatore",
    "Genesis Track Fest",
    "athletics championship Coimbatore",
    "Nehru Stadium Coimbatore events",
    "grassroots athletics India",
  ],
  openGraph: {
    title: `${SITE.name} — ${SITE.headline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  // App icons (favicon.ico, icon.png, apple-icon.png) are auto-registered from
  // the app/ directory via Next.js file conventions — no manual `icons` needed.
};

// Local-SEO structured data. A @graph lets the Organization and WebSite nodes
// cross-reference each other by @id so Google links the brand, site, and
// place. areaServed + Tamil/English languages + geo-scoped address are the
// signals that help ranking for "athletics coaching Coimbatore / Tamil Nadu".
const orgNode = {
  "@type": "SportsOrganization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.organiser,
  alternateName: "Genesis Sports Foundation Coimbatore",
  url: SITE.url,
  logo: `${SITE.url}/brand/genesis-logo.png`,
  image: `${SITE.url}/brand/genesis-logo.png`,
  description: SITE.description,
  slogan: SITE.tagline,
  sport: "Athletics",
  foundingDate: "2015",
  areaServed: [
    { "@type": "City", name: "Coimbatore" },
    { "@type": "State", name: "Tamil Nadu" },
    { "@type": "Country", name: "India" },
  ],
  knowsAbout: [
    "Athletics coaching",
    "Track and field",
    "Junior athletics",
    "Sprints, jumps and throws",
    "Grassroots sports development",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address,
    addressLocality: "Coimbatore",
    addressRegion: "Tamil Nadu",
    postalCode: "641002",
    addressCountry: "IN",
  },
  contactPoint: CONTACT.phones.map((p) => ({
    "@type": "ContactPoint",
    telephone: `+91${p.replace(/\s+/g, "")}`,
    contactType: "customer service",
    areaServed: "IN",
    availableLanguage: ["Tamil", "English"],
  })),
  email: CONTACT.emails[0],
  // Social profiles — links the brand entity to its social presence in Google's
  // knowledge graph. Add Facebook/other URLs here as they come online.
  sameAs: [
    "https://www.instagram.com/gsfteams/",
    "https://www.youtube.com/channel/UCE290WpWD_QQIciL74Bk0vw",
  ],
};

const websiteNode = {
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  description: SITE.description,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE.url}/#organization` },
};

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [orgNode, websiteNode],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <JsonLd data={siteSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-cream">
        {children}
      </body>
    </html>
  );
}
