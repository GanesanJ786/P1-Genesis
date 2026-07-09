"use client";

import { useActionState } from "react";
import { saveBlogPost, type ActionResult } from "@/lib/actions/admin";
import { ImageUploader } from "./ImageUploader";
import { TextField, TextArea, SelectField, SubmitButton } from "./fields";
import type { Database } from "@/types/database.types";

type BlogRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export function BlogForm({ post }: { post?: BlogRow }) {
  const action = saveBlogPost.bind(null, post?.id ?? null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <TextField label="Title" name="title" required defaultValue={post?.title} />
      <TextField
        label="Slug (leave blank to auto-generate)"
        name="slug"
        defaultValue={post?.slug}
        placeholder="genesis-track-fest-2026-results"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Category"
          name="category"
          defaultValue={post?.category ?? "news"}
          options={[
            { value: "news", label: "News" },
            { value: "results", label: "Results" },
            { value: "stories", label: "Stories" },
            { value: "training", label: "Training" },
          ]}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={post?.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        />
      </div>

      <TextField
        label="Sort order (lower shows first; ties break by newest published)"
        name="sort_order"
        type="number"
        defaultValue={String(post?.sort_order ?? 0)}
      />

      <TextArea label="Excerpt (shown on listing page)" name="excerpt" defaultValue={post?.excerpt ?? ""} />
      <TextArea label="Body" name="body" rows={12} defaultValue={post?.body ?? ""} />

      <div>
        <p className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-sand">
          Cover image
        </p>
        <ImageUploader field="cover_image" folder="blog" defaultPath={post?.cover_image} />
        <div className="mt-4 max-w-xs">
          <SelectField
            label="Photo orientation"
            name="cover_image_orientation"
            defaultValue={post?.cover_image_orientation ?? "landscape"}
            options={[
              { value: "landscape", label: "Landscape — wide photo" },
              { value: "portrait", label: "Portrait — tall phone photo" },
            ]}
          />
          <p className="mt-1.5 text-xs text-sand/60">
            Portrait photos (e.g. a phone shot of an athlete) display taller on the post page
            instead of being cropped to a wide box.
          </p>
        </div>
      </div>

      {/* SEO — all optional; blank falls back to Title/Excerpt automatically. */}
      <fieldset className="space-y-5 rounded-xl border border-sand/15 p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-widest text-ember">
          SEO (optional)
        </legend>
        <p className="text-xs text-sand">
          Leave these blank to auto-use the Title and Excerpt. Fill them in to
          fine-tune how this post appears in Google and social shares.
        </p>
        <TextField
          label="Meta title — search headline (~60 chars)"
          name="meta_title"
          defaultValue={post?.meta_title ?? ""}
          placeholder="100m Boys Final Results — Genesis Track Fest 2026, Coimbatore"
        />
        <TextArea
          label="Meta description — search snippet (~155 chars)"
          name="meta_description"
          rows={2}
          defaultValue={post?.meta_description ?? ""}
        />
        <TextField
          label="Focus keyword — main phrase you want to rank for"
          name="focus_keyword"
          defaultValue={post?.focus_keyword ?? ""}
          placeholder="athletics results Coimbatore"
        />
      </fieldset>

      {state?.error ? <p className="text-sm text-ember-bright">{state.error}</p> : null}
      <SubmitButton>{post ? "Update post" : "Create post"}</SubmitButton>
    </form>
  );
}
