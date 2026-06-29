"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  Handshake,
  Users,
  FileText,
  ExternalLink,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/slides", label: "Slides", icon: Images },
  { href: "/admin/sponsors", label: "Sponsors", icon: Handshake },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/content", label: "Site Content", icon: FileText },
];

export function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-ink-soft">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-display text-lg uppercase text-cream"
        >
          <Image
            src="/brand/genesis-emblem.png"
            alt="Genesis Sports Foundation"
            width={512}
            height={255}
            className="h-7 w-auto"
          />
          Genesis<span className="text-ember"> Admin</span>
        </Link>
        <p className="mt-1 truncate text-xs text-sand">{email}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {LINKS.map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-ember/15 text-ember"
                  : "text-sand hover:bg-white/5 hover:text-cream",
              )}
            >
              <l.icon size={17} />
              {l.label}
            </Link>
          );
        })}

        {/* Future module — pre-stubbed, disabled for now */}
        <div className="mt-4 px-3 pb-1 text-[0.65rem] uppercase tracking-widest text-sand/50">
          Coming soon
        </div>
        <div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sand/40">
          <GraduationCap size={17} />
          Students & Coaches
        </div>
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sand hover:bg-white/5 hover:text-cream"
        >
          <ExternalLink size={17} /> View site
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sand hover:bg-white/5 hover:text-ember">
            <LogOut size={17} /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
