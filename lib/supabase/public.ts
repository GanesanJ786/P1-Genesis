import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less anon client for PUBLIC reads. Because it never touches cookies,
 * pages that use it can be statically rendered + ISR-cached — so high traffic
 * is served from the edge cache and the database is hit only on revalidation,
 * keeping Supabase egress tiny and well inside the free tier.
 *
 * RLS still applies: anon sees only published/active rows.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
