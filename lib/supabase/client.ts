"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import type { Database } from "@/types/database.types";

/**
 * Browser Supabase client (anon key). Used for auth sign-in and authenticated
 * Storage uploads from the admin panel. Safe to ship to the client.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
