import Link from "next/link";
import { CalendarDays, Images, Handshake, Users, Inbox, ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  listEvents,
  listSlides,
  listSponsors,
  listTeam,
  countSubmissions,
} from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminDashboard() {
  const profile = await requireAdmin();
  const [events, slides, sponsors, team, submissions] = await Promise.all([
    listEvents(),
    listSlides(),
    listSponsors(),
    listTeam(),
    countSubmissions(),
  ]);

  const stats = [
    {
      label: "Events",
      value: events.length,
      sub: `${events.filter((e) => e.status === "published").length} published`,
      href: "/admin/events",
      icon: CalendarDays,
    },
    {
      label: "Slides",
      value: slides.length,
      sub: `${slides.filter((s) => s.is_active).length} active`,
      href: "/admin/slides",
      icon: Images,
    },
    { label: "Sponsors", value: sponsors.length, sub: "partners", href: "/admin/sponsors", icon: Handshake },
    { label: "Team", value: team.length, sub: "members", href: "/admin/team", icon: Users },
    { label: "Enquiries", value: submissions, sub: "contact form", href: "/admin", icon: Inbox },
  ];

  return (
    <div className="p-8">
      <AdminHeader
        title="Dashboard"
        subtitle={`Welcome back${profile.full_name ? `, ${profile.full_name}` : ""}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-white/10 bg-ink-soft p-6 transition-colors hover:border-ember/40"
          >
            <div className="flex items-start justify-between">
              <s.icon className="text-ember" size={22} />
              <ArrowRight
                size={16}
                className="text-sand opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
            <p className="mt-4 font-display text-4xl text-cream">{s.value}</p>
            <p className="text-sm text-cream">{s.label}</p>
            <p className="text-xs text-sand">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-xl uppercase text-cream">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/events/new" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-cream hover:border-ember hover:text-ember">
            + New event
          </Link>
          <Link href="/admin/slides/new" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-cream hover:border-ember hover:text-ember">
            + New slide
          </Link>
          <Link href="/admin/sponsors/new" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-cream hover:border-ember hover:text-ember">
            + New sponsor
          </Link>
        </div>
      </div>
    </div>
  );
}
