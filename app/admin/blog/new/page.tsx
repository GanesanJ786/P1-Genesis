import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function NewBlogPostPage() {
  await requireAdmin();
  return (
    <div className="p-8">
      <AdminHeader title="New Post" subtitle="Write and publish a blog post." />
      <BlogForm />
    </div>
  );
}
