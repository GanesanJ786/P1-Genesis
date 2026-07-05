import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import type { Database } from "@/types/database.types";

/**
 * Cookie-aware server Supabase client for RSC, route handlers, and server
 * actions. Reads/writes the session cookie so RLS sees the logged-in user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll can be called from a Server Component, where cookie mutation
          // is not allowed. Server Actions and the browser client (autoRefresh)
          // persist refreshed tokens instead, so swallowing this is safe.
        }
      },
    },
  });
}
