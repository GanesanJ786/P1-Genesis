import { z } from "zod";

/** Shared Zod schemas — used by both client forms and server actions. */

export const eventSchema = z.object({
  title: z.string().min(2, "Title is required").max(160),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  summary: z.string().max(400).optional().or(z.literal("")),
  body: z.string().max(8000).optional().or(z.literal("")),
  cover_image: z.string().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  sort_order: z.coerce.number().int().default(0),
  registration_url: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  media_links: z.string().max(4000).optional().or(z.literal("")),
  live_tracking: z.boolean().default(false),
  show_schedule: z.boolean().default(true),
});
export type EventInput = z.infer<typeof eventSchema>;

export const liveItemSchema = z.object({
  event_id: z.string().uuid("Pick the event this item belongs to"),
  // Free-form; the server slugifies it (so "100M Boys" → "100m-boys"), which is
  // why it isn't rejected for casing/spaces here.
  event_key: z.string().max(160).optional().or(z.literal("")),
  event_name: z.string().min(2, "Event name is required").max(160),
  category: z.string().min(1, "Category is required").max(80),
  gender: z.string().max(40).optional().or(z.literal("")),
  event_type: z.string().max(80).optional().or(z.literal("")),
  heat_label: z.string().max(80).optional().or(z.literal("")),
  day: z.coerce.number().int().min(1).default(1),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(["upcoming", "in_progress", "paused", "completed"]),
  scheduled_at: z.string().optional().or(z.literal("")),
  venue: z.string().max(160).optional().or(z.literal("")),
  poc_name: z.string().max(120).optional().or(z.literal("")),
  poc_phone: z.string().max(40).optional().or(z.literal("")),
  wind: z.string().max(40).optional().or(z.literal("")),
  participants_count: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  media_links: z.string().max(4000).optional().or(z.literal("")),
});
export type LiveItemInput = z.infer<typeof liveItemSchema>;

export const announcementSchema = z.object({
  event_id: z.string().uuid(),
  message: z.string().min(2, "Write a short message").max(500),
  type: z.enum(["info", "delay", "venue", "safety", "results"]).default("info"),
  is_pinned: z.boolean().default(false),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const slideSchema = z.object({
  group_key: z.string().min(1).default("home_hero"),
  title: z.string().max(160).optional().or(z.literal("")),
  subtitle: z.string().max(280).optional().or(z.literal("")),
  image_path: z.string().min(1, "An image is required"),
  link_url: z.string().max(400).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type SlideInput = z.infer<typeof slideSchema>;

export const sponsorSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  tier: z.enum([
    "title",
    "platinum",
    "gold",
    "silver",
    "bronze",
    "medical",
    "partner",
    "supporter",
  ]),
  description: z.string().max(600).optional().or(z.literal("")),
  logo_path: z.string().optional().or(z.literal("")),
  banner_path: z.string().optional().or(z.literal("")),
  website_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  amount_inr: z.coerce.number().int().nonnegative().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});
export type SponsorInput = z.infer<typeof sponsorSchema>;

export const teamMemberSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  role_title: z.string().max(160).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  photo_path: z.string().optional().or(z.literal("")),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export const blogPostSchema = z.object({
  title: z.string().min(2, "Title is required").max(160),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  excerpt: z.string().max(400).optional().or(z.literal("")),
  body: z.string().max(12000).optional().or(z.literal("")),
  cover_image: z.string().optional().or(z.literal("")),
  cover_image_orientation: z.enum(["landscape", "portrait"]).default("landscape"),
  category: z.enum(["news", "results", "stories", "training"]).default("news"),
  status: z.enum(["draft", "published"]).default("draft"),
  sort_order: z.coerce.number().int().default(0),
  // Optional SEO overrides — blank falls back to title/excerpt at render time.
  meta_title: z.string().max(70).optional().or(z.literal("")),
  meta_description: z.string().max(160).optional().or(z.literal("")),
  focus_keyword: z.string().max(80).optional().or(z.literal("")),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  // Triage category (join / sponsor / media …). Optional + free-form-tolerant so
  // an older cached form without the field still submits; the server maps an
  // unknown/blank value to a readable label.
  enquiryType: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(5, "Tell us a little more").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;
