import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/types/database.types";

export type SessionProfile = {
  id: string;
  email: string | undefined;
  full_name: string | null;
  role: UserRole;
};

/**
 * Returns the current user + profile, or null when signed out.
 *
 * Wrapped in React `cache()` so the auth round-trip (`getUser()` + the profile
 * lookup) runs at most ONCE per request — the admin layout and each page's
 * `requireAdmin()` share the same result instead of re-fetching, which is the
 * main reason the admin felt slow.
 */
export const getSessionProfile = cache(
  async function getSessionProfile(): Promise<SessionProfile | null> {
    if (!isSupabaseConfigured) return null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      role: (profile?.role ?? "staff") as UserRole,
    };
  },
);

const STAFF_ROLES: UserRole[] = ["admin", "staff", "coach"];

/**
 * Server-side guard for the admin panel and write actions. Redirects to login
 * when signed out; throws when the user lacks a staff role. Defense in depth on
 * top of middleware + RLS.
 */
export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/admin/login");
  if (!STAFF_ROLES.includes(profile.role)) {
    throw new Error("Forbidden: staff role required.");
  }
  return profile;
}
