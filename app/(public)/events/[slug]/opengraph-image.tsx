import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getEventBySlug, getPublishedEvents } from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const events = await getPublishedEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  const font = await readFile(
    join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")
  );

  const title = event?.title ?? "Genesis Track Fest";
  const dateStr =
    event?.start_date
      ? formatDateRange(event.start_date, event.end_date ?? null)
      : SITE.dates;
  const location = event?.location ?? SITE.venue;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0c0a09",
          fontFamily: "Geist",
        }}
      >
        {/* Ember glow blob */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -60,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,83,31,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Top: site name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 6,
              height: 40,
              background: "#e8531f",
              borderRadius: 3,
            }}
          />
          <span style={{ color: "#b8ab98", fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {SITE.organiser}
          </span>
        </div>

        {/* Centre: event title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: "#e8531f",
              color: "#f7f2ea",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              borderRadius: 6,
              padding: "6px 16px",
              display: "flex",
              alignSelf: "flex-start",
            }}
          >
            Upcoming Event
          </div>
          <div
            style={{
              color: "#f7f2ea",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: date + location */}
        <div style={{ display: "flex", gap: 32 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              background: "#1a1715",
              border: "1px solid rgba(184,171,152,0.15)",
              borderRadius: 10,
              padding: "14px 24px",
            }}
          >
            <span style={{ color: "#b8ab98", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</span>
            <span style={{ color: "#f7f2ea", fontSize: 20 }}>{dateStr}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              background: "#1a1715",
              border: "1px solid rgba(184,171,152,0.15)",
              borderRadius: 10,
              padding: "14px 24px",
            }}
          >
            <span style={{ color: "#b8ab98", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Venue</span>
            <span style={{ color: "#f7f2ea", fontSize: 20 }}>{location}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: font, style: "normal", weight: 400 }],
    }
  );
}
