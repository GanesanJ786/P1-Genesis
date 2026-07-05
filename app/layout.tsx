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

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: SITE.organiser,
  url: SITE.url,
  sport: "Athletics",
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address,
    addressLocality: "Coimbatore",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
  contactPoint: [
    { "@type": "ContactPoint", telephone: CONTACT.phones[0], contactType: "customer service" },
  ],
  email: CONTACT.emails[0],
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
        <JsonLd data={orgSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-cream">
        {children}
      </body>
    </html>
  );
}
