import { requireAdmin } from "@/lib/auth";
import { listContent } from "@/lib/admin-queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { SITE_CONTENT } from "@/lib/seed-data";

export default async function AdminContentPage() {
  await requireAdmin();
  const rows = await listContent();

  // Merge seeded defaults with any saved overrides so every editable key shows.
  const values: Record<string, string> = { ...SITE_CONTENT };
  for (const row of rows) {
    if (typeof row.value === "string") values[row.key] = row.value;
  }

  return (
    <div className="p-8">
      <AdminHeader
        title="Site Content"
        subtitle="Edit headline copy used across the public site. Changes publish immediately."
      />
      <ContentEditor values={values} />
    </div>
  );
}
