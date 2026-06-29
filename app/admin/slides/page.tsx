import Link from "next/link";
import Image from "next/image";
import { Pencil, ImageOff } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listSlides } from "@/lib/admin-queries";
import { deleteSlide } from "@/lib/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { mediaUrl } from "@/lib/storage";

export default async function AdminSlidesPage() {
  await requireAdmin();
  const slides = await listSlides();

  return (
    <div className="p-8">
      <AdminHeader
        title="Slides"
        subtitle="Upload and order images for the homepage hero and event carousels."
        action={{ href: "/admin/slides/new", label: "New slide" }}
      />

      {slides.length === 0 ? (
        <p className="text-sand">No slides yet. Upload your first one.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s) => {
            const img = mediaUrl(s.image_path);
            return (
              <div key={s.id} className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
                <div className="relative h-36 bg-ink">
                  {img ? (
                    <Image src={img} alt={s.title ?? "Slide"} fill className="object-cover" sizes="33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sand/40">
                      <ImageOff size={28} />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-cream">
                    {s.group_key}
                  </span>
                  {!s.is_active ? (
                    <span className="absolute right-2 top-2 rounded-full bg-ember/80 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-white">
                      hidden
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="truncate font-medium text-cream">{s.title || "Untitled slide"}</p>
                  <p className="truncate text-xs text-sand">{s.subtitle}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-sand">Order: {s.sort_order}</span>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/slides/${s.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand hover:border-ember/50 hover:text-ember"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                      <DeleteButton action={deleteSlide.bind(null, s.id, s.image_path)} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
