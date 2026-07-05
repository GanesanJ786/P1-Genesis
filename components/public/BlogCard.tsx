import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { mediaUrl } from "@/lib/storage";
import type { BlogPost } from "@/lib/queries";

const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  results: "Results",
  stories: "Stories",
  training: "Training",
};

export function BlogCard({ post }: { post: BlogPost }) {
  const img = mediaUrl(post.cover_image);
  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand/15 bg-ink-soft transition-colors hover:border-ember/50">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-video overflow-hidden">
        {img ? (
          <Image
            src={img}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-ember/20 via-ink-soft to-ink">
            <span className="font-display text-3xl uppercase text-ember/40">Genesis</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ember px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {published ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-sand">
            <CalendarDays size={12} className="text-ember" />
            {published}
          </span>
        ) : null}

        <h3 className="mt-2 font-display text-xl uppercase leading-tight text-cream">
          <Link href={`/blog/${post.slug}`} className="hover:text-ember">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-2 flex-1 text-sm text-sand">{post.excerpt}</p>
        ) : null}

        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-ember hover:gap-2"
        >
          Read more <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
