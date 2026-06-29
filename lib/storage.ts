import { SUPABASE_URL } from "./supabase/config";
import { STORAGE_BUCKET } from "./constants";

/**
 * Resolve a stored image path to a renderable URL.
 * - Full URLs and local "/..." paths pass through unchanged.
 * - Bare storage paths become Supabase public-bucket URLs.
 * Returns null when nothing usable is available (callers show a fallback).
 */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
