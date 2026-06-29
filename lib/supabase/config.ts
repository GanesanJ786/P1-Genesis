/** Single source of truth for whether Supabase is wired up. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when both public env vars are present. The data layer uses this to
 * decide between live Supabase queries and the bundled seed-data fallback, so
 * the public site renders before the backend is provisioned.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
