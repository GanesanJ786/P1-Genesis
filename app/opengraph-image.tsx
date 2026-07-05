import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/constants";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await readFile(
    join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")
  );

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
            top: -120,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,83,31,0.22) 0%, transparent 70%)",
          }}
        />

        {/* Top: organiser name */}
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

        {/* Centre: event name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              color: "#f7f2ea",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            {SITE.name}
          </div>
          <div style={{ color: "#e8531f", fontSize: 26, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {SITE.tagline}
          </div>
        </div>

        {/* Bottom: venue + dates */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ color: "#b8ab98", fontSize: 20 }}>{SITE.venue}</span>
          <span
            style={{
              color: "#f7f2ea",
              fontSize: 18,
              background: "#1a1715",
              border: "1px solid rgba(184,171,152,0.2)",
              borderRadius: 8,
              padding: "8px 20px",
            }}
          >
            {SITE.dates}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: font, style: "normal", weight: 400 }],
    }
  );
}
