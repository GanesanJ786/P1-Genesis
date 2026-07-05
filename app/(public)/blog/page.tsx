import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Section";
import { PageHero } from "@/components/public/PageHero";
import { BlogCard } from "@/components/public/BlogCard";
import { getPublishedBlogPosts } from "@/lib/queries";
import { Reveal } from "@/components/public/Reveal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "News, results, athlete stories, and training insights from Genesis Sports Foundation, Coimbatore.",
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
