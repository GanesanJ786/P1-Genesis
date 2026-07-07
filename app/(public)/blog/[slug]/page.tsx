import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { BlogCard } from "@/components/public/BlogCard";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/queries";
import { mediaUrl } from "@/lib/storage";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  results: "Results",
  stories: "Stories",
  training: "Training",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  news: ["Genesis Sports Foundation news", "athletics news Coimbatore", "sports news Tamil Nadu"],
  results: ["athletics results Coimbatore", "track and field results", "race results Tamil Nadu", "junior athletics results India"],
  stories: ["athlete story Coimbatore", "young athlete India", "Genesis Sports Foundation athlete", "junior athlete Tamil Nadu"],
  training: ["athletics training Coimbatore", "track and field coaching", "junior athletics coaching Tamil Nadu", "Genesis Sports Foundation training"],
};

/**
 * Meta description used by search + social. Priority: the author's SEO
 * override → excerpt → a ~155-char snippet derived from the body, so every
 * post ships a description (a missing one hurts click-through and rankings).
 */
function metaDescriptionFor(post: {
  meta_description: string | null;
  excerpt: string | null;
  body: string | null;
}): string | undefined {
  if (post.meta_description) return post.meta_description;
  if (post.excerpt) return post.excerpt;
  if (!post.body) return undefined;
  const text = post.body.replace(/[#*_>`[\]]/g, "").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  const canonicalUrl = `${SITE.url}/blog/${post.slug}`;
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;
  const description = metaDescriptionFor(post);
  const seoTitle = post.meta_title || post.title;
  const keywords = [
    ...(post.focus_keyword ? [post.focus_keyword] : []),
    ...(CATEGORY_KEYWORDS[post.category] ?? []),
    "Genesis Sports Foundation",
    "Coimbatore athletics",
    "Genesis Track Fest",
  ];

  return {
    title: seoTitle,
    description,
    keywords,
    authors: [{ name: SITE.organiser, url: SITE.url }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: SITE.name,
      locale: "en_IN",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.published_at ?? undefined,
      authors: [SITE.organiser],
      section: categoryLabel,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  // Related posts — same category first (most relevant internal links), then
  // topped up with other recent posts so the section rarely renders empty.
  // Internal linking helps crawl depth, indexing, and time-on-page.
  const allPosts = await getPublishedBlogPosts();
  const sameCategory = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category);
  const others = allPosts.filter((p) => p.slug !== post.slug && p.category !== post.category);
  const related = [...sameCategory, ...others].slice(0, 3);

  const img = mediaUrl(post.cover_image);
  const canonicalUrl = `${SITE.url}/blog/${post.slug}`;
  const wordCount = post.body ? post.body.split(/\s+/).length : undefined;
  const description = metaDescriptionFor(post);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const postSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: post.title,
    description,
    articleSection: CATEGORY_LABELS[post.category] ?? post.category,
    keywords: [
      ...(post.focus_keyword ? [post.focus_keyword] : []),
      ...(CATEGORY_KEYWORDS[post.category] ?? []),
      "Genesis Sports Foundation",
      "Coimbatore athletics",
    ].join(", "),
    ...(wordCount ? { wordCount } : {}),
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.published_at ?? post.created_at,
    author: { "@type": "Organization", name: SITE.organiser, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.organiser,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}/brand/genesis-logo.png` },
    },
    url: canonicalUrl,
    ...(img ? { image: { "@type": "ImageObject", url: img } } : {}),
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
      <JsonLd data={breadcrumbSchema} />
      {/* Breadcrumb — pt-20/24 clears the fixed navbar */}
      <div className="border-b border-sand/10 bg-ink pt-20 sm:pt-24">
        <Container className="pb-3">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-sand">
            <Link href="/" className="shrink-0 hover:text-ember transition-colors">Home</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <Link href="/blog" className="shrink-0 hover:text-ember transition-colors">Blog</Link>
            <span aria-hidden className="shrink-0 text-sand/40">›</span>
            <span className="truncate text-cream/80">{post.title}</span>
          </nav>
        </Container>
      </div>

      <Section>
        <Container className="max-w-3xl">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-sand hover:text-cream"
          >
            <ArrowLeft size={15} /> Back to Blog
          </Link>

          <article itemScope itemType="https://schema.org/BlogPosting">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full bg-ember px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                itemProp="articleSection"
              >
                {CATEGORY_LABELS[post.category] ?? post.category}
              </span>
              {published ? (
                <time
                  dateTime={post.published_at ?? post.created_at}
                  itemProp="datePublished"
                  className="inline-flex items-center gap-1.5 text-xs text-sand"
                >
                  <CalendarDays size={12} className="text-ember" />
                  {published}
                </time>
              ) : null}
            </div>

            {/* Title */}
            <h1
              className="mt-4 font-display text-4xl uppercase leading-tight text-cream sm:text-5xl"
              itemProp="headline"
            >
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="mt-4 text-lg text-cream/75" itemProp="description">
                {post.excerpt}
              </p>
            ) : null}

            {/* Cover image */}
            {img ? (
              <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl">
                <Image
                  src={img}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  itemProp="image"
                />
              </div>
            ) : null}

            {/* Body */}
            {post.body ? (
              <div
                className="prose prose-invert mt-10 max-w-none text-sand [&_h2]:font-display [&_h2]:uppercase [&_h2]:text-cream [&_a]:text-ember [&_strong]:text-cream"
                itemProp="articleBody"
              >
                {post.body.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : null}

            <meta itemProp="author" content={SITE.organiser} />
            <meta itemProp="publisher" content={SITE.organiser} />
            <link itemProp="url" href={canonicalUrl} />
          </article>

          {/* Related posts — internal links to keep readers on-site */}
          {related.length > 0 ? (
            <section className="mt-16 border-t border-sand/10 pt-10">
              <p className="eyebrow mb-6">More from the blog</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <BlogCard key={r.id} post={r} />
                ))}
              </div>
            </section>
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
