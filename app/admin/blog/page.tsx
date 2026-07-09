import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listBlogPosts } from "@/lib/admin-queries";
import { deleteBlogPost } from "@/lib/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";

const CATEGORY_STYLES: Record<string, string> = {
  news: "bg-blue-500/15 text-blue-400",
  results: "bg-green-500/15 text-green-400",
  stories: "bg-purple-500/15 text-purple-400",
  training: "bg-yellow-500/15 text-yellow-400",
};

export default async function AdminBlogPage() {
  await requireAdmin();
  const posts = await listBlogPosts();

  return (
    <div className="p-8">
      <AdminHeader
        title="Blog"
        subtitle="Publish news, results, and stories for the foundation."
        action={{ href: "/admin/blog/new", label: "New post" }}
      />

      {posts.length === 0 ? (
        <p className="text-sand">No posts yet. Create your first one.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-sand">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Published</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="px-5 py-4 text-sand">{p.sort_order}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-cream">{p.title}</p>
                    <p className="text-xs text-sand">/{p.slug}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${CATEGORY_STYLES[p.category] ?? "bg-white/10 text-sand"}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${p.status === "published" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sand">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/blog/${p.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-sand hover:border-ember/50 hover:text-ember"
                      >
                        <Pencil size={13} /> Edit
                      </Link>
                      <DeleteButton action={deleteBlogPost.bind(null, p.id, p.cover_image)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
