import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/queries";
import { SITE } from "@/lib/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  results: "Results",
  stories: "Athlete Stories",
  training: "Training",
};

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  const font = await readFile(
    join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")
  );

  const title = post?.title ?? "Genesis Sports Foundation Blog";
  const excerpt = post?.excerpt ?? SITE.description;
  const category = post?.category ? (CATEGORY_LABELS[post.category] ?? post.category) : "Blog";

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
        {/* Ember glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,83,31,0.20) 0%, transparent 70%)",
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

        {/* Centre: category + title */}
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
            {category}
          </div>
          <div
            style={{
              color: "#f7f2ea",
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              maxWidth: 920,
            }}
          >
            {title}
          </div>
          {excerpt ? (
            <div
              style={{
                color: "#b8ab98",
                fontSize: 22,
                lineHeight: 1.5,
                maxWidth: 840,
              }}
            >
              {excerpt.length > 120 ? excerpt.slice(0, 117) + "…" : excerpt}
            </div>
          ) : null}
        </div>

        {/* Bottom: site URL */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#e8531f" }} />
          <span style={{ color: "#b8ab98", fontSize: 18 }}>{SITE.url.replace("https://", "")}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: font, style: "normal", weight: 400 }],
    }
  );
}
