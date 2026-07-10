import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import {
  getPublishedEvents,
  getPublishedBlogPosts,
  getLiveTrackedEvents,
} from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { path: "", freq: "monthly" as const, pri: 1 },
    { path: "/live", freq: "always" as const, pri: 0.9 },
    { path: "/about-event", freq: "monthly" as const, pri: 0.7 },
    { path: "/sponsorship", freq: "monthly" as const, pri: 0.7 },
    { path: "/foundation", freq: "monthly" as const, pri: 0.7 },
    { path: "/team", freq: "monthly" as const, pri: 0.7 },
    { path: "/achievements", freq: "monthly" as const, pri: 0.7 },
    { path: "/events", freq: "monthly" as const, pri: 0.7 },
    { path: "/blog", freq: "monthly" as const, pri: 0.7 },
    { path: "/faq", freq: "monthly" as const, pri: 0.6 },
    { path: "/contact", freq: "monthly" as const, pri: 0.7 },
  ].map(({ path, freq, pri }) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority: pri,
  }));

  const [events, posts, liveEvents] = await Promise.all([
    getPublishedEvents(),
    getPublishedBlogPosts(),
    getLiveTrackedEvents(),
  ]);

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

  const liveRoutes = liveEvents.map((e) => ({
    url: `${SITE.url}/live/${e.slug}`,
    lastModified: new Date(),
    changeFrequency: "always" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...eventRoutes, ...blogRoutes, ...liveRoutes];
}
