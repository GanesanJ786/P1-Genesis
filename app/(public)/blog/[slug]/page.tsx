import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/queries";
import { mediaUrl } from "@/lib/storage";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  results: "Results",
  stories: "Stories",
  training: "Training",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const img = mediaUrl(post.cover_image);

  const postSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.published_at ?? post.created_at,
    author: { "@type": "Organization", name: SITE.organiser, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.organiser, url: SITE.url },
    url: `${SITE.url}/blog/${post.slug}`,
    ...(img ? { image: img } : {}),
  };

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <JsonLd data={postSchema} />
      {/* Breadcrumb */}
      <div className="border-b border-sand/10 bg-ink-soft/40">
        <Container className="py-4">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs text-sand">
            <Link href="/" className="hover:text-cream">Home</Link>
            <span aria-hidden>›</span>
            <Link href="/blog" className="hover:text-cream">Blog</Link>
            <span aria-hidden>›</span>
            <span className="text-cream">{post.title}</span>
          </nav>
        </Container>
      </div>

      <Section>
        <Container className="max-w-3xl">
          {/* Back link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-sand hover:text-cream"
          >
            <ArrowLeft size={15} /> Back to Blog
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-ember px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
            {published ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-sand">
                <CalendarDays size={12} className="text-ember" />
                {published}
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h1 className="mt-4 font-display text-4xl uppercase leading-tight text-cream sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-4 text-lg text-cream/75">{post.excerpt}</p>
          ) : null}

          {/* Cover image */}
          {img ? (
            <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl">
              <Image src={img} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
            </div>
          ) : null}

          {/* Body */}
          {post.body ? (
            <div className="prose prose-invert mt-10 max-w-none text-sand [&_h2]:font-display [&_h2]:uppercase [&_h2]:text-cream [&_a]:text-ember [&_strong]:text-cream">
              {post.body.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}

          {/* Footer nav */}
          <div className="mt-12 border-t border-sand/10 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-sand hover:text-cream"
            >
              <ArrowLeft size={15} /> All posts
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
