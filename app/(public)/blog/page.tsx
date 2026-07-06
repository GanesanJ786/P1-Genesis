import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { BlogCard } from "@/components/public/BlogCard";
import { getPublishedBlogPosts } from "@/lib/queries";
import { Reveal } from "@/components/public/Reveal";
import { SITE } from "@/lib/constants";
import { cardGridClass } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "News, results, athlete stories, and training insights from Genesis Sports Foundation, Coimbatore.",
  keywords: [
    "Genesis Sports Foundation blog",
    "athletics news Coimbatore",
    "track and field results Tamil Nadu",
    "junior athlete stories India",
    "Coimbatore athletics coaching",
    "Genesis Track Fest updates",
  ],
  alternates: { canonical: `${SITE.url}/blog` },
  openGraph: {
    title: "Blog · Genesis Sports Foundation",
    description:
      "News, results, athlete stories, and training insights from Genesis Sports Foundation, Coimbatore.",
    type: "website",
    url: `${SITE.url}/blog`,
    siteName: SITE.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · Genesis Sports Foundation",
    description:
      "News, results, athlete stories, and training insights from Genesis Sports Foundation, Coimbatore.",
  },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <>
      <PageHero
        eyebrow="Foundation News"
        title="Blog"
        description="Updates, match results, athlete stories, and training insights from Genesis Sports Foundation."
      />

      <Section>
        <Container>
          {posts.length === 0 ? (
            <p className="text-sand">No posts yet — check back soon.</p>
          ) : (
            <div className={cardGridClass(posts.length)}>
              {posts.map((post, i) => (
                <Reveal key={post.id} delay={(i % 3) * 0.06}>
                  <BlogCard post={post} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
