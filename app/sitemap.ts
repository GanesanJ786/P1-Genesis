import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getPublishedEvents, getPublishedBlogPosts } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about-event",
    "/sponsorship",
    "/foundation",
    "/team",
    "/achievements",
    "/events",
    "/blog",
    "/contact",
  ].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const [events, posts] = await Promise.all([getPublishedEvents(), getPublishedBlogPosts()]);

  const eventRoutes = events.map((e) => ({
    url: `${SITE.url}/events/${e.slug}`,
    lastModified: new Date(e.start_date ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const blogRoutes = posts.map((p) => ({
    url: `${SITE.url}/blog/${p.slug}`,
    lastModified: new Date(p.published_at ?? p.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...eventRoutes, ...blogRoutes];
}
