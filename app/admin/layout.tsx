import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  // Signed out (or Supabase not configured): render the page bare. Every admin
  // page calls requireAdmin(), which redirects unauthenticated visitors to
  // /admin/login — so only the login page renders in this branch.
  if (!profile) {
    return <div className="min-h-screen bg-ink">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <AdminSidebar email={profile.email} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
