import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getPublishedEvents } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about-event",
    "/sponsorship",
    "/foundation",
    "/team",
    "/achievements",
    "/events",
    "/contact",
  ].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const events = await getPublishedEvents();
  const eventRoutes = events.map((e) => ({
    url: `${SITE.url}/events/${e.slug}`,
    lastModified: new Date(e.start_date ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...eventRoutes];
}
