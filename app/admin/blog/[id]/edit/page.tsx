import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBlogPost } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();

  return (
    <div className="p-8">
      <AdminHeader title="Edit Post" subtitle={post.title} />
      <BlogForm post={post} />
    </div>
  );
}
