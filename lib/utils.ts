import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turn a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format an INR amount in the Indian lakh convention (e.g. 500000 -> "₹5,00,000"). */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return "";
  return "₹" + amount.toLocaleString("en-IN");
}

/** Format an event date range like "31 Jul – 1 Aug 2026". */
export function formatDateRange(
  start?: string | null,
  end?: string | null,
): string {
  if (!start) return "";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(start);
  if (!end || end === start) {
    return s.toLocaleDateString("en-GB", { ...opts, year: "numeric" });
  }
  const e = new Date(end);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`;
}
